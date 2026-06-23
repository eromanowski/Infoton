"""Digilent Arty A7 platform constants for P30 LiteX builds."""

ARTY_A7_35T = {
    "name": "digilent_arty_a7_35t",
    "device": "xc7a35t",
    "package": "csg324",
    "speedgrade": "-1",
    "vendor": "xilinx",
    "toolchain": "vivado",
    "uart_baud": 115200,
    "sys_clk_freq": 100_000_000,  # 100 MHz CMOS oscillator
    "product_url": "https://digilent.com/shop/arty-a7-35t-fpga-development-board/",
}

ARTY_A7_100T = {
    **ARTY_A7_35T,
    "name": "digilent_arty_a7_100t",
    "device": "xc7a100t",
    "product_url": "https://digilent.com/shop/arty-a7-100t-fpga-development-board/",
}

DEFAULT_PLATFORM = ARTY_A7_35T
