# P30-ISA v0.1 (draft)

Coprocessor extension for **RISC-V RV32I** host cores. Implements [ADR-002](../adr/002-isa-strategy.md): the control CPU stays RISC-V; native P30 data paths live in the **P30 coprocessor (P30CP)**.

Normative storage layouts remain in [P30-SPEC v0.2](../P30-SPEC.md). This document covers **in-memory 30-bit units**, **120-bit registers**, and the **monitor command set** for Phase 2 emulator/FPGA bring-up.

## 1. Data types

### 1.1 P30 unit (30 bits)

The P30 unit is the **fundamental, addressable storage cell** — memory is an
array of units, not bytes. There is no byte substrate in the architectural view;
bytes appear only at the host/DRAM serialization boundary (§1.3).

```
unit : u30     // bits [29:0]; the unit is the native memory cell
valid(unit)    := gcd(unit, 30) = 1
invalid(unit)  := unit = 0 or gcd(unit, 30) > 1
residue(unit)  := unit mod 30   // ∈ {1,7,11,13,17,19,23,29} when valid
```

Reserved patterns (never emitted by conforming encoders):

| Pattern | Meaning |
|---------|---------|
| `0x0000_0000` | INVALID |
| non-coprime | INVALID |

### 1.2 P30 quad (120 bits)

Four contiguous units in **little-unit order** (unit0 = least significant 30 bits):

```
quad = { u0, u1, u2, u3 }   // each u* is u30
```

### 1.3 Serialization (15-byte lane) — host/DRAM boundary only

P30 memory stores units natively (§1.1). When a quad must cross into a
**byte-addressed** host or DRAM (file I/O, RV32 byte bus, off-chip DRAM), it is
serialized into a **15-byte lane** (120 bits, no padding nibble in the v0.1
reference). This packing is a transport codec, **not** the in-core storage form:

```
byte[k] contains bits [8k .. 8k+7] of the 120-bit little-endian bit stream
bit i of stream = bit (i mod 30) of unit (i div 30)
```

Reference: `emulator/p30emu` module `unit::pack_quad` / `unpack_quad`, exposed on
`P30Memory::to_packed_bytes` / `from_packed_bytes`.

### 1.4 Addresses

P30 address space is **unit-addressed**: an address is a 30-bit *unit index*
(2³⁰ units theoretical). `PLOAD`/`PSTORE` move one unit per address; byte
serialization (§1.3) only occurs through the pack/unpack controller when bridging
to a host byte bus or DRAM.

## 2. Register file

| Reg | Width | Role |
|-----|-------|------|
| `p0`–`p7` | 120 bits | Coprocessor accumulators / load-store temps |
| `pc` | 30 bits | P30 unit address pointer (optional; monitor uses host `a0`) |

`p0` is hardwired zero on read (120 bits of zero).

## 3. Instruction encoding (custom-0)

P30CP uses RISC-V **custom-0** opcode `0x0B`. All instructions are `.insn`-able in GNU `as` once the extension macro header lands (Phase 3).

Common fields: `rd`, `rs1`, `rs2` are RV32 GPR indices. 120-bit ops use **pair encoding** (two consecutive `custom-0` insns) in v0.1; Phase 2b may widen to RoCC.

| Mnemonic | funct7 | funct3 | Operands | Operation |
|----------|--------|--------|----------|-----------|
| `PVALID` | `0x00` | `0` | `rd, rs1` | `rd ← valid(x[rs1][29:0]) ? 1 : 0` |
| `PLOAD` | `0x01` | `0` | `rd, rs1` | Load one u30 from P30 mem **unit** `[rs1]` into `rd[29:0]` |
| `PSTORE` | `0x02` | `0` | `rs1, rs2` | Store `rs2[29:0]` to P30 mem **unit** `[rs1]` |
| `PRES` | `0x03` | `0` | `rd, rs1` | `rd[29:0] ← residue(x[rs1])` (5-bit wheel slot) |
| `PPACK` | `0x10` | `0` | `pd, rs1` | Serialize host 15-byte lane at byte addr `[rs1]` into `p[pd]` |
| `PUNPK` | `0x11` | `0` | `ps, rs1` | Serialize `p[ps]` to host 15-byte lane at byte addr `[rs1]` |
| `PVALL` | `0x20` | `0` | `rd, rs1, rs2` | Validate `rs2` units starting at unit `[rs1]`; `rd ← fail count` |

