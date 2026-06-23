# Validity model analysis

Exploring how Prime 30 integrity compares to conventional ECC.

## Infoton demo model (Option E — adopted)

- **Locate / Emit / Verify** on coprime Prime 30 positions
- **CHAR** stores raw UTF-8; Verify on read in library mode
- **Hamming SECDED** is the explicit comparison baseline (584 ops/word)

## Coprimality and SECDED — complementary roles

With Tier-1 Locate, each character maps to a **fixed coprime value** (viz: bead on a spoke). BER sweep on canonical corpus (`p30_core::ber`):

| Mechanism | Single-bit flip detection |
|-----------|----------------------------|
| Tier-1 Verify (Locate) | partial — many flips stay on valid Tier-1 chars |
| PACKED checksum | ~majority of flips |
| Hamming parity (simplified) | partial |

**Working model:** Coprimality provides **invalid codeword rejection** — a value on a spoke is valid by construction. Hamming SECDED provides **bit-level correction** on fixed-width words. PACKED checksum covers storage integrity in the open spec.

## Deferred: Option B (30-bit ISA)

Full silicon stack may adopt 30-bit totative words in Phase 2 if BIOS-native zero-read-verify requires fixed machine types.

## Deferred: Hsiao (72,64)

Industry DRAM ECC comparator — implement in `benches/` alongside the Hamming baseline from the demo.
