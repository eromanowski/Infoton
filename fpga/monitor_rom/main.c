#include "p30_mmio.h"

#define UART_RXTX (*(volatile unsigned int *)(UART_BASE + 0x00))
#define UART_TXFULL (*(volatile unsigned int *)(UART_BASE + 0x04))
#define UART_RXEMPTY (*(volatile unsigned int *)(UART_BASE + 0x08))

static void uart_putc(char c) {
    while (UART_TXFULL & 1u) {
    }
    UART_RXTX = (unsigned char)c;
}

static void uart_puts(const char *s) {
    while (*s) {
        if (*s == '\n') {
            uart_putc('\r');
        }
        uart_putc(*s++);
    }
}

static int uart_getc(void) {
    while (UART_RXEMPTY & 1u) {
    }
    return (int)(UART_RXTX & 0xFFu);
}

static int streq_ci(const char *a, const char *b) {
    while (*a && *b) {
        char ca = *a++;
        char cb = *b++;
        if (ca >= 'A' && ca <= 'Z') {
            ca = (char)(ca + ('a' - 'A'));
        }
        if (cb >= 'A' && cb <= 'Z') {
            cb = (char)(cb + ('a' - 'A'));
        }
        if (ca != cb) {
            return 0;
        }
    }
    return *a == *b;
}

static void cmd_help(void) {
    uart_puts(
        "Commands: HELP | ECHO | MEM <hex> | VALIDATE stub | QUIT\r\n"
        "Full LOAD/SAVE: use host p30emu until SD/host bridge lands\r\n");
}

static void cmd_mem(const char *hex) {
    unsigned addr = 0;
    while (*hex == ' ') {
        hex++;
    }
    if (*hex == 0) {
        addr = P30_MEM_BASE;
    } else {
        while (*hex) {
            char c = *hex++;
            addr <<= 4;
            if (c >= '0' && c <= '9') {
                addr |= (unsigned)(c - '0');
            } else if (c >= 'a' && c <= 'f') {
                addr |= (unsigned)(c - 'a' + 10);
            } else if (c >= 'A' && c <= 'F') {
                addr |= (unsigned)(c - 'A' + 10);
            }
        }
    }
    uart_puts("MEM @");
    /* minimal hex print */
    for (int shift = 28; shift >= 0; shift -= 4) {
        unsigned nibble = (addr >> shift) & 0xFu;
        uart_putc((char)(nibble < 10 ? '0' + nibble : 'a' + nibble - 10));
    }
    uart_puts(": ");
    for (unsigned i = 0; i < 16; i++) {
        unsigned char b = *(volatile unsigned char *)(addr + i);
        unsigned hi = (b >> 4) & 0xFu;
        unsigned lo = b & 0xFu;
        uart_putc((char)(hi < 10 ? '0' + hi : 'a' + hi - 10));
        uart_putc((char)(lo < 10 ? '0' + lo : 'a' + lo - 10));
        uart_putc(' ');
    }
    uart_puts("\r\n");
}

static void dispatch(char *line) {
    while (*line == ' ') {
        line++;
    }
    if (*line == 0 || *line == '#') {
        return;
    }
    if (streq_ci(line, "HELP") || streq_ci(line, "?")) {
        cmd_help();
    } else if (streq_ci(line, "QUIT") || streq_ci(line, "EXIT")) {
        uart_puts("OK QUIT\r\n");
        for (;;) {
        }
    } else if (streq_ci(line, "VALIDATE")) {
        uart_puts("OK VALIDATE stub (host p30emu for full check)\r\n");
    } else if (streq_ci(line, "STATS")) {
        uart_puts("STATS stub — use host p30emu\r\n");
    } else if (streq_ci(line, "ECHO")) {
        uart_puts("OK ECHO\r\n");
    } else if (line[0] == 'M' || line[0] == 'm') {
        if (line[1] == 'E' || line[1] == 'e') {
            cmd_mem(line + 3);
        }
    } else {
        uart_puts("ERR unknown (try HELP)\r\n");
    }
}

int main(void) {
    char buf[128];
    unsigned pos = 0;

    uart_puts("\r\np30 monitor ROM v0.1 — P30-ISA UART\r\n> ");

    for (;;) {
        int c = uart_getc();
        if (c == '\r' || c == '\n') {
            uart_puts("\r\n");
            buf[pos] = 0;
            dispatch(buf);
            pos = 0;
            uart_puts("> ");
        } else if (c == 127 || c == 8) {
            if (pos > 0) {
                pos--;
                uart_puts("\b \b");
            }
        } else if (pos + 1 < sizeof(buf)) {
            buf[pos++] = (char)c;
            uart_putc((char)c);
        }
    }
    return 0;
}
