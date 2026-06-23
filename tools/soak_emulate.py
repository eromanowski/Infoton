#!/usr/bin/env python3
"""
Emulate dual-FPGA thermal soak on the host (no Arty boards required).

Modes:
  max  — both loops at full CPU (pass-rate ratio ~25x)
  rate — matched validations/sec (publishable E_H/E_P chain)

Usage:
  python tools/soak_emulate.py --mode max
  python tools/soak_emulate.py --mode rate --rate 1 --duration 10
"""

from __future__ import annotations

import argparse
import csv
import statistics
import sys
import threading
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))

from soak_core import (  # noqa: E402
    ACTIVE_POWER_W,
    BIOS_SOAK_OPS_PER_PASS,
    HAMMING_OPS_PER_PASS,
    IDLE_POWER_W,
    LIBRARY_OPS_PER_PASS,
    OP_RATIO_LIBRARY,
    load_corpus,
    rate_window_energy,
    run_hamming_pass,
    run_p30_pass,
    simulated_pass_duration,
)

DEFAULT_OUT = ROOT / "benches" / "thermal"
POWER_BASE_W = 1.75
POWER_SCALE = 0.00002


@dataclass
class VirtualBoard:
    name: str
    mode: str
    corpus: str
    positions: list[int]
    passes: int = 0
    ops_last_window: int = 0
    _lock: threading.Lock = field(default_factory=threading.Lock)

    def run_pass(self) -> int:
        if self.mode == "hamming":
            ops, _ = run_hamming_pass(self.corpus)
        else:
            ops, _ = run_p30_pass(self.mode == "library", self.corpus, self.positions)
        with self._lock:
            self.passes += 1
            self.ops_last_window += ops
        return ops

    def ops_per_sec_and_reset(self) -> float:
        with self._lock:
            n = self.ops_last_window
            self.ops_last_window = 0
        return n


def window_energy_j(active_s: float, period_s: float) -> float:
    idle_s = max(0.0, period_s - active_s)
    return ACTIVE_POWER_W * active_s + IDLE_POWER_W * idle_s


def check_op_counts(corpus: str, positions: list[int]) -> None:
    p30_ops, _ = run_p30_pass(True, corpus, positions)
    bios_ops, _ = run_p30_pass(False, corpus, positions)
    ham_ops, _ = run_hamming_pass(corpus)
    assert p30_ops == LIBRARY_OPS_PER_PASS
    assert bios_ops == BIOS_SOAK_OPS_PER_PASS
    assert ham_ops == HAMMING_OPS_PER_PASS
    print(f"op check: library={p30_ops} bios_soak={bios_ops} hamming={ham_ops} OK")


def run_max_mode(args: argparse.Namespace) -> Path:
    corpus, positions = load_corpus()
    check_op_counts(corpus, positions)

    p30_board = VirtualBoard("p30", args.p30_mode, corpus, positions)
    ham_board = VirtualBoard("hamming", "hamming", corpus, positions)
    stop = threading.Event()

    def worker(board: VirtualBoard) -> None:
        while not stop.is_set():
            board.run_pass()

    t_p30 = threading.Thread(target=worker, args=(p30_board,), daemon=True)
    t_ham = threading.Thread(target=worker, args=(ham_board,), daemon=True)
    t_p30.start()
    t_ham.start()

    DEFAULT_OUT.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out_path = DEFAULT_OUT / f"emulate_max_{stamp}.csv"
    samples = []
    t0 = time.time()

    def sample(note: str) -> None:
        elapsed = time.time() - t0
        p30_ops_s = p30_board.ops_per_sec_and_reset() / max(args.interval, 0.01)
        ham_ops_s = ham_board.ops_per_sec_and_reset() / max(args.interval, 0.01)
        samples.append(
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "elapsed_s": round(elapsed, 3),
                "p30_power_w": round(POWER_BASE_W + POWER_SCALE * p30_ops_s, 4),
                "hamming_power_w": round(POWER_BASE_W + POWER_SCALE * ham_ops_s, 4),
                "p30_passes": p30_board.passes,
                "hamming_passes": ham_board.passes,
                "notes": note,
            }
        )

    while time.time() - t0 < args.burn_in:
        sample("burn-in")
        time.sleep(args.interval)
    rec_start = time.time()
    while time.time() - rec_start < args.duration:
        sample("")
        time.sleep(args.interval)

    stop.set()
    _write_max_csv(out_path, samples)

    rec = [s for s in samples if s["notes"] != "burn-in"]
    p30_delta = rec[-1]["p30_passes"] - rec[0]["p30_passes"]
    ham_delta = rec[-1]["hamming_passes"] - rec[0]["hamming_passes"]
    ratio = p30_delta / max(ham_delta, 1)
    exp = HAMMING_OPS_PER_PASS / (
        LIBRARY_OPS_PER_PASS if args.p30_mode == "library" else BIOS_SOAK_OPS_PER_PASS
    )
    print(f"CSV: {out_path}")
    print(f"  pass ratio P30/Hamming ~ {ratio:.1f}x (expect ~{exp:.1f}x)")
    if ratio < exp * 0.5 or ratio > exp * 2.0:
        raise SystemExit("FAIL pass ratio")
    print("soak_emulate max: PASS")
    return out_path


