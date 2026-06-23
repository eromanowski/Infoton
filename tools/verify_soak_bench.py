#!/usr/bin/env python3
"""Verify soak firmware + bench harness (no hardware required)."""

from __future__ import annotations

import ast
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    subprocess.run([sys.executable, str(ROOT / "tools" / "gen_corpus_firmware.py")], check=True)

    required = [
        ROOT / "fpga" / "monitor_rom" / "corpus_data.c",
        ROOT / "fpga" / "monitor_rom" / "p30_soak.c",
        ROOT / "fpga" / "monitor_rom" / "hamming_soak.c",
        ROOT / "docs" / "bench" / "dual-fpga-thermal.md",
        ROOT / "tools" / "bench_dual_fpga.py",
        ROOT / "fpga" / "litex" / "p30_arty.py",
    ]
    for p in required:
        if not p.exists():
            raise SystemExit(f"missing {p}")

    for py in [
        ROOT / "tools" / "bench_dual_fpga.py",
        ROOT / "tools" / "gen_corpus_firmware.py",
        ROOT / "fpga" / "litex" / "p30_soc.py",
    ]:
        ast.parse(py.read_text(encoding="utf-8"))

    subprocess.run(
        [sys.executable, str(ROOT / "tools" / "bench_dual_fpga.py"), "--dry-run"],
        check=True,
    )
    subprocess.run(
        [sys.executable, str(ROOT / "fpga" / "litex" / "p30_soc.py"), "--platform", "arty", "--dry-run"],
        check=True,
    )
    subprocess.run(
        [
            sys.executable,
            str(ROOT / "tools" / "soak_emulate.py"),
            "--mode",
            "rate",
            "--rate",
            "2",
            "--burn-in",
            "0.5",
            "--duration",
            "2",
        ],
        check=True,
    )
    print("verify_soak_bench: PASS")


if __name__ == "__main__":
    main()
