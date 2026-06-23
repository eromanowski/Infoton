/* P30 Library soak — 489 irreversible ops per pass (3 x 163 chars). */
#include "p30_soak.h"
#include "p30_uart.h"

#define SOAK_MODE_BIOS 0
#define SOAK_MODE_LIBRARY 1

static volatile unsigned int op_sink;
static unsigned long pass_count;
static int library_mode = SOAK_MODE_LIBRARY;

static unsigned run_p30_pass(int lib) {
    unsigned ops = 0;
    for (unsigned i = 0; i < CORPUS_LEN; i++) {
        unsigned pos = locate_char(corpus_utf8[i], i);
        /* Locate */
        irreversible_step(&op_sink, pos);
        ops++;
        /* Emit (storage residue) */
        irreversible_step(&op_sink, (pos % 30u) | (i << 5));
        ops++;
        if (library_mode) {
            /* Verify */
            if (!coprime30(pos)) {
                uart_puts("ERR VERIFY\r\n");
            }
            irreversible_step(&op_sink, pos ^ 0xA5A5A5A5u);
            ops++;
        }
    }
    return ops;
}

static void print_hex32(unsigned v) {
    for (int s = 28; s >= 0; s -= 4) {
        unsigned n = (v >> s) & 0xFu;
        uart_putc((char)(n < 10 ? '0' + n : 'a' + n - 10));
    }
}

static void cmd_status(void) {
    uart_puts("STATUS passes=");
    print_hex32((unsigned)pass_count);
    uart_puts(" mode=P30\r\n");
}

static void cmd_pass(void) {
    unsigned ops = run_p30_pass(library_mode);
    pass_count++;
    uart_puts("OK PASS ops=");
    print_hex32(ops);
    uart_puts("\r\n");
}

static void cmd_start(const char *arg) {
    library_mode = SOAK_MODE_LIBRARY;
    if (arg[0] == 'B' || arg[0] == 'b') {
        library_mode = SOAK_MODE_BIOS;
    }
    uart_puts("OK START P30 ");
    uart_puts(library_mode ? "LIBRARY\r\n" : "BIOS\r\n");
    for (;;) {
        unsigned ops = run_p30_pass(library_mode);
        pass_count++;
        if ((pass_count & 0xFFu) == 0u) {
            uart_puts("TICK passes=");
            print_hex32((unsigned)pass_count);
            uart_puts(" last_ops=");
            print_hex32(ops);
            uart_puts("\r\n");
        }
    }
}

int soak_main(void) {
    char buf[64];
    unsigned pos = 0;

    uart_puts("\r\np30_soak v0.1 — P30 Library/BIOS hot loop\r\n> ");

    for (;;) {
        int c = uart_getc();
        if (c == '\r' || c == '\n') {
            uart_puts("\r\n");
            buf[pos] = 0;
            if (buf[0] == 'S' || buf[0] == 's') {
                const char *arg = buf + 5;
                while (*arg == ' ') arg++;
                cmd_start(arg);
            } else if (buf[0] == 'P' || buf[0] == 'p') {
                cmd_pass();
            } else if (buf[0] == 'T' || buf[0] == 't') {
                cmd_status();
            } else if (buf[0] == 'H' || buf[0] == 'h') {
                uart_puts("Commands: START LIBRARY | START BIOS | PASS | STATUS | HELP\r\n");
            } else if (pos > 0) {
                uart_puts("ERR try HELP\r\n");
            }
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

#ifndef SOAK_MAIN
int main(void) {
    return soak_main();
}
#endif
