#!/usr/bin/env python3
"""Verify period-30 d=8 qudit basis (Python parity with p30_core::qudit)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOTATIVES = [1, 7, 11, 13, 17, 19, 23, 29]


def totative_index(residue: int) -> int | None:
    r = residue % 30
    try:
        return TOTATIVES.index(r)
    except ValueError:
        return None


def ket_label(index: int) -> str:
    return f"|{TOTATIVES[index]}⟩"


def position_from_qudit(period: int, index: int) -> int:
    return period * 30 + TOTATIVES[index]


def main() -> int:
    path = ROOT / "spec" / "qudit_vectors.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    failed = 0
    for v in data["vectors"]:
        residue = v["residue"]
        idx = totative_index(residue)
        if v.get("desert"):
            if idx is not None:
                print(f"FAIL residue {residue}: expected desert, got index {idx}")
                failed += 1
            continue
        if idx != v["index"]:
            print(f"FAIL residue {residue}: index {idx} != {v['index']}")
            failed += 1
        if ket_label(v["index"]) != v["ket"]:
            print(f"FAIL ket mismatch for index {v['index']}")
            failed += 1
        pos = position_from_qudit(0, v["index"])
        if pos != v["position_period0"]:
            print(f"FAIL position {pos} != {v['position_period0']}")
            failed += 1

    if failed:
        print(f"qudit verify: {failed} failures")
        return 1
    print(f"qudit verify: PASS ({len(data['vectors'])} vectors)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
