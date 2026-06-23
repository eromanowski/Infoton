#!/usr/bin/env python3
"""
Dual Arty A7 thermal soak — orchestrate P30 vs Hamming firmware + INA260 power log.

Usage:
  python tools/bench_dual_fpga.py --dry-run
  python tools/bench_dual_fpga.py \\
    --p30-port COM3 --hamming-port COM4 \\
    --ina-p30 0x40 --ina-hamming 0x41 \\
    --duration 3600 --burn-in 1800

Requires: pyserial (optional smbus2 for INA260 on Linux; mock mode without hardware)
"""

from __future__ import annotations

import argparse
import csv
import re
import statistics
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT = ROOT / "benches" / "thermal"


@dataclass
class InaReading:
    voltage_v: float
    current_a: float
    power_w: float


class MockIna260:
    """Placeholder when no I2C sensor attached."""

    def __init__(self, addr: int, label: str, base_w: float) -> None:
        self.addr = addr
        self.label = label
        self.base_w = base_w

    def read(self) -> InaReading:
        import math

        t = time.time()
        ripple = 0.02 * math.sin(t / 17.0)
        p = self.base_w + ripple
        return InaReading(voltage_v=5.0, current_a=p / 5.0, power_w=p)


def open_ina(addr: int, label: str, mock_w: float):
    try:
        import smbus2

        bus = smbus2.SMBus(1)

        class Ina260:
            def read(self) -> InaReading:
                # Adafruit INA260 register map (simplified)
                def reg(r: int) -> int:
                    return bus.read_i2c_block_data(addr, r, 2)[0] << 8 | bus.read_i2c_block_data(addr, r, 2)[1]

                # Use cached block read properly
                def u16(r: int) -> int:
                    d = bus.read_i2c_block_data(addr, r, 2)
                    return d[0] << 8 | d[1]

                current_ma = u16(0x01)
                if current_ma & 0x8000:
                    current_ma -= 65536
                bus_v = u16(0x02) * 1.25 / 1000.0
                power_mw = u16(0x03) * 10.0
                return InaReading(
                    voltage_v=bus_v,
                    current_a=current_ma / 1000.0,
                    power_w=power_mw / 1000.0,
                )

        return Ina260()
    except Exception:
        print(f"INA260 0x{addr:02x} ({label}): mock mode ~{mock_w:.2f} W", file=sys.stderr)
        return MockIna260(addr, label, mock_w)


def open_serial(port: str, baud: int):
    try:
        import serial
    except ImportError as e:
        raise SystemExit("pip install pyserial") from e
    ser = serial.Serial(port, baud, timeout=0.5)
    time.sleep(0.2)
    return ser


def uart_cmd(ser, line: str, wait: float = 0.3) -> str:
    ser.reset_input_buffer()
    ser.write((line.strip() + "\n").encode("ascii"))
    ser.flush()
    time.sleep(wait)
    return ser.read(ser.in_waiting or 4096).decode("utf-8", errors="replace")


TICK_RE = re.compile(r"TICK passes=([0-9a-fA-F]+)")
PASS_RE = re.compile(r"OK PASS ops=([0-9a-fA-F]+)", re.I)


@dataclass
class Sample:
    ts: str
    elapsed_s: float
    p30_w: float
    hamming_w: float
    p30_passes: int | None = None
    hamming_passes: int | None = None
    notes: str = ""


@dataclass
class BenchState:
    samples: list[Sample] = field(default_factory=list)
    p30_ticks: int = 0
    hamming_ticks: int = 0


def parse_ticks(text: str) -> int | None:
    m = TICK_RE.search(text)
    if not m:
        return None
    return int(m.group(1), 16)


def run_bench_rate(args: argparse.Namespace) -> Path:
    """Mode RATE: host sends PASS to both boards at fixed Hz (publishable chain)."""
    DEFAULT_OUT.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out_path = DEFAULT_OUT / f"soak_rate_{stamp}.csv"
    period = 1.0 / args.rate

    if args.dry_run:
        print(f"Would write: {out_path} mode=rate rate={args.rate}Hz")
        return out_path

    p30_ser = open_serial(args.p30_port, args.baud)
    ham_ser = open_serial(args.hamming_port, args.baud)
    ina_p30 = open_ina(args.ina_p30, "p30", mock_w=1.85)
    ina_ham = open_ina(args.ina_hamming, "hamming", mock_w=2.40)

    rows: list[dict] = []
    t0 = time.time()
    n = 0

    def one_window(note: str) -> None:
        nonlocal n
        w0 = time.time()
        p30_ser.reset_input_buffer()
        ham_ser.reset_input_buffer()
        p30_ser.write(b"PASS\n")
        ham_ser.write(b"PASS\n")
        time.sleep(0.05)
        p30_resp = p30_ser.read(p30_ser.in_waiting or 256).decode(errors="replace")
        ham_resp = ham_ser.read(ham_ser.in_waiting or 256).decode(errors="replace")
        # Integrate power over remainder of period
        samples_p: list[float] = []
        samples_h: list[float] = []
        while time.time() - w0 < period:
            samples_p.append(ina_p30.read().power_w)
            samples_h.append(ina_ham.read().power_w)
            time.sleep(min(0.05, period / 10))
        e_p = sum(samples_p) / max(len(samples_p), 1) * period
        e_h = sum(samples_h) / max(len(samples_h), 1) * period
        n += 1
        if note != "burn-in":
            rows.append(
                {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "elapsed_s": round(time.time() - t0, 2),
                    "rate_hz": args.rate,
                    "p30_energy_j": round(e_p, 6),
                    "hamming_energy_j": round(e_h, 6),
                    "energy_ratio_h_p": round(e_h / max(e_p, 1e-9), 4),
                    "p30_avg_power_w": round(e_p / period, 4),
                    "hamming_avg_power_w": round(e_h / period, 4),
                    "p30_pass_resp": p30_resp.strip(),
                    "hamming_pass_resp": ham_resp.strip(),
                    "pass_index": n,
                }
            )

    while time.time() - t0 < args.burn_in:
        one_window("burn-in")
    rec_end = time.time() + args.duration
    while time.time() < rec_end:
        one_window("")

    with out_path.open("w", newline="", encoding="utf-8") as f:
        if rows:
            w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
            w.writeheader()
            w.writerows(rows)

    if rows:
        e_ratio = statistics.mean(float(r["hamming_energy_j"]) for r in rows) / statistics.mean(
            float(r["p30_energy_j"]) for r in rows
        )
        print(f"Recorded {len(rows)} rate windows -> {out_path}")
        print(f"  mean energy ratio H/P: {e_ratio:.2f}x")

    p30_ser.close()
    ham_ser.close()
    return out_path


