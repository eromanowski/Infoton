#!/usr/bin/env python3
"""Summarize thermal bench CSV for publishable claim chain."""

from __future__ import annotations

import argparse
import csv
import statistics
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OP_RATIO = 12264 / 489


def load_rows(path: Path) -> list[dict]:
    with path.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def report_rate(path: Path) -> str:
    rows = load_rows(path)
    if not rows or "p30_energy_j" not in rows[0]:
        raise SystemExit(f"not a rate-mode CSV: {path}")

    e_p = [float(r["p30_energy_j"]) for r in rows]
    e_h = [float(r["hamming_energy_j"]) for r in rows]
    p_p = [float(r["p30_avg_power_w"]) for r in rows]
    p_h = [float(r["hamming_avg_power_w"]) for r in rows]
    t_p = [float(r.get("p30_pass_s_sim", r.get("p30_pass_s", 0))) for r in rows]
    t_h = [float(r.get("hamming_pass_s_sim", r.get("hamming_pass_s", 0))) for r in rows]

    e_ratio = statistics.mean(e_h) / statistics.mean(e_p)
    p_ratio = statistics.mean(p_h) / statistics.mean(p_p)
    t_ratio = statistics.mean(t_h) / statistics.mean(t_p)

    lines = [
        f"# Thermal report — `{path.name}`",
        "",
        "## Mode RATE (matched validation throughput)",
        "",
        f"| Metric | P30 | Hamming | Ratio H/P |",
        f"|--------|-----|---------|-----------|",
        f"| Mean energy per validation (J) | {statistics.mean(e_p):.6f} | {statistics.mean(e_h):.6f} | **{e_ratio:.2f}x** |",
        f"| Mean avg power (W) | {statistics.mean(p_p):.4f} | {statistics.mean(p_h):.4f} | **{p_ratio:.2f}x** |",
        f"| Mean pass duration (s) | {statistics.mean(t_p):.6f} | {statistics.mean(t_h):.6f} | **{t_ratio:.2f}x** |",
        f"| Op model expectation | 489 | 12264 | **{OP_RATIO:.2f}x** |",
        "",
        "## Claim chain status",
        "",
        f"- Step 4 (E per validation): measured ratio **{e_ratio:.2f}x** vs op model **{OP_RATIO:.2f}x**",
        f"- Step 5 (avg power @ matched rate): **{p_ratio:.2f}x**",
        "- Step 6 (temperature): add hardware XADC/thermocouple data",
        "- Step 7 (rack extrapolation): **not supported** from this file alone",
        "",
    ]
    return "\n".join(lines)


def report_max(path: Path) -> str:
    rows = [r for r in load_rows(path) if r.get("notes") != "burn-in"]
    if not rows:
        raise SystemExit("no record rows")
    p30_passes = int(rows[-1].get("p30_passes", 0)) - int(rows[0].get("p30_passes", 0))
    ham_passes = int(rows[-1].get("hamming_passes", 0)) - int(rows[0].get("hamming_passes", 0))
    ratio = p30_passes / max(ham_passes, 1)
    return (
        f"# Thermal report — `{path.name}`\n\n"
        f"Mode MAX: pass ratio P30/Hamming = **{ratio:.1f}x** (expect ~{OP_RATIO:.1f}x).\n\n"
        "Not used for publishable power/temperature claims — see Mode RATE.\n"
    )


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("csv", type=Path, nargs="+")
    p.add_argument("-o", "--output", type=Path)
    args = p.parse_args()
    parts = []
    for path in args.csv:
        rows = load_rows(path)
        if rows and "p30_energy_j" in rows[0]:
            parts.append(report_rate(path))
        else:
            parts.append(report_max(path))
    text = "\n---\n\n".join(parts)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text, encoding="utf-8")
        print(f"wrote {args.output}")
    else:
        print(text)


if __name__ == "__main__":
    main()
