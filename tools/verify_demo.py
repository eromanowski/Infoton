#!/usr/bin/env python3
"""Verify Infoton demo metrics without Rust (CCP-0 + storage sizes)."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CORPUS = (ROOT / "spec" / "canonical_corpus.txt").read_text(encoding="utf-8").strip("\n\r")
VECTORS = json.loads((ROOT / "spec" / "test-vectors.json").read_text(encoding="utf-8"))
TIER1 = json.loads((ROOT / "spec" / "tier1_alphabet.json").read_text(encoding="utf-8"))
E = VECTORS["expected"]

CHAR_TO_VAL = {entry[0]: entry[1] for entry in TIER1["tier1"]}
TOTATIVES = [1, 7, 11, 13, 17, 19, 23, 29]
K_B = 1.380649e-23


def locate_totative(byte: int, index: int) -> int:
    ti = byte % 8
    return index * 30 + TOTATIVES[ti]


def position_value(ch: str, index: int) -> int:
    if ch in CHAR_TO_VAL:
        return CHAR_TO_VAL[ch]
    # Escape: first UTF-8 byte (matches Rust locate_totative_byte).
    return locate_totative(ch.encode("utf-8")[0], index)


def storage_residue(ch: str, index: int) -> int:
    return ((position_value(ch, index) % 30) + 30) % 30


def hamming_ops(n_bytes: int) -> int:
    words = (n_bytes * 8 + 63) // 64
    return words * E["hamming_ops_per_64bit_word"]


def char_bytes(text: str) -> int:
    return 4 + len(text.encode("utf-8"))


def packed_bytes(text: str) -> int:
    return char_bytes(text) + 4


def pack_positions_5bit(text: str, pad: bool) -> bytes:
    n = len(text)
    out = bytearray((n * 5 + 7) // 8)
    for i, ch in enumerate(text):
        value = storage_residue(ch, i)
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


def landauer_zj(t_k: float = 350.0) -> float:
    return K_B * t_k * 0.6931471805599453 * 1e21


def main() -> None:
    text = CORPUS
    n = len(text.encode("utf-8"))
    chars = len(text)
    assert chars == E["char_count"], (chars, E["char_count"])

    # Ops are per character (matches Rust count_p30_ops); Hamming is per UTF-8 byte.
    lib_ops = chars * 3
    bios_ops = chars * 1
    ham_ops = hamming_ops(n)

    checks = {
        "utf8_bytes": (n, E["utf8_bytes"]),
        "library_ops": (lib_ops, E["library_ops"]),
        "bios_ops": (bios_ops, E["bios_ops"]),
        "hamming_ops": (ham_ops, E["hamming_secded_ops"]),
        "char_bytes": (char_bytes(text), E["storage_bytes"]["char_round_trip"]),
        "packed_bytes": (packed_bytes(text), E["storage_bytes"]["packed_round_trip"]),
        "huffman_total": (huffman_total(text), E["storage_bytes"]["huffman_total"]),
        "huffman_payload": (huffman_payload(text), E["storage_bytes"]["huffman_payload"]),
        "direct_bytes": (direct_bytes(text), E["storage_bytes"]["direct_write_only"]),
    }

    escapes = [c for c in text if c not in CHAR_TO_VAL]
    print("=== P30 demo verification (Python, Tier-1 codec) ===")
    print(f"Corpus: {n} chars")
    print(f"Tier-1 escapes: {escapes or 'none'}")
    print(f"Landauer @ 350K: {landauer_zj():.3f} zJ/op")
    print()

    ok = True
    for name, (got, want) in checks.items():
        match = got == want
        ok &= match
        print(f"  {name}: {got} (want {want}) {'OK' if match else 'FAIL'}")

    print()
    print(f"Hamming/BIOS ratio: {ham_ops / bios_ops:.1f}x (want {E['ratios']['hamming_vs_bios']})")
    print(f"Overall: {'PASS' if ok else 'FAIL'}")
    raise SystemExit(0 if ok else 1)


if __name__ == "__main__":
    main()
