/* Hamming SECDED soak — 12264 irreversible ops per pass (21 x 584 on 163 B). */
#include "p30_soak.h"
#include "p30_uart.h"

#define HAMMING_OPS_PER_WORD 584u
#define HAMMING_WORDS 21u
#define HAMMING_OPS_PER_PASS (HAMMING_WORDS * HAMMING_OPS_PER_WORD)

static volatile unsigned int op_sink;
static unsigned long pass_count;

static unsigned hamming_word_ops(unsigned word_idx) {
    unsigned ops = 0;
    /* Model 584 ops/word: 256 parity gen + 256 syndrome + 72 correction */
    for (unsigned i = 0; i < 256u; i++) {
        irreversible_step(&op_sink, word_idx ^ i);
        ops++;
    }
    for (unsigned i = 0; i < 256u; i++) {
        irreversible_step(&op_sink, (word_idx << 8) ^ i);
        ops++;
    }
    for (unsigned i = 0; i < 72u; i++) {
        irreversible_step(&op_sink, (word_idx << 16) ^ i);
        ops++;
    }
    return ops;
}

static unsigned run_hamming_pass(void) {
    unsigned ops = 0;
    for (unsigned w = 0; w < HAMMING_WORDS; w++) {
        ops += hamming_word_ops(w);
        /* Touch corpus bytes covered by this 64-bit word */
        unsigned base = (w * 8u) % CORPUS_LEN;
        for (unsigned b = 0; b < 8u; b++) {
            unsigned idx = (base + b) % CORPUS_LEN;
            irreversible_step(&op_sink, corpus_utf8[idx]);
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
    uart_puts(" mode=HAMMING\r\n");
}

static void cmd_pass(void) {
    unsigned ops = run_hamming_pass();
    pass_count++;
    uart_puts("OK PASS ops=");
    print_hex32(ops);
    uart_puts("\r\n");
}

static void cmd_start(void) {
    uart_puts("OK START HAMMING\r\n");
    for (;;) {
        unsigned ops = run_hamming_pass();
        pass_count++;
        if ((pass_count & 0x3Fu) == 0u) {
            uart_puts("TICK passes=");
            print_hex32((unsigned)pass_count);
            uart_puts(" last_ops=");
            print_hex32(ops);
            uart_puts("\r\n");
        }
        (void)ops;
    }
}

int soak_main(void) {
    char buf[64];
    unsigned pos = 0;

    uart_puts("\r\nhamming_soak v0.1 — SECDED hot loop\r\n> ");

    for (;;) {
        int c = uart_getc();
        if (c == '\r' || c == '\n') {
            uart_puts("\r\n");
            buf[pos] = 0;
            if (buf[0] == 'S' || buf[0] == 's') {
                cmd_start();
            } else if (buf[0] == 'P' || buf[0] == 'p') {
                cmd_pass();
            } else if (buf[0] == 'T' || buf[0] == 't') {
                cmd_status();
            } else if (buf[0] == 'H' || buf[0] == 'h') {
                uart_puts("Commands: START | PASS | STATUS | HELP\r\n");
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
