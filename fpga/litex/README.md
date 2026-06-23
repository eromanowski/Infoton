# P30 LiteX SoC

RV32 (**VexRiscv lite**) + UART + **4 KiB P30 byte memory** + pack/unpack CSR bank.

**Reference board:** [Digilent Arty A7-35T](https://digilent.com/shop/arty-a7-35t-fpga-development-board/)

## Memory map

| Region | Address | Size |
|--------|---------|------|
| SRAM (firmware) | `0x0000_0000` | 32 KiB |
| UART CSRs | `0x1000_0000` | LiteX |
| P30 byte memory | `0x1001_0000` | 4 KiB |
| P30 pack CSRs | `0x1002_0000` | LiteX |

## Quick start

```bash
python fpga/litex/p30_soc.py --platform arty --dry-run
python fpga/litex/p30_soc.py --platform sim --build

pip install -r fpga/litex/requirements.txt
python fpga/litex/p30_soc.py --platform arty --build-gateware   # Vivado
```

## Soak firmware (thermal bench)

```bash
python tools/gen_corpus_firmware.py
cd fpga/monitor_rom && make p30_soak hamming_soak
```

| Image | UART start |
|-------|------------|
| `p30_soak.bin` | `START LIBRARY` or `START BIOS` |
| `hamming_soak.bin` | `START` |

See [`docs/bench/dual-fpga-thermal.md`](../../docs/bench/dual-fpga-thermal.md).

## Monitor firmware (interactive)

`make monitor` → `monitor_rom.bin` with `HELP`, `MEM`, `VALIDATE` stub.

## RTL

- [`../p30_pack.v`](../p30_pack.v)
- [`../rtl/p30_mem_ctrl.v`](../rtl/p30_mem_ctrl.v)
