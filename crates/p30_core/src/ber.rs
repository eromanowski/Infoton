//! Bit-flip detection comparison: Tier-1 Verify vs Hamming parity vs PACKED checksum.

use crate::storage::position_checksum;
use crate::{position_value, verify_position};

/// Inject a single-bit flip at `bit_index` in UTF-8 bytes of `text`.
pub fn flip_bit(text: &str, bit_index: usize) -> Vec<u8> {
    let mut bytes = text.as_bytes().to_vec();
    let byte_i = bit_index / 8;
    let bit_i = bit_index % 8;
    if byte_i < bytes.len() {
        bytes[byte_i] ^= 1 << bit_i;
    }
    bytes
}

/// Tier-1 coprimality verify on character positions.
pub fn coprimality_detects_flip(text: &str, bit_index: usize) -> bool {
    let flipped = flip_bit(text, bit_index);
    let Ok(s) = std::str::from_utf8(&flipped) else {
        return true;
    };
    for (i, ch) in s.chars().enumerate() {
        if !verify_position(position_value(ch, i)) {
            return true;
        }
    }
    false
}

/// PACKED position checksum detects many single-bit flips.
pub fn packed_checksum_detects_flip(text: &str, bit_index: usize) -> bool {
    let flipped = flip_bit(text, bit_index);
    let Ok(s) = std::str::from_utf8(&flipped) else {
        return true;
    };
    position_checksum(text) != position_checksum(s)
}

/// Simple even-parity over 64-bit word.
pub fn hamming_parity_detects_flip(text: &str, bit_index: usize) -> bool {
    let bytes = flip_bit(text, bit_index);
    let word = bit_index / 64;
    let start = word * 8;
    if start >= bytes.len() {
        return false;
    }
    let end = (start + 8).min(bytes.len());
    let parity: u8 = bytes[start..end]
        .iter()
        .fold(0, |acc, &b| acc ^ b.count_ones() as u8);
    parity % 2 != 0
}

#[derive(Debug, Clone, Copy, Default)]
pub struct BerComparison {
    pub trials: u64,
    pub coprimality_detected: u64,
    pub packed_checksum_detected: u64,
    pub hamming_detected: u64,
    pub silent: u64,
}

pub fn compare_single_bit_flips(text: &str) -> BerComparison {
    let bit_len = text.len() * 8;
    let mut result = BerComparison {
        trials: bit_len as u64,
        ..Default::default()
    };
    for bit in 0..bit_len {
        let c = coprimality_detects_flip(text, bit);
        let p = packed_checksum_detects_flip(text, bit);
        let h = hamming_parity_detects_flip(text, bit);
        if c {
            result.coprimality_detected += 1;
        }
        if p {
            result.packed_checksum_detected += 1;
        }
        if h {
            result.hamming_detected += 1;
        }
        if !c && !p && !h {
            result.silent += 1;
        }
    }
    result
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::canonical::INFOTON_DEMO_SENTENCE;

    #[test]
    fn tier1_verify_detects_some_flips_on_canonical() {
        let r = compare_single_bit_flips(INFOTON_DEMO_SENTENCE);
        // Tier-1 fixed values: many bit flips still decode to coprime tier-1 chars.
        assert!(r.coprimality_detected < r.trials);
    }

    #[test]
    fn packed_checksum_detects_most_flips() {
        let r = compare_single_bit_flips(INFOTON_DEMO_SENTENCE);
        assert!(r.packed_checksum_detected > r.trials / 2);
    }
}
