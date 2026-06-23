# Phase 2 FPGA bring-up

Target: **RISC-V soft core** (LiteX / VexRiscv) + **P30 pack/unpack coprocessor** per [ADR-002](../docs/adr/002-isa-strategy.md).

## RTL

| File | Role |
|------|------|
| [`p30_pack.v`](p30_pack.v) | 30-bit unit ↔ 15-byte lane pack/unpack + `p30_valid_unit` |
| [`tb_p30_pack.v`](tb_p30_pack.v) | Golden testbench |
| [`golden_pack.inc`](golden_pack.inc) | Auto-generated vectors (from `tools/verify_p30_pack.py`) |

Golden reference (software): [`emulator/p30emu/src/unit.rs`](../emulator/p30emu/src/unit.rs).

## Verify

```bash
python tools/verify_p30_pack.py
```

Runs Python round-trip on [`spec/pack_vectors.json`](../spec/pack_vectors.json), regenerates `golden_pack.inc`, and simulates with **Icarus Verilog** when `iverilog` is installed:

```bash
cd fpga
iverilog -o tb_p30_pack.out p30_pack.v tb_p30_pack.v && vvp tb_p30_pack.out
```

## LiteX SoC

| Path | Role |
|------|------|
| [`litex/p30_soc.py`](litex/p30_soc.py) | VexRiscv + UART + P30 mem builder |
| [`litex/p30_periph.py`](litex/p30_periph.py) | Wishbone byte RAM + pack CSRs |
| [`rtl/p30_mem_ctrl.v`](rtl/p30_mem_ctrl.v) | Verilog mem controller (uses `p30_pack.v`) |
| [`monitor_rom/`](monitor_rom/) | Bare-metal UART monitor stub |

```bash
python fpga/litex/p30_soc.py --dry-run
python tools/verify_litex_soc.py
```

See [`litex/README.md`](litex/README.md).

## Planned layout

```
fpga/
  p30_pack.v          ← golden-tested
  litex/              ← SoC generator
  monitor_rom/        ← UART firmware stub
  rtl/p30_mem_ctrl.v
```

## MMIO map (draft)

| Address | Device |
|---------|--------|
| `0x1000_0000` | UART TX |
| `0x1000_0004` | UART RX |
| `0x1001_0000` | P30 byte memory (via pack/unpack controller) |

Monitor command grammar: [`docs/isa/P30-ISA-v0.1.md`](../docs/isa/P30-ISA-v0.1.md). Reference emulator: [`emulator/p30emu`](../emulator/p30emu).

## Next steps

1. Board platform (**Arty A7-35T**) instead of sim-only `SimPlatform`.
2. Wire `p30_lane_pack` into CSR pack path; load `monitor_rom.bin` via LiteX BIOS.
3. **`p30_soak.c` / `hamming_soak.c`** for Phase 9 dual-board power comparison.
4. Storage bridge for firmware `LOAD`/`SAVE` (SD/QSPI or host loader).
