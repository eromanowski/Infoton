//! Provisional canonical corpus from Infoton demo metrics (163 chars = 163 UTF-8 bytes).
//!
//! Derived from indexed Infoton messaging; trim one trailing period from 164-char draft.
/// Infoton demo default sentence (163 characters) — from embedded calculator at infoton.ai/infoton-p30.
pub const INFOTON_DEMO_SENTENCE: &str = "The Great Salt Lake can be fully restored to full health within as little as 3 years by returning 1,150,000 AF/yr. Resulting Utah's lake effect and water security.";

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn canonical_length() {
        assert_eq!(INFOTON_DEMO_SENTENCE.chars().count(), 163);
        assert_eq!(INFOTON_DEMO_SENTENCE.len(), 163);
    }
}
