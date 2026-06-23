/* P30 monitor ROM — MMIO map (must match fpga/litex/p30_soc.py) */
#ifndef P30_MMIO_H
#define P30_MMIO_H

#define UART_BASE     0x10000000u
#define P30_MEM_BASE  0x10010000u
#define P30_MEM_SIZE  4096u
#define P30_CSR_BASE  0x10020000u

/* LiteX CSR UART — offsets from generated csr.h in full build */
#define CSR_UART_RXTX   0u
#define CSR_UART_TXFULL 1u
#define CSR_UART_RXEMPTY 2u

#endif
