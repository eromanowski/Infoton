"""Python mirror of fpga/monitor_rom soak loops — op counts match demo CCP-0."""

from __future__ import annotations

import json
from math import gcd
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CORPUS_LEN = 163
LIBRARY_OPS_PER_PASS = 489
BIOS_OPS_PER_PASS = 163  # CCP-0 demo metric
BIOS_SOAK_OPS_PER_PASS = 326  # firmware: Locate + Emit per char (no Verify)
HAMMING_OPS_PER_PASS = 12_264
HAMMING_OPS_PER_WORD = 584
HAMMING_WORDS = 21
OP_RATIO_LIBRARY = HAMMING_OPS_PER_PASS / LIBRARY_OPS_PER_PASS  # ~25.08
OP_RATIO_BIOS_SOAK = HAMMING_OPS_PER_PASS / BIOS_SOAK_OPS_PER_PASS

# Emulation: dynamic power scales with active compute fraction ~ ops (calibrated unit)
J_PER_OP_EMU = 1.0e-7
IDLE_POWER_W = 0.35
ACTIVE_POWER_W = 2.1


def load_corpus() -> tuple[str, list[int]]:
    text = (ROOT / "spec" / "canonical_corpus.txt").read_text(encoding="utf-8").strip("\n\r")
    tier1 = json.loads((ROOT / "spec" / "tier1_alphabet.json").read_text(encoding="utf-8"))
    char_to_val = {e[0]: e[1] for e in tier1["tier1"]}
    tot = [1, 7, 11, 13, 17, 19, 23, 29]

    def pos(ch: str, idx: int) -> int:
        if ch in char_to_val:
            return char_to_val[ch]
        # Escape: first UTF-8 byte (matches Rust locate_totative_byte).
        return idx * 30 + tot[ch.encode("utf-8")[0] % 8]

    positions = [pos(ch, i) for i, ch in enumerate(text)]
    return text, positions


def _irreversible(sink: int, v: int) -> int:
    sink = (sink ^ v) + 0x9E3779B9
    sink &= 0xFFFFFFFF
    if sink & 1:
        sink ^= (v >> 1) & 0xFFFFFFFF
    return sink


def coprime30(v: int) -> bool:
    return v != 0 and gcd(v, 30) == 1


def run_p30_pass(library: bool, corpus: str, positions: list[int]) -> tuple[int, int]:
    """One soak pass (matches fpga/monitor_rom/p30_soak.c). Returns (ops, sink)."""
    sink = 0
    ops = 0
    for i, ch in enumerate(corpus):
        pos = positions[i]
        sink = _irreversible(sink, pos)
        ops += 1
        sink = _irreversible(sink, (pos % 30) | (i << 5))
        ops += 1
        if library:
            if not coprime30(pos):
                raise AssertionError(f"verify failed at {i}")
            sink = _irreversible(sink, pos ^ 0xA5A5A5A5)
            ops += 1
    return ops, sink


def run_hamming_pass(corpus: str) -> tuple[int, int]:
    sink = 0
    ops = 0
    data = corpus.encode("utf-8")
    for w in range(HAMMING_WORDS):
        for i in range(256):
            sink = _irreversible(sink, w ^ i)
            ops += 1
        for i in range(256):
            sink = _irreversible(sink, (w << 8) ^ i)
            ops += 1
        for i in range(72):
            sink = _irreversible(sink, (w << 16) ^ i)
            ops += 1
        base = (w * 8) % CORPUS_LEN
        for b in range(8):
            idx = (base + b) % CORPUS_LEN
            sink = _irreversible(sink, data[idx])
    return ops, sink


def expected_ops(mode: str) -> int:
    if mode == "library":
        return LIBRARY_OPS_PER_PASS
    if mode == "bios":
        return BIOS_SOAK_OPS_PER_PASS
    if mode == "hamming":
        return HAMMING_OPS_PER_PASS
    raise ValueError(mode)


# Simulated FPGA active time per op (rate-mode emulation; calibrate on hardware)
SEC_PER_OP_FPGA = 2.0e-6


def simulated_pass_duration(mode: str) -> float:
    return expected_ops(mode) * SEC_PER_OP_FPGA


def rate_window_energy(mode: str, period_s: float) -> tuple[float, float, float, float]:
    """Return (energy_total_j, energy_work_j, active_s, avg_power_w)."""
    t_active = min(simulated_pass_duration(mode), period_s)
    t_idle = period_s - t_active
    e_work = ACTIVE_POWER_W * t_active
    e_total = e_work + IDLE_POWER_W * t_idle
    return e_total, e_work, t_active, e_total / period_s
