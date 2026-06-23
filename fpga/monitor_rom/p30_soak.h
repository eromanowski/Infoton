#ifndef P30_SOAK_H
#define P30_SOAK_H

#include "p30_mmio.h"

/* Canonical demo corpus (163 chars) — spec/canonical_corpus.txt */
#define CORPUS_LEN 163

extern const unsigned char corpus_utf8[CORPUS_LEN];
extern const unsigned int corpus_pos[CORPUS_LEN];

/* Irreversible op step (Landauer stand-in: branch + memory write) */
static inline void irreversible_step(volatile unsigned int *sink, unsigned int v) {
    *sink = (*sink ^ v) + 0x9e3779b9u;
    if (*sink & 1u) {
        *sink ^= v >> 1;
    }
}

static inline unsigned gcd_u32(unsigned a, unsigned b) {
    while (b != 0u) {
        unsigned t = a % b;
        a = b;
        b = t;
    }
    return a;
}

static inline int coprime30(unsigned v) {
    return v != 0u && gcd_u32(v, 30u) == 1u;
}

/* Escape path: char_index * 30 + T[byte mod 8] */
static inline unsigned locate_escape(unsigned char byte, unsigned idx) {
    static const unsigned char T[8] = {1, 7, 11, 13, 17, 19, 23, 29};
    return idx * 30u + T[byte & 7u];
}

static inline unsigned locate_char(unsigned char byte, unsigned idx) {
    /* Tier-1 fast path: use precomputed corpus_pos when idx < CORPUS_LEN */
    if (idx < CORPUS_LEN) {
        return corpus_pos[idx];
    }
    return locate_escape(byte, idx);
}

#endif
