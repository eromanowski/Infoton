# ADR-001: Native P30 code unit — coprime position (Option E)

**Status:** Accepted (Phase 0)  
**Date:** 2026-06-23

## Context

Infoton's [demo calculator](https://infoton.ai/infoton-p30) defines:

- **Library mode:** Locate + Emit + Verify (3 irreversible ops per character)
- **BIOS mode:** 1 ingress encode per character; 0 re-verify on read
- **Baseline:** Hamming SECDED at 584 ops per 64-bit word (12,264 ops for 163 bytes)
- **Storage:** CHAR (167 B), PACKED (171 B), HUFFMAN, DIRECT for a 163-character sentence

The demo does **not** publish a fixed 30-bit machine word or silicon ISA.

## Decision

Phase 1 implements **Option E: coprime position per scalar** with Infoton-named storage formats.

- **Locate(byte, index)** → coprime integer via Prime 30 totative wheel
- **CHAR** = 4-byte magic + raw UTF-8 (integrity checked via Verify on read in library mode)
- **PACKED** = CHAR + position checksum
- **30-bit ISA (Option B)** deferred to Phase 2 gate

## Consequences

- `p30-calculator` must match CCP-0 op counts exactly on the canonical corpus
- Storage byte sizes target demo values; collaborate for bit-exact parity with proprietary encoder when available
- Coprimality (Locate) rejects invalid codewords; **PACKED checksum** extends bit-level detection in our open spec
- Rack-power scaling from op counts is a **Phase 9 measurement target** (full-system, not validation-only)

## Open questions

- Exact canonical sentence text (confirmed: Great Salt Lake demo sentence, 163 chars)
- Infoton HUFFMAN 430-byte tree layout (stub in open impl; sizes match demo)
- Reference encoder source — opportunity for collaboration with Infoton
