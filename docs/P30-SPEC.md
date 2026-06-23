# P30-SPEC v0.2 (draft)

Normative open specification aligned to Infoton demo calculator (June 2026). See [ADR-001](adr/001-coprime-position.md) (Phase 1 code unit) and [ADR-002](adr/002-isa-strategy.md) (Phase 2 ISA gate).

**P30 = Prime 30** — encoding on integers coprime to 30 (wheel period 30 = 2 × 3 × 5).

Conformance: `python tools/conformance.py` or `cargo run -p p30_inspect -- conformance` against [`spec/conformance_vectors.json`](../spec/conformance_vectors.json) (≥100 vectors). Demo targets in [`spec/test-vectors.json`](../spec/test-vectors.json).

## 1. Prime 30 totatives

Valid residues mod 30 (coprime to 30):

```
T = [1, 7, 11, 13, 17, 19, 23, 29]
```

A **P30 position** is a non-negative integer `p` with `gcd(p, 30) = 1`.

**Storage residue** (5-bit field in HUFFMAN/DIRECT):

```
residue(p) = p mod 30   // always ∈ T
```

## 2. Core operations

### Locate(character, char_index) → position

**Tier-1 (Infoton P30 v2.0):** 68 characters map to fixed coprime integers — see [`spec/tier1_alphabet.json`](../spec/tier1_alphabet.json).

```
position = CHAR_TO_VAL[character]     // if character ∈ Tier-1
```

**Escape:** characters outside Tier-1 (e.g. `/` in the canonical corpus) use UTF-8 bytes with the totative byte wheel:

```
byte       = UTF-8 octet at char_index (single-byte for demo corpus)
tot_index  = byte mod 8
position   = char_index × 30 + T[tot_index]
```

Postcondition: `gcd(position, 30) = 1`.

Reference: `crates/p30_core/src/tier1.rs`.

### Emit

Write a storage format (CHAR, PACKED, HUFFMAN, DIRECT). HUFFMAN and DIRECT store `residue(position)` in a 5-bit field per character (§4.4).

### Verify (library mode)

For each character at `char_index`, assert `Locate` yields a coprime position. PACKED adds a checksum check on read (§4.3).

## 3. CCP-0 operation profiles

| Profile | Ops per character | Read path |
|---------|-------------------|-----------|
| Library | 3 (Locate, Emit, Verify) | Re-verify |
| BIOS-native | 1 (ingress encode) | 0 re-verify |

Hamming SECDED baseline: `584 × ceil(8 × utf8_len / 64)` irreversible ops.

## 4. Storage formats (normative bit layout)

All multi-byte integers are **little-endian** unless noted. Magic tags are ASCII, no NUL terminator.

| Format | Magic | Round-trip | Integrity |
|--------|-------|------------|-----------|
| CHAR | `P30C` | yes | Verify (library) |
| PACKED | (uses CHAR body) | yes | position checksum |
| HUFFMAN | `P30H` in tree block | yes | tree + residues (open stub tree) |
| DIRECT | `P30D` | write-only | footer marker |

### 4.1 CHAR

```
offset  size   field
0       4      magic = "P30C" (bytes 50 33 30 43)
4       N      utf8_payload[N]   // N = byte length of UTF-8 text
```

Total size: `4 + N`. Positions are **not** stored; derived via Locate on decode.

### 4.2 PACKED

```
offset  size   field
0       4+N    CHAR blob (§4.1)
4+N     4      position_checksum : u32 LE
```

**position_checksum:**

```
sum = 0
for each (char_index, character) in text (in order):
    sum = (sum + Locate(character, char_index)) mod 2^32   // unsigned wrap
```

Decode: recompute checksum over decoded text; reject on mismatch.

### 4.3 Five-bit residue payload

Used by HUFFMAN (padded) and DIRECT (unpadded). For `C` characters indexed `i = 0 .. C-1`:

```
r[i] = residue(Locate(text[i], i))     // 5-bit value, r[i] ∈ {1,7,11,13,17,19,23,29}
```

Bit stream length: `5 × C` bits. Pack into bytes **LSB-first**:

- Bit `k` of the stream (0-based) is `(r[i] >> (k mod 5)) & 1` where `i = k div 5`.
- Byte `b` contains stream bits `8b .. 8b+7` with bit `8b` in the LSB of byte `b`.

**HUFFMAN pad rule:** when unpadded payload length is exactly **102 bytes** (`C = 163`), append one **zero** byte (103 bytes total). No pad otherwise.

Reference implementation: `pack_positions_5bit` in `crates/p30_core/src/storage.rs`.

### 4.4 HUFFMAN

```
offset  size   field
0       430    tree_block
430     P      residue_payload (§4.3, pad=true)
```

**tree_block** (open stub; sizes match Infoton demo):

```
offset  size   field
0       4      magic = "P30H"
4       4      char_count : u32 LE   // 163 for canonical corpus
8       422    reserved (zero in reference impl)
```

Total size: `430 + P`. Canonical demo: `P = 103`, total **533 B**.

### 4.5 DIRECT (write-only)

```
offset  size   field
0       4      magic = "P30D"
4       Q      residue_payload (§4.3, pad=false)
4+Q     10     footer = "P30-WRITE!"  (ASCII)
```

No decode path in v0.2 reference impl. Canonical demo total: **116 B** (`Q = 102` for 163 chars).

## 5. UTF-8 compatibility

CHAR mode stores raw UTF-8. Transcoding from arbitrary Unicode preserves bytes losslessly for valid UTF-8 input. Escape Locate uses the raw UTF-8 byte at each scalar's first code unit (sufficient for BMP demo corpus).

## 6. Phase 2 appendix — 30-bit machine word (Option B, deferred)

Phase 1 (ADR-001) uses **variable-width coprime positions** (Option E). Phase 2 may introduce a fixed **30-bit P30 unit** for silicon:

| Topic | Draft (not normative in v0.2) |
|-------|-------------------------------|
| Unit width | 30 bits |
| Valid pattern | `gcd(value, 30) = 1` when interpreted as unsigned integer |
| Invalid | 0; any value sharing factor 2, 3, or 5 with 30 |
| Bus packing | 4 units → 120 bits → **15 bytes** (byte 14 high nibble may be padding) |
| Alignment | 1 / 2 / 4 / 8 units |

This appendix is gated by [ADR-002](adr/002-isa-strategy.md). Do not implement native ISA until conformance CI is green on v0.2 layouts above.

## 7. Conformance

| Check | Command |
|-------|---------|
| Demo metrics (163-char corpus) | `python tools/verify_demo.py` |
| ≥100 golden vectors | `python tools/conformance.py` |
| Inspect CLI | `cargo run -p p30_inspect -- stats` |

Vector kinds: `tier1_mapping`, `all_positions_coprime`, `char_roundtrip`, `packed_roundtrip`, `infoton_demo`.
