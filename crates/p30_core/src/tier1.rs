//! Infoton Tier-1 alphabet (P30 v2.0) — fixed coprime value per character.
//!
//! Source: embedded calculator JS in `viz/index.html` / `viz/infoton_reference/widget_2.html`.

/// Tier-1 characters in Infoton table order (68 entries).
pub const TIER1_CHARS: [char; 68] = [
    ' ', 'e', 't', 'a', 'o', 'i', 'n', 's', 'h', '\n', 'r', 'd', 'l', 'c', 'u', 'm', 'w', 'f',
    'g', 'y', 'p', '\'', 'b', 'v', 'k', ',', '.', '1', 'I', '0', 'A', 'T', 'E', '2', 'C', 'S',
    'D', 'N', 'R', '3', 'B', 'H', 'M', 'O', '-', '4', '5', 'F', 'L', 'P', 'W', '6', '7', '8',
    '9', 'G', 'U', 'Y', '!', 'j', 'x', 'K', 'V', '?', 'J', 'q', 'z', 'Q',
];

/// Coprime integer assigned to each Tier-1 character (same order as [`TIER1_CHARS`]).
pub const TIER1_VALUES: [u32; 68] = [
    1, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 49, 53, 59, 61, 67, 71, 73, 77, 79, 83,
    89, 91, 97, 101, 103, 107, 109, 113, 119, 121, 127, 131, 133, 137, 139, 143, 149, 151, 157,
    161, 163, 167, 169, 173, 179, 181, 187, 191, 193, 197, 199, 203, 209, 211, 217, 221, 223,
    227, 229, 233, 239, 241, 247, 251, 253,
];

/// Result of locating a Unicode scalar in the P30 stream.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LocateResult {
    /// Character is in Tier-1; value is the fixed coprime integer from the Infoton table.
    Tier1 { value: u32 },
    /// Character escapes Tier-1; positions derived per UTF-8 byte (see [`crate::locate_totative_byte`]).
    Escape {
        /// Coprime position used for storage/checksum (first escaped byte).
        primary: u32,
        /// Library-mode op weight for this character (viz: 3 ops for escape).
        library_ops: u8,
    },
}

/// Residue mod 30, matching Infoton `residue(v)` in the viz.
#[inline]
pub fn residue_mod30(value: u32) -> u8 {
    ((value % 30) + 30) % 30) as u8
}

/// True if `ch` is in the Infoton Tier-1 alphabet.
#[inline]
pub fn is_tier1(ch: char) -> bool {
    tier1_value(ch).is_some()
}

/// Fixed coprime value for a Tier-1 character, if present.
#[inline]
pub fn tier1_value(ch: char) -> Option<u32> {
    TIER1_CHARS
        .iter()
        .position(|&c| c == ch)
        .map(|i| TIER1_VALUES[i])
}

/// Infoton Locate: table lookup for Tier-1, totative byte path for escape.
#[inline]
pub fn locate_character(ch: char, char_index: usize) -> LocateResult {
    if let Some(value) = tier1_value(ch) {
        return LocateResult::Tier1 { value };
    }
    let mut buf = [0u8; 4];
    let encoded = ch.encode_utf8(&mut buf);
    let primary = crate::locate_totative_byte(encoded.as_bytes()[0], char_index);
    LocateResult::Escape {
        primary,
        library_ops: 3,
    }
}

/// Coprime integer position for checksum, emit, and verify (Tier-1 or escape primary).
#[inline]
pub fn position_value(ch: char, char_index: usize) -> u32 {
    match locate_character(ch, char_index) {
        LocateResult::Tier1 { value } => value,
        LocateResult::Escape { primary, .. } => primary,
    }
}

/// Five-bit storage residue for HUFFMAN/DIRECT payloads.
#[inline]
pub fn storage_residue(ch: char, char_index: usize) -> u8 {
    residue_mod30(position_value(ch, char_index))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::is_coprime;

    #[test]
    fn tier1_table_length() {
        assert_eq!(TIER1_CHARS.len(), TIER1_VALUES.len());
        assert_eq!(TIER1_CHARS.len(), 68);
    }

    #[test]
    fn all_tier1_values_coprime_to_30() {
        for &v in &TIER1_VALUES {
            assert!(is_coprime(v), "value {v} not coprime to 30");
        }
    }

    #[test]
    fn sample_infoton_mappings() {
        assert_eq!(tier1_value(' '), Some(1));
        assert_eq!(tier1_value('e'), Some(7));
        assert_eq!(tier1_value('T'), Some(119));
        assert_eq!(tier1_value('/'), None);
    }

    #[test]
    fn canonical_sentence_only_slash_escapes() {
        let text = crate::canonical::INFOTON_DEMO_SENTENCE;
        let escapes: Vec<char> = text.chars().filter(|&c| !is_tier1(c)).collect();
        assert_eq!(escapes, vec!['/']);
    }

    #[test]
    fn tier1_residue_matches_viz_for_cap_t() {
        assert_eq!(residue_mod30(tier1_value('T').unwrap()), 29);
    }
}
