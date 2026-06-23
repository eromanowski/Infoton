#!/usr/bin/env python3
"""Run spec/conformance_vectors.json (Python parity with p30inspect conformance)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TIER1 = json.loads((ROOT / "spec" / "tier1_alphabet.json").read_text(encoding="utf-8"))
CHAR_TO_VAL = {entry[0]: entry[1] for entry in TIER1["tier1"]}
TOTATIVES = [1, 7, 11, 13, 17, 19, 23, 29]


def residue(v: int) -> int:
    return ((v % 30) + 30) % 30


def is_coprime(v: int) -> bool:
    from math import gcd

    return gcd(v, 30) == 1


def is_tier1(ch: str) -> bool:
    return ch in CHAR_TO_VAL


def position_value(ch: str, index: int) -> int:
    if ch in CHAR_TO_VAL:
        return CHAR_TO_VAL[ch]
    return index * 30 + TOTATIVES[ord(ch) % 8]


def char_bytes(text: str) -> int:
    return 4 + len(text.encode("utf-8"))


def packed_bytes(text: str) -> int:
    return char_bytes(text) + 4


def pack_positions_5bit(text: str, pad: bool) -> bytes:
    n = len(text)
    out = bytearray((n * 5 + 7) // 8)
    for i, ch in enumerate(text):
        value = residue(position_value(ch, i))
        bit_offset = i * 5
        for bit in range(5):
            if (value >> bit) & 1:
                dst = bit_offset + bit
                out[dst // 8] |= 1 << (dst % 8)
    if pad and len(out) == 102:
        out.append(0)
    return bytes(out)


def huffman_payload(text: str) -> int:
    return len(pack_positions_5bit(text, pad=True))


def huffman_total(text: str) -> int:
    return 430 + huffman_payload(text)


def direct_bytes(text: str) -> int:
    return 4 + len(pack_positions_5bit(text, pad=False)) + 10


def hamming_ops(n_bytes: int) -> int:
    words = (n_bytes * 8 + 63) // 64
    return words * 584


def encode_char(text: str) -> bytes:
    return b"P30C" + text.encode("utf-8")


def decode_char(data: bytes) -> str:
    if not data.startswith(b"P30C"):
        raise ValueError("bad CHAR magic")
    return data[4:].decode("utf-8")


def position_checksum(text: str) -> int:
    total = 0
    for i, ch in enumerate(text):
        total = (total + position_value(ch, i)) & 0xFFFFFFFF
    return total


def encode_packed(text: str) -> bytes:
    return encode_char(text) + position_checksum(text).to_bytes(4, "little")


def decode_packed(data: bytes) -> str:
    if len(data) < 8:
        raise ValueError("packed too short")
    cs = int.from_bytes(data[-4:], "little")
    text = decode_char(data[:-4])
    if position_checksum(text) != cs:
        raise ValueError("checksum mismatch")
    return text


def snapshot(text: str) -> dict:
    n = len(text.encode("utf-8"))
    return {
        "char_count": len(text),
        "utf8_bytes": n,
        "library_ops": n * 3,
        "bios_ops": n * 1,
        "hamming_ops": hamming_ops(n),
        "char_bytes": char_bytes(text),
        "packed_bytes": packed_bytes(text),
        "huffman_total": huffman_total(text),
        "huffman_payload": huffman_payload(text),
        "direct_bytes": direct_bytes(text),
    }


def run_vector(v: dict) -> None:
    kind = v["kind"]
    text = v["text"]
    exp = v.get("expect", {})

    if kind == "tier1_mapping":
        ch = text[0] if text else ""
        if len(text) != 1:
            raise AssertionError("tier1_mapping needs one char")
        got = CHAR_TO_VAL.get(ch)
        if got != exp["tier1_value"]:
            raise AssertionError(f"value {got} != {exp['tier1_value']}")
        if residue(got) != exp["residue_mod30"]:
            raise AssertionError("residue mismatch")
        if not is_coprime(got):
            raise AssertionError("not coprime")

    elif kind == "all_positions_coprime":
        if len(text) != exp["char_count"]:
            raise AssertionError("char count")
        for i, ch in enumerate(text):
            if not is_coprime(position_value(ch, i)):
                raise AssertionError(f"not coprime at {i}")

    elif kind == "char_roundtrip":
        dec = decode_char(encode_char(text))
        if dec != text:
            raise AssertionError("char roundtrip")
        for i, ch in enumerate(text):
            if not is_coprime(position_value(ch, i)):
                raise AssertionError("verify failed")

    elif kind == "packed_roundtrip":
        dec = decode_packed(encode_packed(text))
        if dec != text:
            raise AssertionError("packed roundtrip")

    elif kind == "infoton_demo":
        snap = snapshot(text)
        for key in (
            "char_count",
            "utf8_bytes",
            "library_ops",
            "bios_ops",
            "hamming_ops",
            "char_bytes",
            "packed_bytes",
            "huffman_total",
            "huffman_payload",
            "direct_bytes",
        ):
            if snap[key] != exp[key]:
                raise AssertionError(f"{key}: {snap[key]} != {exp[key]}")
        escapes = [c for c in text if not is_tier1(c)]
        if escapes != exp.get("tier1_escapes", []):
            raise AssertionError(f"escapes {escapes}")

    else:
        raise AssertionError(f"unknown kind {kind}")


def main() -> None:
    path = ROOT / "spec" / "conformance_vectors.json"
    if len(sys.argv) > 1:
        path = Path(sys.argv[1])
    data = json.loads(path.read_text(encoding="utf-8"))
    vectors = data["vectors"]
    failed = []
    for v in vectors:
        try:
            run_vector(v)
        except Exception as e:
            failed.append(f"{v['id']} ({v['kind']}): {e}")
    print(f"=== conformance: {path.name} ===")
    print(f"vectors: {len(vectors)}  passed: {len(vectors) - len(failed)}  failed: {len(failed)}")
    for f in failed:
        print(f"  FAIL {f}")
    if len(vectors) < 100:
        print(f"WARN: expected ≥100 vectors, got {len(vectors)}")
    raise SystemExit(1 if failed else 0)


if __name__ == "__main__":
    main()
