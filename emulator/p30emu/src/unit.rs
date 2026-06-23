//! 30-bit P30 unit helpers + the host/DRAM serialization codec.
//!
//! In the unit-native model (P30-ISA v0.1 §1) the unit is the addressable cell;
//! `pack_quad` / `unpack_quad` are *only* the 4-units <-> 15-byte transport used
//! when crossing the host byte boundary, never the in-core storage form.

/// Mask for the low 30 bits that make up a P30 unit.
pub const UNIT_MASK: u32 = 0x3FFF_FFFF;

/// Returns true when the low 30 bits form a valid P30 unit.
pub fn valid_unit(value: u32) -> bool {
    let v = value & UNIT_MASK;
    v != 0 && p30_core::verify_position(v)
}

/// Residue mod 30 for a unit (undefined if invalid).
pub fn unit_residue(value: u32) -> u8 {
    p30_core::residue_mod30(value & UNIT_MASK)
}

/// Pack four 30-bit units into 15 bytes (little-unit, LSB-first bit stream).
pub fn pack_quad(units: [u32; 4]) -> [u8; 15] {
    let mut bits = [0u8; 120];
    for (ui, &unit) in units.iter().enumerate() {
        let u = unit & UNIT_MASK;
        for b in 0..30 {
            if (u >> b) & 1 == 1 {
                bits[ui * 30 + b] = 1;
            }
        }
    }
    let mut out = [0u8; 15];
    for (byte_idx, byte) in out.iter_mut().enumerate() {
        let mut v = 0u8;
        for bit in 0..8 {
            if bits[byte_idx * 8 + bit] == 1 {
                v |= 1 << bit;
            }
        }
        *byte = v;
    }
    out
}

/// Unpack 15 bytes into four 30-bit units.
pub fn unpack_quad(bytes: &[u8; 15]) -> [u32; 4] {
    let mut bits = [0u8; 120];
    for (byte_idx, &byte) in bytes.iter().enumerate() {
        for bit in 0..8 {
            if (byte >> bit) & 1 == 1 {
                bits[byte_idx * 8 + bit] = 1;
            }
        }
    }
    let mut units = [0u32; 4];
    for ui in 0..4 {
        let mut u = 0u32;
        for b in 0..30 {
            if bits[ui * 30 + b] == 1 {
                u |= 1 << b;
            }
        }
        units[ui] = u;
    }
    units
}

/// Count invalid units in a slice of 30-bit values.
pub fn validate_units(units: &[u32]) -> usize {
    units.iter().filter(|&&u| !valid_unit(u)).count()
}

#[cfg(test)]
mod tests {
    use super::*;
    use p30_core::TOTATIVES;

    #[test]
    fn roundtrip_quad() {
        let units = [TOTATIVES[0], TOTATIVES[1], TOTATIVES[2], TOTATIVES[3]];
        let bytes = pack_quad(units);
        let back = unpack_quad(&bytes);
        assert_eq!(units, back);
    }

    #[test]
    fn totatives_are_valid_units() {
        for &t in &TOTATIVES {
            assert!(valid_unit(t));
        }
        assert!(!valid_unit(0));
        assert!(!valid_unit(2));
    }
}
