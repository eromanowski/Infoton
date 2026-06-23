#!/usr/bin/env python3
"""
P30 LiteX SoC — RV32 (VexRiscv) + UART + P30 byte memory.

Platforms:
  sim   — Verilator/Icarus simulation (default --build)
  arty  — Digilent Arty A7-35T (requires litex-boards + Vivado)

  python fpga/litex/p30_soc.py --dry-run
  python fpga/litex/p30_soc.py --platform sim --build
  python fpga/litex/p30_soc.py --platform arty --build-gateware
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LITEX_DIR = Path(__file__).resolve().parent

UART_BASE = 0x1000_0000
P30_MEM_BASE = 0x1001_0000
P30_CSR_BASE = 0x1002_0000
RAM_BASE = 0x0000_0000
RAM_SIZE = 0x8000
P30_MEM_SIZE = 4096


def dry_run(platform: str) -> None:
    from p30_arty import ARTY_A7_35T

    print("P30SoC (dry run)")
    print(f"  platform: {platform}")
    print(f"  RAM:      0x{RAM_BASE:08x}  size=0x{RAM_SIZE:x}")
    print(f"  UART:     0x{UART_BASE:08x}")
    print(f"  P30 mem:  0x{P30_MEM_BASE:08x}  size={P30_MEM_SIZE}")
    print(f"  P30 CSR:  0x{P30_CSR_BASE:08x}")
    if platform == "arty":
        print(f"  board:    {ARTY_A7_35T['product_url']}")
        print(f"  fpga:     {ARTY_A7_35T['device']}{ARTY_A7_35T['speedgrade']}")
        print(f"  clock:    {ARTY_A7_35T['sys_clk_freq'] // 1_000_000} MHz")
    print("  firmware: fpga/monitor_rom/{monitor_rom,p30_soak,hamming_soak}.bin")


def make_soc(platform_obj):
    sys.path.insert(0, str(LITEX_DIR))
    from litex.soc.integration.builder import Builder
    from litex.soc.integration.soc import SoC, SoCRegion

    from p30_periph import P30ByteMemory, P30PackCSRs

    class P30SoC(SoC):
        def __init__(self, platform):
            super().__init__(
                platform,
                csr_data_width=32,
                cpu_type="vexriscv",
                cpu_variant="lite",
            )
            self.add_ram("sram", RAM_BASE, RAM_SIZE)
            uart_pads = platform.request("serial")
            self.add_uart(uart_pads=uart_pads, baudrate=115200)
            self.submodules.p30_mem = P30ByteMemory(size=P30_MEM_SIZE)
            self.bus.add_slave(
                "p30_mem",
                self.p30_mem.bus,
                region=SoCRegion(
                    origin=P30_MEM_BASE, size=P30_MEM_SIZE, cached=False
                ),
            )
            self.submodules.p30_pack = P30PackCSRs()
            self.csr.add("p30_pack", use_loc_if_exists=True)

    soc = P30SoC(platform_obj)
    builder = Builder(soc, compile_software=False)
    builder.add_sources(
        str(ROOT / "fpga" / "p30_pack.v"),
        str(ROOT / "fpga" / "rtl" / "p30_mem_ctrl.v"),
    )
    return soc, builder


def platform_sim():
    from litex.build.generic_platform import Pins, Subsignal
    from litex.build.sim.platform import SimPlatform

    return SimPlatform(
        "SIM",
        [
            (
                "serial",
                0,
                Subsignal("tx", Pins(1)),
                Subsignal("rx", Pins(1)),
            )
        ],
    )


def platform_arty():
    try:
        from litex_boards.platforms import digilent_arty
    except ImportError as e:
        raise ImportError(
            "litex-boards required for Arty. pip install litex-boards"
        ) from e
    return digilent_arty.Platform(variant="a7-35")


def build(platform_name: str, run_sim: bool, gateware_only: bool) -> None:
    if platform_name == "sim":
        platform = platform_sim()
        build_dir = LITEX_DIR / "build" / "sim"
    elif platform_name == "arty":
        platform = platform_arty()
        build_dir = LITEX_DIR / "build" / "arty_a7_35t"
    else:
        raise SystemExit(f"unknown platform: {platform_name}")

    soc, builder = make_soc(platform)
    builder.build(
        run=run_sim,
        build_name="p30_soc",
        build_dir=str(build_dir),
    )
    print(f"Output: {build_dir}")


def main() -> None:
    parser = argparse.ArgumentParser(description="P30 LiteX SoC")
    parser.add_argument(
        "--platform",
        choices=("sim", "arty"),
        default="sim",
        help="Target platform (default: sim)",
    )
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--build", action="store_true", help="Build sim gateware")
    parser.add_argument("--sim", action="store_true", help="Build and run sim")
    parser.add_argument(
        "--build-gateware",
        action="store_true",
        help="Synthesize for Arty A7-35T (requires Vivado + litex-boards)",
    )
    args = parser.parse_args()

    if args.dry_run or not (args.build or args.sim or args.build_gateware):
        dry_run(args.platform if not args.build_gateware else "arty")
        if not args.build and not args.sim and not args.build_gateware:
            return

    plat = "arty" if args.build_gateware else args.platform
    build(plat, run_sim=args.sim and plat == "sim", gateware_only=args.build_gateware)


if __name__ == "__main__":
    main()
