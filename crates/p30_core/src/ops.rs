use crate::{position_value, verify_position, infoton};

/// Deployment profile for irreversible operation counting (CCP-0).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Profile {
    /// Locate + Emit + Verify per character (conservative library on byte stack).
    Library,
    /// Ingress encode once per character; zero re-verify on read.
    BiosNative,
}

/// Per-operation breakdown matching Infoton demo UI labels.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct OpBreakdown {
    pub locate: u64,
    pub emit: u64,
    pub verify: u64,
    pub reverify_on_read: u64,
    pub ingress_encode: u64,
}

impl OpBreakdown {
    pub fn total(&self) -> u64 {
        self.locate + self.emit + self.verify + self.reverify_on_read + self.ingress_encode
    }
}

/// Count P30 irreversible ops for `text` under `profile`.
pub fn count_p30_ops(text: &str, profile: Profile) -> OpBreakdown {
    let n = text.chars().count() as u64;
    match profile {
        Profile::Library => OpBreakdown {
            locate: n,
            emit: n,
            verify: n,
            reverify_on_read: 0,
            ingress_encode: 0,
        },
        Profile::BiosNative => OpBreakdown {
            locate: 0,
            emit: 0,
            verify: 0,
            reverify_on_read: 0,
            ingress_encode: n,
        },
    }
}

/// Run Locate+Verify over text (library validation pass) using Tier-1 positions.
pub fn validate_all_positions(text: &str) -> bool {
    for (i, ch) in text.chars().enumerate() {
        let pos = position_value(ch, i);
        if !verify_position(pos) {
            return false;
        }
    }
    true
}

/// Hamming SECDED baseline op count for UTF-8 bytes of `text`.
pub fn count_hamming_secded_ops(text: &str) -> u64 {
    let bytes = text.len() as u64;
    let words = bytes.div_ceil(64 / 8); // 64-bit words covering all bytes
    words * infoton::HAMMING_OPS_PER_64BIT_WORD
}

/// Full calculator snapshot for Infoton demo comparison.
#[derive(Debug, Clone, PartialEq)]
pub struct CalculatorSnapshot {
    pub char_count: usize,
    pub utf8_bytes: usize,
    pub library: OpBreakdown,
    pub bios: OpBreakdown,
    pub hamming_ops: u64,
    pub char_storage_bytes: usize,
    pub packed_storage_bytes: usize,
    pub huffman_total_bytes: usize,
    pub huffman_payload_bytes: usize,
    pub direct_storage_bytes: usize,
    pub landauer_zj_at_350k: f64,
}

impl CalculatorSnapshot {
    pub fn from_text(text: &str) -> Self {
        use crate::storage::{
            char_round_trip_bytes, direct_write_bytes, huffman_payload_bytes, huffman_total_bytes,
            packed_round_trip_bytes,
        };

        Self {
            char_count: text.chars().count(),
            utf8_bytes: text.len(),
            library: count_p30_ops(text, Profile::Library),
            bios: count_p30_ops(text, Profile::BiosNative),
            hamming_ops: count_hamming_secded_ops(text),
            char_storage_bytes: char_round_trip_bytes(text),
            packed_storage_bytes: packed_round_trip_bytes(text),
            huffman_total_bytes: huffman_total_bytes(text),
            huffman_payload_bytes: huffman_payload_bytes(text),
            direct_storage_bytes: direct_write_bytes(text),
            landauer_zj_at_350k: crate::landauer_energy_zj(infoton::DRAM_JUNCTION_K),
        }
    }

    pub fn library_vs_hamming_ratio(&self) -> f64 {
        self.hamming_ops as f64 / self.library.total() as f64
    }

    pub fn bios_vs_hamming_ratio(&self) -> f64 {
        self.hamming_ops as f64 / self.bios.total() as f64
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::canonical::INFOTON_DEMO_SENTENCE;
    use crate::infoton;

    #[test]
    fn hamming_ops_163_ascii() {
        let text = "a".repeat(163);
        assert_eq!(count_hamming_secded_ops(&text), infoton::TARGET_HAMMING_OPS);
    }

    #[test]
    fn library_and_bios_ops_163_chars() {
        let text = "a".repeat(163);
        assert_eq!(
            count_p30_ops(&text, Profile::Library).total(),
            infoton::TARGET_LIBRARY_OPS
        );
        assert_eq!(
            count_p30_ops(&text, Profile::BiosNative).total(),
            infoton::TARGET_BIOS_OPS
        );
    }

    #[test]
    fn canonical_snapshot_matches_infoton_demo() {
        let snap = CalculatorSnapshot::from_text(INFOTON_DEMO_SENTENCE);
        assert_eq!(snap.char_count, infoton::TARGET_UTF8_BYTES);
        assert_eq!(snap.library.total(), infoton::TARGET_LIBRARY_OPS);
        assert_eq!(snap.bios.total(), infoton::TARGET_BIOS_OPS);
        assert_eq!(snap.hamming_ops, infoton::TARGET_HAMMING_OPS);
        assert_eq!(snap.char_storage_bytes, infoton::TARGET_CHAR_BYTES);
        assert_eq!(snap.packed_storage_bytes, infoton::TARGET_PACKED_BYTES);
        assert_eq!(snap.huffman_payload_bytes, infoton::TARGET_HUFFMAN_PAYLOAD);
        assert_eq!(snap.direct_storage_bytes, infoton::TARGET_DIRECT_BYTES);
    }
}
