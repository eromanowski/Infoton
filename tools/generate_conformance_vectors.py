#!/usr/bin/env python3
"""Generate spec/conformance_vectors.json (≥100 golden vectors)."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TIER1 = json.loads((ROOT / "spec" / "tier1_alphabet.json").read_text(encoding="utf-8"))
CHAR_TO_VAL = {entry[0]: entry[1] for entry in TIER1["tier1"]}
CORPUS = (ROOT / "spec" / "canonical_corpus.txt").read_text(encoding="utf-8").strip("\n\r")

TOTATIVES = [1, 7, 11, 13, 17, 19, 23, 29]


def residue(v: int) -> int:
    return ((v % 30) + 30) % 30


def position_value(ch: str, index: int) -> int:
    if ch in CHAR_TO_VAL:
        return CHAR_TO_VAL[ch]
    return index * 30 + TOTATIVES[ord(ch) % 8]


def main() -> None:
    vectors: list[dict] = []
    vid = 0

    for ch, val in CHAR_TO_VAL.items():
        vid += 1
        label = repr(ch)[1:-1] if ch not in (" ", "\n", "'") else ch
        vectors.append(
            {
                "id": f"tier1-{vid:03d}-{label}",
                "kind": "tier1_mapping",
                "text": ch,
                "expect": {
                    "tier1_value": val,
                    "residue_mod30": residue(val),
                    "coprime": True,
                },
            }
        )

    samples = [
        "Hello",
        "Prime 30",
        "e" * 10,
        "The Great Salt Lake",
        "Utah's lake",
        "AF/yr",
        "0123456789",
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        "abcdefghijklmnopqrstuvwxyz",
        CORPUS[:40],
        CORPUS[40:80],
        CORPUS[80:120],
        CORPUS[120:],
    ]
    for i, text in enumerate(samples, 1):
        vid += 1
        positions = [position_value(c, j) for j, c in enumerate(text)]
        vectors.append(
            {
                "id": f"coprime-{i:03d}",
                "kind": "all_positions_coprime",
                "text": text,
                "expect": {
                    "char_count": len(text),
                    "all_coprime": all(p % 2 and p % 3 and p % 5 for p in positions),
                },
            }
        )

    for i, ch in enumerate("etaoinshrdlcumw", 1):
        vid += 1
        text = ch * (i + 2)
        vectors.append(
            {
                "id": f"roundtrip-char-{i:03d}",
                "kind": "char_roundtrip",
                "text": text,
                "expect": {"char_count": len(text)},
            }
        )

    for i, text in enumerate(["Hi", "P30", "Salt Lake", "1,150,000", CORPUS], 1):
        vid += 1
        vectors.append(
            {
                "id": f"roundtrip-packed-{i:03d}",
                "kind": "packed_roundtrip",
                "text": text,
                "expect": {"char_count": len(text)},
            }
        )

    vectors.append(
        {
            "id": "demo-canonical-corpus",
            "kind": "infoton_demo",
            "text": CORPUS,
            "expect": {
                "char_count": 163,
                "utf8_bytes": 163,
                "library_ops": 489,
                "bios_ops": 163,
                "hamming_ops": 12264,
                "char_bytes": 167,
                "packed_bytes": 171,
                "huffman_total": 533,
                "huffman_payload": 103,
                "direct_bytes": 116,
                "tier1_escapes": ["/"],
            },
        }
    )

    out = {
        "version": "1.0.0",
        "description": "P30 conformance vectors (Tier-1, round-trip, demo metrics)",
        "vector_count": len(vectors),
        "vectors": vectors,
    }
    path = ROOT / "spec" / "conformance_vectors.json"
    path.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {path} ({len(vectors)} vectors)")


if __name__ == "__main__":
    main()
