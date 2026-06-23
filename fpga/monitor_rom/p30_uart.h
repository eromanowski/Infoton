#ifndef P30_UART_H
#define P30_UART_H

#include "p30_mmio.h"

#define UART_RXTX (*(volatile unsigned int *)(UART_BASE + 0x00))
#define UART_TXFULL (*(volatile unsigned int *)(UART_BASE + 0x04))
#define UART_RXEMPTY (*(volatile unsigned int *)(UART_BASE + 0x08))

static inline void uart_putc(char c) {
    while (UART_TXFULL & 1u) {
    }
    UART_RXTX = (unsigned char)c;
}

static inline void uart_puts(const char *s) {
    while (*s) {
        if (*s == '\n') {
            uart_putc('\r');
        }
        uart_putc(*s++);
    }
}

static inline int uart_getc(void) {
    while (UART_RXEMPTY & 1u) {
    }
    return (int)(UART_RXTX & 0xFFu);
}

#endif