def run_bench(args: argparse.Namespace) -> Path:
    if args.mode == "rate":
        return run_bench_rate(args)
    DEFAULT_OUT.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out_path = DEFAULT_OUT / f"soak_{stamp}.csv"

    if args.dry_run:
        print(f"Would write: {out_path}")
        print(f"  P30 port:     {args.p30_port}")
        print(f"  Hamming port: {args.hamming_port}")
        print(f"  burn-in:      {args.burn_in}s  duration: {args.duration}s")
        return out_path

    p30_ser = open_serial(args.p30_port, args.baud)
    ham_ser = open_serial(args.hamming_port, args.baud)
    ina_p30 = open_ina(args.ina_p30, "p30", mock_w=1.85)
    ina_ham = open_ina(args.ina_hamming, "hamming", mock_w=2.40)

    print("Starting soak firmware...")
    uart_cmd(p30_ser, "START LIBRARY" if args.p30_mode == "library" else "START BIOS")
    uart_cmd(ham_ser, "START")

    t0 = time.time()
    state = BenchState()

    def log_sample(note: str = "") -> None:
        elapsed = time.time() - t0
        rp = ina_p30.read()
        rh = ina_ham.read()
        # Drain UART ticks
        if p30_ser.in_waiting:
            state.p30_ticks = parse_ticks(p30_ser.read(p30_ser.in_waiting).decode(errors="replace")) or state.p30_ticks
        if ham_ser.in_waiting:
            state.hamming_ticks = parse_ticks(ham_ser.read(ham_ser.in_waiting).decode(errors="replace")) or state.hamming_ticks
        state.samples.append(
            Sample(
                ts=datetime.now(timezone.utc).isoformat(),
                elapsed_s=round(elapsed, 2),
                p30_w=round(rp.power_w, 4),
                hamming_w=round(rh.power_w, 4),
                p30_passes=state.p30_ticks,
                hamming_passes=state.hamming_ticks,
                notes=note,
            )
        )

    print(f"Burn-in {args.burn_in}s...")
    while time.time() - t0 < args.burn_in:
        log_sample("burn-in")
        time.sleep(args.interval)

    print(f"Recording {args.duration}s...")
    record_start = time.time()
    while time.time() - record_start < args.duration:
        log_sample("")
        time.sleep(args.interval)

    with out_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(
            [
                "timestamp",
                "elapsed_s",
                "p30_power_w",
                "hamming_power_w",
                "delta_w",
                "p30_passes",
                "hamming_passes",
                "notes",
            ]
        )
        for s in state.samples:
            w.writerow(
                [
                    s.ts,
                    s.elapsed_s,
                    s.p30_w,
                    s.hamming_w,
                    round(s.hamming_w - s.p30_w, 4),
                    s.p30_passes or "",
                    s.hamming_passes or "",
                    s.notes,
                ]
            )

    rec = [s for s in state.samples if s.notes != "burn-in"]
    if rec:
        mean_p30 = sum(s.p30_w for s in rec) / len(rec)
        mean_ham = sum(s.hamming_w for s in rec) / len(rec)
        print(f"Recorded {len(rec)} samples -> {out_path}")
        print(f"  mean P30 power:     {mean_p30:.3f} W")
        print(f"  mean Hamming power: {mean_ham:.3f} W")
        print(f"  mean delta:         {mean_ham - mean_p30:.3f} W (Hamming - P30)")
        if mean_p30 > 0:
            print(f"  ratio Hamming/P30:  {mean_ham / mean_p30:.2f}x")

    p30_ser.close()
    ham_ser.close()
    return out_path


def main() -> None:
    p = argparse.ArgumentParser(description="Dual FPGA thermal soak logger")
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--p30-port", default="COM3", help="UART for P30 soak board")
    p.add_argument("--hamming-port", default="COM4", help="UART for Hamming soak board")
    p.add_argument("--ina-p30", type=lambda x: int(x, 0), default=0x40)
    p.add_argument("--ina-hamming", type=lambda x: int(x, 0), default=0x41)
    p.add_argument("--baud", type=int, default=115200)
    p.add_argument("--mode", choices=("max", "rate"), default="max")
    p.add_argument("--rate", type=float, default=1.0, help="PASS Hz in rate mode")
    p.add_argument("--p30-mode", choices=("library", "bios"), default="library")
    p.add_argument("--burn-in", type=int, default=1800, help="Burn-in seconds (default 30 min)")
    p.add_argument("--duration", type=int, default=3600, help="Record seconds (default 1 h)")
    p.add_argument("--interval", type=float, default=5.0, help="Sample interval seconds")
    args = p.parse_args()
    run_bench(args)


if __name__ == "__main__":
    main()
