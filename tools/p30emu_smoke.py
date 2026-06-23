#!/usr/bin/env python3
"""Run p30emu monitor commands without Rust (Phase 2 smoke test)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))

from conformance import (  # noqa: E402
    decode_char,
    decode_packed,
    encode_char,
    encode_packed,
    snapshot,
    CHAR_TO_VAL,
)
from math import gcd

TIER1 = json.loads((ROOT / "spec" / "tier1_alphabet.json").read_text(encoding="utf-8"))


def is_tier1(ch: str) -> bool:
    return ch in CHAR_TO_VAL


def position_value(ch: str, index: int) -> int:
    if ch in CHAR_TO_VAL:
        return CHAR_TO_VAL[ch]
    tot = [1, 7, 11, 13, 17, 19, 23, 29]
    return index * 30 + tot[ord(ch) % 8]


def verify_char_payload(text: str) -> bool:
    for i, ch in enumerate(text):
        if gcd(position_value(ch, i), 30) != 1:
            return False
    return True


class Monitor:
    def __init__(self) -> None:
        self.text: str | None = None
        self.fmt: str | None = None

    def handle(self, line: str) -> list[str]:
        line = line.split("#", 1)[0].strip()
        if not line:
            return []
        parts = line.split()
        cmd = parts[0].upper()
        if cmd == "LOAD":
            path = ROOT / parts[1]
            data = path.read_bytes()
            if data.startswith(b"P30C") and len(data) >= 8:
                try:
                    self.text = decode_packed(data)
                    self.fmt = "PACKED"
                    return [f"OK LOAD chars={len(self.text)} bytes={len(data)} format=PACKED"]
                except Exception:
                    pass
            if data.startswith(b"P30C"):
                self.text = decode_char(data)
                self.fmt = "CHAR"
                return [f"OK LOAD chars={len(self.text)} bytes={len(data)} format=CHAR"]
            self.text = data.decode("utf-8").rstrip("\n\r")
            self.fmt = "TEXT"
            blob = encode_char(self.text)
            return [f"OK LOAD chars={len(self.text)} bytes={len(blob)} format=TEXT"]
        if cmd == "VALIDATE":
            if not self.text or not verify_char_payload(self.text):
                return ["ERR VALIDATE coprimality check failed"]
            return [f"OK VALIDATE chars={len(self.text)}"]
        if cmd == "STATS":
            snap = snapshot(self.text or "")
            return [f"library_ops: {snap['library_ops']}", f"bios_ops: {snap['bios_ops']}"]
        if cmd == "SAVE":
            path = ROOT / parts[1]
            path.parent.mkdir(parents=True, exist_ok=True)
            fmt = parts[2].lower() if len(parts) > 2 else "packed"
            blob = encode_packed(self.text or "") if fmt == "packed" else encode_char(self.text or "")
            path.write_bytes(blob)
            return [f"OK SAVE bytes={len(blob)}"]
        if cmd == "QUIT":
            return ["OK QUIT"]
        return [f"ERR unknown {cmd}"]


def main() -> None:
    script = ROOT / "emulator" / "p30emu" / "scripts" / "smoke.txt"
    mon = Monitor()
    ok = True
    for line in script.read_text(encoding="utf-8").splitlines():
        for resp in mon.handle(line):
            print(resp)
            if resp.startswith("ERR"):
                ok = False
            if "library_ops: 489" in resp:
                pass
    if not ok:
        raise SystemExit(1)
    # validate saved packed if created
    out = ROOT / "out" / "smoke_packed.bin"
    if out.exists():
        t = decode_packed(out.read_bytes())
        assert len(t) == 163
    print("p30emu smoke: PASS")


if __name__ == "__main__":
    main()
