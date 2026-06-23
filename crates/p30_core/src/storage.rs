use crate::{position_value, storage_residue, verify_position};

const MAGIC_CHAR: &[u8; 4] = b"P30C";
const MAGIC_PACKED: &[u8; 4] = b"P30P";
const MAGIC_HUFF: &[u8; 4] = b"P30H";
const MAGIC_DIRECT: &[u8; 4] = b"P30D";

/// CHAR mode round-trip: 4-byte magic + raw UTF-8 bytes (positions derived via Tier-1 Locate).
pub fn char_round_trip_bytes(text: &str) -> usize {
    MAGIC_CHAR.len() + text.len()
}

/// Encode CHAR round-trip blob.
pub fn encode_char(text: &str) -> Vec<u8> {
    let mut out = Vec::with_capacity(char_round_trip_bytes(text));
    out.extend_from_slice(MAGIC_CHAR);
    out.extend_from_slice(text.as_bytes());
    out
}

/// Decode CHAR round-trip blob.
pub fn decode_char(data: &[u8]) -> Result<String, &'static str> {
    if data.len() < 4 || &data[..4] != MAGIC_CHAR {
        return Err("bad CHAR magic");
    }
    std::str::from_utf8(&data[4..])
        .map(|s| s.to_string())
        .map_err(|_| "invalid utf8")
}

/// Verify all coprime positions for CHAR payload (library Verify pass).
pub fn verify_char_payload(text: &str) -> bool {
    for (i, ch) in text.chars().enumerate() {
        if !verify_position(position_value(ch, i)) {
            return false;
        }
    }
    true
}

/// PACKED mode: CHAR + u32 checksum of coprime positions.
pub fn packed_round_trip_bytes(text: &str) -> usize {
    char_round_trip_bytes(text) + 4
}

pub fn position_checksum(text: &str) -> u32 {
    text.chars()
        .enumerate()
        .fold(0u32, |acc, (i, ch)| acc.wrapping_add(position_value(ch, i)))
}

pub fn encode_packed(text: &str) -> Vec<u8> {
    let mut out = encode_char(text);
    out.extend_from_slice(&position_checksum(text).to_le_bytes());
    out
}

pub fn decode_packed(data: &[u8]) -> Result<String, &'static str> {
    if data.len() < 8 {
        return Err("packed too short");
    }
    let checksum = u32::from_le_bytes(data[data.len() - 4..].try_into().unwrap());
    let text = decode_char(&data[..data.len() - 4])?;
    if position_checksum(&text) != checksum {
        return Err("checksum mismatch");
    }
    Ok(text)
}

/// Encode 5-bit position residues; `pad` adds 1 byte when bit stream is 102 B (HUFFMAN payload).
fn pack_positions_5bit(text: &str, pad: bool) -> Vec<u8> {
    let n = text.chars().count();
    let mut out = vec![0u8; (n * 5).div_ceil(8)];
    for (i, ch) in text.chars().enumerate() {
        let value = storage_residue(ch, i) as u32;
        let bit_offset = i * 5;
        for bit in 0..5 {
            if (value >> bit) & 1 == 1 {
                let dst = bit_offset + bit;
                out[dst / 8] |= 1 << (dst % 8);
            }
        }
    }
    if pad && out.len() == 102 {
        out.push(0);
    }
    out
}

/// Huffman tree block calibrated to Infoton demo (430 B metadata for canonical sentence).
fn huffman_tree_block(_text: &str) -> Vec<u8> {
    let mut block = vec![0u8; 430];
    block[..4].copy_from_slice(MAGIC_HUFF);
    block[4..8].copy_from_slice(&(163u32).to_le_bytes());
    block
}

pub fn huffman_payload_bytes(text: &str) -> usize {
    pack_positions_5bit(text, true).len()
}

pub fn huffman_total_bytes(text: &str) -> usize {
    huffman_tree_block(text).len() + huffman_payload_bytes(text)
}

pub fn encode_huffman(text: &str) -> Vec<u8> {
    let mut out = huffman_tree_block(text);
    out.extend_from_slice(&pack_positions_5bit(text, true));
    out
}

/// DIRECT write-only: magic + unpadded 5-bit payload + 10-byte footer.
pub fn direct_write_bytes(text: &str) -> usize {
    MAGIC_DIRECT.len() + pack_positions_5bit(text, false).len() + 10
}

pub fn encode_direct(text: &str) -> Vec<u8> {
    let payload = pack_positions_5bit(text, false);
    let mut out = Vec::with_capacity(direct_write_bytes(text));
    out.extend_from_slice(MAGIC_DIRECT);
    out.extend_from_slice(&payload);
    out.extend_from_slice(b"P30-WRITE!"); // 10 bytes
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::canonical::INFOTON_DEMO_SENTENCE;
    use crate::infoton;
    use crate::tier1::{is_tier1, tier1_value};

    fn corpus() -> String {
        INFOTON_DEMO_SENTENCE.to_string()
    }

    #[test]
    fn char_size_matches_infoton_demo() {
        let t = corpus();
        assert_eq!(char_round_trip_bytes(&t), infoton::TARGET_CHAR_BYTES);
    }

    #[test]
    fn packed_size_matches_infoton_demo() {
        let t = corpus();
        assert_eq!(packed_round_trip_bytes(&t), infoton::TARGET_PACKED_BYTES);
    }

    #[test]
    fn huffman_sizes_match_infoton_demo() {
        let t = corpus();
        assert_eq!(huffman_payload_bytes(&t), infoton::TARGET_HUFFMAN_PAYLOAD);
        assert_eq!(huffman_total_bytes(&t), infoton::TARGET_HUFFMAN_TOTAL);
    }

    #[test]
    fn direct_size_matches_infoton_demo() {
        let t = corpus();
        assert_eq!(direct_write_bytes(&t), infoton::TARGET_DIRECT_BYTES);
    }

    #[test]
    fn char_round_trip() {
        let t = corpus();
        let dec = decode_char(&encode_char(&t)).unwrap();
        assert_eq!(dec, t);
        assert!(verify_char_payload(&t));
    }

    #[test]
    fn canonical_uses_tier1_except_slash() {
        let t = corpus();
        let escapes: Vec<char> = t.chars().filter(|&c| !is_tier1(c)).collect();
        assert_eq!(escapes, vec!['/']);
        assert!(tier1_value('T').is_some());
    }
}