`PLOAD`/`PSTORE`/`PVALL` take **unit addresses** (native P30 memory).
`PPACK`/`PUNPK` are the serialization bridge and take a **host byte address**.

**Trap behaviour (v0.1):** `PVALID`/`PVALL` **do not trap**; they set GPR results. `PPACK`/`PUNPK` raise `Store/LoadAddrMisaligned` on the host when the *host byte address* `[rs1] mod 15 ≠ 0`. Native unit accesses (`PLOAD`/`PSTORE`) have no alignment constraint — a unit is one cell.

## 4. Memory-mapped monitor (FPGA)

When no OS is present, a **monitor ROM** on the RV32 core exposes a UART command channel. Same grammar as the host-side `p30emu monitor` REPL.

| MMIO offset | Name | Access |
|-------------|------|--------|
| `0x1000_0000` | `UART_TX` | W |
| `0x1000_0004` | `UART_RX` | R |
| `0x1000_0010` | `UART_STATUS` | R (bit0 = RX ready) |
| `0x1001_0000` | `P30_MEM` | unit array; byte-bus reads/writes go through the pack/unpack controller |

Monitor firmware parses line-oriented UTF-8 commands (115200 8N1 default).

## 5. Monitor commands (normative)

Commands are case-insensitive; `#` starts an end-of-line comment.

```
LOAD <path>
SAVE <path> [char|packed]
VALIDATE
STATS
MEM [hex_unit_addr] [hex_unit_count]
HELP
QUIT
```

### LOAD

- If `<path>` is a **binary** file starting with magic `P30C` or `P30P`, decode per P30-SPEC §4.
- If `<path>` is **UTF-8 text** (no magic), treat as logical payload and retain as loaded text (CHAR semantics).

Response: `OK LOAD chars=N bytes=B format=CHAR|PACKED|TEXT`

### SAVE

- `SAVE <path> char` — write CHAR blob of loaded text.
- `SAVE <path> packed` — write PACKED blob (default if omitted).

Response: `OK SAVE bytes=B`

### VALIDATE

Run library **Verify** on loaded text: every character must `Locate` to a coprime position. If a PACKED blob was loaded, also verify checksum.

Response: `OK VALIDATE chars=N` or `ERR VALIDATE …`

### STATS

Print CCP-0 snapshot (library ops, BIOS ops, Hamming ops, storage sizes) for loaded text.

### MEM

Dump of P30 **unit** memory: addresses are unit indices, values are decimal
30-bit unit cells. The first quad's 15-byte serialization (§1.3) is shown as a
`lane[0..4] -> 15B` hex line to illustrate the host/DRAM transport form.

## 6. Phase 2 deliverables map

| Artifact | Status |
|----------|--------|
| This document | v0.1 draft |
| `emulator/p30emu` | Functional monitor REPL |
| `fpga/` | LiteX/VexRiscv integration (stub README) |
| GNU macro header | Phase 3 |
| Cycle-accurate RV32+P30CP | Phase 2b |

## 7. Example monitor session

```
> LOAD spec/canonical_corpus.txt
OK LOAD chars=163 bytes=167 format=TEXT
> VALIDATE
OK VALIDATE chars=163
> STATS
chars: 163
library_ops: 489
bios_ops: 163
hamming_ops: 12264
> SAVE out/canonical.p30 packed
OK SAVE bytes=171
> QUIT
```

## 8. Related documents

- [P30-SPEC v0.2](../P30-SPEC.md) — CHAR/PACKED/HUFFMAN/DIRECT layouts
- [ADR-002](../adr/002-isa-strategy.md) — RISC-V + coprocessor strategy
- [ADR-001](../adr/001-coprime-position.md) — Phase 1 code unit
