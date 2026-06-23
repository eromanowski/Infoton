//! Prime 30 totatives (coprime residues mod 30).
pub const TOTATIVES: [u32; 8] = [1, 7, 11, 13, 17, 19, 23, 29];

pub mod tier1;
pub mod ops;
pub mod storage;
pub mod hamming;
pub mod ber;
pub mod canonical;

pub use tier1::{
    is_tier1, locate_character, position_value, residue_mod30, storage_residue, tier1_value,
    LocateResult, TIER1_CHARS, TIER1_VALUES,
};

/// Legacy byte-indexed totative wheel (escape path + Hamming byte baseline).
#[inline]
pub fn locate_totative_byte(byte: u8, char_index: usize) -> u32 {
    let ti = (byte as usize) % 8;
    let period = char_index as u32;
    period.saturating_mul(30).saturating_add(TOTATIVES[ti])
}

/// Deprecated alias — prefer [`locate_character`] or [`position_value`].
#[inline]
#[deprecated(note = "use locate_character or locate_totative_byte")]
pub fn locate(byte: u8, char_index: usize) -> u32 {
    locate_totative_byte(byte, char_index)
}

/// Returns true when `value` is coprime to 30.
#[inline]
pub fn is_coprime(value: u32) -> bool {
    gcd_u32(value, 30) == 1
}

#[inline]
pub fn verify_position(value: u32) -> bool {
    is_coprime(value)
}

#[inline]
fn gcd_u32(mut a: u32, mut b: u32) -> u32 {
    while b != 0 {
        let t = a % b;
        a = b;
        b = t;
    }
    a
}

/// Pack a coprime position into one byte for CHAR storage (legacy totative slot).
#[inline]
pub fn pack_char_slot(byte: u8, char_index: usize) -> u8 {
    let ti = (byte as usize % 8) as u8;
    (((char_index % 32) as u8) << 3) | ti
}

/// Unpack CHAR slot; returns (totative_index, period_mod_32).
#[inline]
pub fn unpack_char_slot(slot: u8) -> (u8, u8) {
    (slot & 0x07, slot >> 3)
}

/// Reconstruct coprime position from CHAR slot and absolute char index.
#[inline]
pub fn position_from_char_slot(slot: u8, char_index: usize) -> u32 {
    let (ti, _period_mod) = unpack_char_slot(slot);
    let period = char_index as u32;
    period.saturating_mul(30).saturating_add(TOTATIVES[ti as usize])
}

/// Landauer energy per irreversible op at temperature `t_kelvin` (joules).
pub fn landauer_energy_j(t_kelvin: f64) -> f64 {
    const K_B: f64 = 1.380_649e-23;
    K_B * t_kelvin * 2.0_f64.ln()
}

/// Landauer energy in zeptojoules (matches Infoton demo at 350 K ≈ 3.349 zJ).
pub fn landauer_energy_zj(t_kelvin: f64) -> f64 {
    landauer_energy_j(t_kelvin) * 1e21
}

/// Infoton demo constants.
pub mod infoton {
    pub const DRAM_JUNCTION_K: f64 = 350.0;
    pub const HAMMING_OPS_PER_64BIT_WORD: u64 = 584;
    pub const LIBRARY_OPS_PER_CHAR: u64 = 3;
    pub const BIOS_OPS_PER_CHAR: u64 = 1;

    pub const TARGET_UTF8_BYTES: usize = 163;
    pub const TARGET_CHAR_BYTES: usize = 167;
    pub const TARGET_PACKED_BYTES: usize = 171;
    pub const TARGET_HUFFMAN_TOTAL: usize = 533;
    pub const TARGET_HUFFMAN_PAYLOAD: usize = 103;
    pub const TARGET_DIRECT_BYTES: usize = 116;

    pub const TARGET_LIBRARY_OPS: u64 = 489;
    pub const TARGET_BIOS_OPS: u64 = 163;
    pub const TARGET_HAMMING_OPS: u64 = 12_264;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn totatives_are_coprime() {
        for &t in &TOTATIVES {
            assert!(is_coprime(t));
        }
    }

    #[test]
    fn totative_byte_locate_yields_coprime() {
        for (i, &b) in b"Hello".iter().enumerate() {
            assert!(verify_position(locate_totative_byte(b, i)));
        }
    }

    #[test]
    fn tier1_locate_yields_coprime() {
        for (i, ch) in "Hello".chars().enumerate() {
            assert!(verify_position(position_value(ch, i)));
        }
    }
}
