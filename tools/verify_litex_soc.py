#!/usr/bin/env python3
"""Verify LiteX SoC scaffold (syntax, files, dry-run)."""

from __future__ import annotations

import ast
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def check_python_syntax(path: Path) -> None:
    ast.parse(path.read_text(encoding="utf-8"), filename=str(path))


def main() -> None:
    required = [
        ROOT / "fpga" / "litex" / "p30_soc.py",
        ROOT / "fpga" / "litex" / "p30_periph.py",
        ROOT / "fpga" / "litex" / "requirements.txt",
        ROOT / "fpga" / "rtl" / "p30_mem_ctrl.v",
        ROOT / "fpga" / "monitor_rom" / "main.c",
        ROOT / "fpga" / "monitor_rom" / "Makefile",
        ROOT / "fpga" / "p30_pack.v",
    ]
    missing = [p for p in required if not p.exists()]
    if missing:
        for p in missing:
            print(f"MISSING {p}")
        raise SystemExit(1)

    for py in (ROOT / "fpga" / "litex").glob("*.py"):
        check_python_syntax(py)
        print(f"syntax OK: {py.name}")

    result = subprocess.run(
        [sys.executable, str(ROOT / "fpga" / "litex" / "p30_soc.py"), "--dry-run"],
        capture_output=True,
        text=True,
        check=False,
    )
    print(result.stdout, end="")
    if result.returncode != 0:
        print(result.stderr, file=sys.stderr)
        raise SystemExit(result.returncode)

    gcc = "riscv32-unknown-elf-gcc"
    import shutil

    if shutil.which(gcc):
        subprocess.run(
            ["make", "clean", "all"],
            cwd=ROOT / "fpga" / "monitor_rom",
            check=True,
        )
        print("monitor_rom: build OK")
    else:
        print("monitor_rom: skipped (riscv32-unknown-elf-gcc not installed)")

    print("verify_litex_soc: PASS")


if __name__ == "__main__":
    main()
