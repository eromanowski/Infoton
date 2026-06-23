#!/usr/bin/env python3
"""Compare totative locate vs Infoton Tier-1 CHAR_TO_VAL for storage residues."""
from pathlib import Path

TIER1_CHARS = [
    " ", "e", "t", "a", "o", "i", "n", "s", "h", "\n", "r", "d", "l", "c", "u", "m",
    "w", "f", "g", "y", "p", "'", "b", "v", "k", ",", ".", "1", "I", "0", "A", "T",
    "E", "2", "C", "S", "D", "N", "R", "3", "B", "H", "M", "O", "-", "4", "5", "F",
    "L", "P", "W", "6", "7", "8", "9", "G", "U", "Y", "!", "j", "x", "K", "V", "?",
    "J", "q", "z", "Q",
]
CHAR_VALS = [
    1, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 49, 53, 59, 61, 67, 71, 73,
    77, 79, 83, 89, 91, 97, 101, 103, 107, 109, 113, 119, 121, 127, 131, 133, 137,
    139, 143, 149, 151, 157, 161, 163, 167, 169, 173, 179, 181, 187, 191, 193, 197,
    199, 203, 209, 211, 217, 221, 223, 227, 229, 233, 239, 241, 247, 251, 253,
]
CHAR_TO_VAL = dict(zip(TIER1_CHARS, CHAR_VALS))
TOTATIVES = [1, 7, 11, 13, 17, 19, 23, 29]


def locate_tot(byte: int, index: int) -> int:
    return index * 30 + TOTATIVES[byte % 8]


def residue(v: int) -> int:
    return ((v % 30) + 30) % 30


def pack_5bit(values: list[int], pad: bool) -> bytes:
    n = len(values)
    out = bytearray((n * 5 + 7) // 8)
    for i, value in enumerate(values):
        bit_offset = i * 5
        for bit in range(5):
            if (value >> bit) & 1:
                dst = bit_offset + bit
                out[dst // 8] |= 1 << (dst % 8)
    if pad and len(out) == 102:
        out.append(0)
    return bytes(out)


def tier_residue(ch: str, i: int) -> int:
    if ch in CHAR_TO_VAL:
        return residue(CHAR_TO_VAL[ch])
    # Escape: UTF-8 bytes via totative locate (open spec stub)
    b = ord(ch)
    return locate_tot(b, i) % 30


def main() -> None:
    text = (Path(__file__).resolve().parents[1] / "spec" / "canonical_corpus.txt").read_text(
        encoding="utf-8"
    ).strip("\n\r")
    missing = [c for c in text if c not in CHAR_TO_VAL]
    print("missing tier1:", missing or "none")
    tot_vals = [locate_tot(ord(c), i) % 30 for i, c in enumerate(text)]
    tier_vals = [tier_residue(c, i) for i, c in enumerate(text)]
    print("totative payload", len(pack_5bit(tot_vals, True)))
    print("tier1+escape payload", len(pack_5bit(tier_vals, True)))
    print("tot vs tier1+escape?", tot_vals == tier_vals)
    diffs = [(i, c, a, b) for i, (c, a, b) in enumerate(zip(text, tot_vals, tier_vals)) if a != b]
    print("diff count", len(diffs))
    for row in diffs[:15]:
        print(" ", row)


if __name__ == "__main__":
    main()