def run_rate_mode(args: argparse.Namespace) -> Path:
    corpus, positions = load_corpus()
    check_op_counts(corpus, positions)
    period = 1.0 / args.rate
    p30_mode = args.p30_mode

    DEFAULT_OUT.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out_path = DEFAULT_OUT / f"emulate_rate_{stamp}.csv"
    rows = []
    t0 = time.time()
    n_pass = 0

    while time.time() - t0 < args.burn_in + args.duration:
        note = "burn-in" if time.time() - t0 < args.burn_in else ""
        window_start = time.perf_counter()

        # Execute passes (host CPU); energy model uses FPGA-scaled active time
        run_p30_pass(p30_mode == "library", corpus, positions)
        run_hamming_pass(corpus)

        t_p30_sim = simulated_pass_duration(p30_mode)
        t_ham_sim = simulated_pass_duration("hamming")
        e_p30, ew_p30, _, p_p30 = rate_window_energy(p30_mode, period)
        e_ham, ew_ham, _, p_ham = rate_window_energy("hamming", period)
        n_pass += 1

        if note != "burn-in":
            rows.append(
                {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "elapsed_s": round(time.time() - t0, 3),
                    "rate_hz": args.rate,
                    "p30_pass_s_sim": round(t_p30_sim, 6),
                    "hamming_pass_s_sim": round(t_ham_sim, 6),
                    "p30_energy_j": round(e_p30, 6),
                    "hamming_energy_j": round(e_ham, 6),
                    "p30_energy_work_j": round(ew_p30, 6),
                    "hamming_energy_work_j": round(ew_ham, 6),
                    "energy_work_ratio_h_p": round(ew_ham / max(ew_p30, 1e-12), 4),
                    "energy_ratio_h_p": round(e_ham / max(e_p30, 1e-12), 4),
                    "p30_avg_power_w": round(p_p30, 4),
                    "hamming_avg_power_w": round(p_ham, 4),
                    "pass_index": n_pass,
                }
            )

        elapsed = time.perf_counter() - window_start
        if elapsed < period:
            time.sleep(period - elapsed)

    _write_rate_csv(out_path, rows)
    if not rows:
        raise SystemExit("no rate samples")

    mean_e_p = sum(r["p30_energy_j"] for r in rows) / len(rows)
    mean_e_h = sum(r["hamming_energy_j"] for r in rows) / len(rows)
    mean_p_p = sum(r["p30_avg_power_w"] for r in rows) / len(rows)
    mean_p_h = sum(r["hamming_avg_power_w"] for r in rows) / len(rows)
    dur_ratio = sum(r["hamming_pass_s_sim"] for r in rows) / max(
        sum(r["p30_pass_s_sim"] for r in rows), 1e-12
    )
    e_ratio = mean_e_h / mean_e_p
    ew_ratio = statistics.mean(float(r["hamming_energy_work_j"]) for r in rows) / statistics.mean(
        float(r["p30_energy_work_j"]) for r in rows
    )

    print(f"CSV: {out_path}")
    print(f"  rate: {args.rate} Hz  windows: {len(rows)}")
    print(f"  simulated pass duration ratio H/P: {dur_ratio:.2f}x (expect ~{OP_RATIO_LIBRARY:.1f}x)")
    print(f"  mean energy (work only) ratio H/P: {ew_ratio:.2f}x  <- publishable step 4")
    print(f"  mean energy (total window) ratio H/P: {e_ratio:.2f}x")
    print(f"  mean avg power @ matched rate: P30={mean_p_p:.3f}W Hamming={mean_p_h:.3f}W")

    if ew_ratio < OP_RATIO_LIBRARY * 0.95:
        raise SystemExit(f"FAIL work energy ratio {ew_ratio:.2f}")
    print("soak_emulate rate: PASS (publishable chain steps 4-5 emulated)")
    return out_path


def _write_max_csv(path: Path, samples: list) -> None:
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(
            f,
            fieldnames=[
                "timestamp",
                "elapsed_s",
                "p30_power_w",
                "hamming_power_w",
                "p30_passes",
                "hamming_passes",
                "notes",
            ],
        )
        w.writeheader()
        for s in samples:
            row = dict(s)
            row["delta_w"] = round(row["hamming_power_w"] - row["p30_power_w"], 4)
            w.writerow(row)


def _write_rate_csv(path: Path, rows: list) -> None:
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)


def main() -> None:
    p = argparse.ArgumentParser(description="Emulate dual-FPGA thermal soak")
    p.add_argument("--mode", choices=("max", "rate"), default="max")
    p.add_argument("--rate", type=float, default=1.0, help="Validations/sec (rate mode)")
    p.add_argument("--p30-mode", choices=("library", "bios"), default="library")
    p.add_argument("--burn-in", type=float, default=2.0)
    p.add_argument("--duration", type=float, default=5.0)
    p.add_argument("--interval", type=float, default=0.5)
    args = p.parse_args()
    if args.mode == "rate":
        run_rate_mode(args)
    else:
        run_max_mode(args)


if __name__ == "__main__":
    main()
