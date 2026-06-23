# Infoton source study (June 2026)

Reference notes for aligning our open stack with the public Infoton P30 demo.

## Primary source: demo calculator

User-verified output from [infoton.ai/infoton-p30](https://infoton.ai/infoton-p30) defines:

| Mode | Ops (163 chars) | Meaning |
|------|-----------------|---------|
| Library | 489 | 3 × (Locate + Emit + Verify) |
| BIOS | 163 | 1 × ingress encode; 0 read verify |
| Hamming SECDED | 12,264 | 21 × 584 ops/64-bit word |

## Open reproduction status

`tools/verify_demo.py` **PASS** on all demo targets (ops + storage sizes).

## Decode notes

1. **163 = character count** — scales linearly with message length.
2. **12,264** = Hamming SECDED round-trip accounting (21 × 64-bit words × 584 ops).
3. **Coprimality** rejects invalid codewords; **PACKED checksum** extends single-bit detection in our open spec.
4. **Rack-power demo math** (130 kW → 1.73 kW) scales validation ops — Phase 9 explores full-system equivalents.
5. **HUFFMAN 430-byte tree** is stubbed in our codec; payload sizes match demo targets.

## Canonical corpus

163-char Great Salt Lake sentence in `spec/canonical_corpus.txt` (from Infoton embedded calculator, June 2026).

## References

- [Infoton P30](https://infoton.ai/infoton-p30)
- [Januarian Physics / Zenodo](https://zenodo.org/records/18210355)
- [Prime state and quantum relatives (García-Martín et al., 2020)](https://doi.org/10.22331/q-2020-12-11-371)
