//! Period-30 **d = 8 qudit basis** — classical state model for P30 totatives.
//!
//! Each residue in [`super::TOTATIVES`] is one level of an 8-dimensional qudit.
//! Valid P30 positions occupy a single level (one-hot). Composite residues mod 30
//! are **desert** — outside the qudit alphabet — matching the wheel exclusion
//! narrative and the qudit framing in García-Martín et al. (2020), *The Prime
//! state and its quantum relatives* ([doi:10.22331/q-2020-12-11-371](https://doi.org/10.22331/q-2020-12-11-371)).
//!
//! This module is a **classical** projection (probabilities / one-hot levels), not
//! a quantum simulator. It makes the 8-ary wheel explicit in code and tooling.

use super::TOTATIVES;

/// Qudit dimension: eight totative residue classes coprime to 30.
pub const DIM: usize = 8;

/// Map a residue mod 30 to qudit level index, if it is a totative.
#[inline]
pub fn totative_index(residue: u32) -> Option<u8> {
    let r = residue % 30;
    TOTATIVES
        .iter()
        .position(|&t| t == r)
        .map(|i| i as u8)
}

/// Map qudit level index to totative residue.
#[inline]
pub fn index_to_totative(index: u8) -> Option<u32> {
    TOTATIVES.get(index as usize).copied()
}

/// Wheel period (block index) of a coprime position.
#[inline]
pub fn period_of(position: u32) -> u32 {
    position / 30
}

/// Ket label for a qudit level, e.g. `|7⟩`.
#[inline]
pub fn ket_label_for_index(index: u8) -> String {
    match index_to_totative(index) {
        Some(t) => format!("|{t}⟩"),
        None => "|?⟩".into(),
    }
}

/// Ket label for a coprime position's active qudit level.
#[inline]
pub fn ket_label_for_position(position: u32) -> Option<String> {
    totative_index(position).map(ket_label_for_index)
}

/// Reconstruct coprime position from period and qudit level.
#[inline]
pub fn position_from_qudit(period: u32, index: u8) -> Option<u32> {
    index_to_totative(index).map(|t| period.saturating_mul(30).saturating_add(t))
}

/// Classical d=8 state: amplitudes on totative levels (one-hot when valid).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Qudit8 {
    pub levels: [f64; DIM],
}

impl Qudit8 {
    /// Desert / invalid — no totative level occupied.
    pub fn desert() -> Self {
        Self {
            levels: [0.0; DIM],
        }
    }

    /// Single level occupied with unit weight.
    pub fn from_index(index: u8) -> Self {
        let mut levels = [0.0; DIM];
        if (index as usize) < DIM {
            levels[index as usize] = 1.0;
        }
        Self { levels }
    }

    /// Project a coprime integer position onto the qudit basis.
    pub fn from_position(position: u32) -> Self {
        match totative_index(position) {
            Some(i) => Self::from_index(i),
            None => Self::desert(),
        }
    }

    /// True when exactly one level has weight ~1 and the rest ~0.
    pub fn is_valid_one_hot(&self) -> bool {
        let mut ones = 0usize;
        for &a in &self.levels {
            if (a - 1.0).abs() < 1e-9 {
                ones += 1;
            } else if a.abs() > 1e-9 {
                return false;
            }
        }
        ones == 1
    }

    /// Active qudit level, if any.
    pub fn active_index(&self) -> Option<u8> {
        for (i, &a) in self.levels.iter().enumerate() {
            if (a - 1.0).abs() < 1e-9 {
                return Some(i as u8);
            }
        }
        None
    }

    /// Reconstruct position given an explicit period.
    pub fn to_position(&self, period: u32) -> Option<u32> {
        self.active_index()
            .and_then(|i| position_from_qudit(period, i))
    }
}

/// Which qudit levels host at least one prime on the Infoton period-0 dial (2..31).
pub fn prime_supported_levels() -> [bool; DIM] {
    let mut mask = [false; DIM];
    for n in 2..=31u32 {
        if is_prime_simple(n) {
            if let Some(i) = totative_index(n) {
                mask[i as usize] = true;
            }
        }
    }
    mask
}

#[inline]
fn is_prime_simple(n: u32) -> bool {
    if n < 2 {
        return false;
    }
    let mut d = 2u32;
    while d * d <= n {
        if n % d == 0 {
            return false;
        }
        d += 1;
    }
    true
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::locate_totative_byte;

    #[test]
    fn eight_totatives_map_to_eight_levels() {
        for (i, &t) in TOTATIVES.iter().enumerate() {
            assert_eq!(totative_index(t), Some(i as u8));
            assert_eq!(index_to_totative(i as u8), Some(t));
        }
    }

    #[test]
    fn composites_are_desert() {
        for r in [0, 2, 3, 4, 5, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 22, 24, 25, 26, 27, 28] {
            assert!(totative_index(r).is_none());
            assert!(!Qudit8::from_position(r).is_valid_one_hot());
        }
    }

    #[test]
    fn position_qudit_round_trip() {
        for (i, &b) in b"The Great Salt Lake".iter().enumerate() {
            let pos = locate_totative_byte(b, i);
            let q = Qudit8::from_position(pos);
            assert!(q.is_valid_one_hot());
            assert_eq!(q.to_position(period_of(pos)), Some(pos));
        }
    }

    #[test]
    fn prime_mask_covers_all_spokes_with_primes() {
        let mask = prime_supported_levels();
        assert!(mask.iter().filter(|&&b| b).count() >= 6);
    }
}
