# ADR-002: Phase 2 ISA strategy — RISC-V + P30 coprocessor

**Status:** Accepted (Phase 1 gate)  
**Date:** 2026-06-23  
**Depends on:** ADR-001, P30-SPEC v0.2 bit-layout freeze

## Context

Phase 1 delivers Option E (coprime position per scalar) with normative CHAR/PACKED/HUFFMAN/DIRECT layouts ([P30-SPEC v0.2](../P30-SPEC.md)). Phase 2 needs a processor architecture for load/save/validate experiments on FPGA and emulator.

Industry practice (RISC-V ecosystem, LoongArch ports, LLVM backend timelines) shows that a **greenfield ISA + full toolchain** typically requires many person-years before "Hello, world" on real hardware. Infoton's public materials describe an encoding and demo calculator, not a published native ISA.

## Decision

**Default Phase 2 path:** **RISC-V RV32I subset + P30 pack/unpack coprocessor**, not a standalone P30 ISA in the first silicon/FPGA milestone.

| Layer | Choice |
|-------|--------|
| Host control core | RISC-V (LiteX / VexRiscv class soft core) |
| P30 native data | Coprocessor or memory controller: 30-bit unit pack/unpack, `VALID` (coprimality) |
| Register file (P30 ops) | **120 bits** (4 × 30-bit units) for ALU datapath |
| Address unit | **30 bits** (native pointer size for P30 address space) |
| Byte-backed DRAM | Pack/unpack in controller — 4 units → 15 bytes on 8-bit media |
| Toolchain (first milestone) | Assembler + linker stub for coprocessor ops; **no** full LLVM backend gate |

**Explicitly deferred:** standalone `P30-ISA` with its own ELF, relocations, and OS port as the *first* deliverable. A parallel **encoding-layer transcoder** (Option D) on conventional CPUs remains valid for migration studies.

## Rationale

1. **Time-to-prototype:** UART monitor (`LOAD` / `SAVE` / `VALIDATE`) on FPGA is reachable with RISC-V + custom CSRs/coprocessor.
2. **Reuse:** Debug, build, and flash flows inherit from mature RISC-V tooling.
3. **Option B compatibility:** Fixed 30-bit units (P30-SPEC §6 appendix) map naturally to coprocessor registers without redefining Phase 1 storage formats.
4. **Exit ramp:** If coprocessor validation succeeds, a dedicated P30 ISA document (`docs/isa/P30-ISA-v0.1.md`) can split out as Phase 2b — not blocking Phase 2a FPGA.

## Consequences

- Phase 2 deliverables: `emulator/p30emu`, `fpga/` with RISC-V + P30 unit path, not greenfield compiler first.
- Phase 3 prioritizes **asm/linker** for coprocessor opcodes and `p30-call-v0` ABI sketch; LLVM backend is parallel/long-track.
- Linux port (Phase 5+) targets **RISC-V + P30 driver** before a native `arch/p30` if ever needed.
- Conformance CI ([`.github/workflows/conformance.yml`](../../.github/workflows/conformance.yml)) must stay green on P30-SPEC v0.2 before FPGA work merges.

## Alternatives considered

| Alternative | Why not first |
|-------------|----------------|
| Greenfield P30 ISA | Toolchain/OS cost dominates; no Infoton public ISA to match |
| Pure transcoder (Option D only) | Valid for migration studies but does not exercise native load/store/VALID |
| 120-bit-only ISA (no 30-bit address) | Wastes encoding density; 30-bit pointers align with wheel period |

## Open questions

- Exact coprocessor interface: memory-mapped vs custom instructions vs RoCC-style extension
- Whether `VALID` traps or returns status flag on non-coprime patterns
- HUFFMAN 430-byte tree: reverse from Infoton or replace with open canonical tree in Phase 3+
