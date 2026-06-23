//! Hamming SECDED baseline operation model (Infoton demo: 584 ops per 64-bit word).

/// Number of 64-bit words required to cover `byte_len` UTF-8 bytes.
pub fn words_for_bytes(byte_len: usize) -> u64 {
    let bits = (byte_len as u64) * 8;
    bits.div_ceil(64)
}

/// Total Hamming SECDED ops per Infoton demo constant.
pub fn secded_ops_for_bytes(byte_len: usize) -> u64 {
    words_for_bytes(byte_len) * crate::infoton::HAMMING_OPS_PER_64BIT_WORD
}

/// Granular step model documented for CCP-0 (approximation of 584 steps/word).
#[derive(Debug, Clone, Copy, Default)]
pub struct SecdedBreakdown {
    pub words: u64,
    pub parity_generation: u64,
    pub syndrome_check: u64,
    pub correction: u64,
}

impl SecdedBreakdown {
    pub fn total(&self) -> u64 {
        self.parity_generation + self.syndrome_check + self.correction
    }

    /// Split 584 ops/word to match the step model in `viz/hamming.html`:
    /// parity generation on the write path (128 = 2 ops x 64 data bits),
    /// syndrome check on the read path (455), and a single correcting XOR (1).
    /// Write 128 + read 456 = 584. The read path (syndrome + correction = 456)
    /// is the cost a P30 read skips entirely (reverify_on_read = 0).
    pub fn for_bytes(byte_len: usize) -> Self {
        let words = words_for_bytes(byte_len);
        Self {
            words,
            parity_generation: words * 128,
            syndrome_check: words * 455,
            correction: words * 1,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::infoton;

    #[test]
    fn secded_163_bytes() {
        assert_eq!(words_for_bytes(163), 21);
        assert_eq!(secded_ops_for_bytes(163), infoton::TARGET_HAMMING_OPS);
        assert_eq!(SecdedBreakdown::for_bytes(163).total(), infoton::TARGET_HAMMING_OPS);
    }
}
