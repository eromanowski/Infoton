use p30_core::ops::CalculatorSnapshot;
use p30_core::storage::{decode_char, decode_packed, encode_char, encode_packed, verify_char_payload};
use p30_core::tier1::{is_tier1, residue_mod30, tier1_value, TIER1_CHARS, TIER1_VALUES};
use p30_core::{position_value, verify_position};
use serde::Deserialize;
use std::path::{Path, PathBuf};

#[derive(Debug, Deserialize)]
pub struct VectorFile {
    pub vector_count: usize,
    pub vectors: Vec<Vector>,
}

#[derive(Debug, Deserialize)]
pub struct Vector {
    pub id: String,
    pub kind: String,
    pub text: String,
    #[serde(default)]
    pub expect: serde_json::Value,
}

pub fn spec_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../spec")
}

pub fn load_vectors(path: &Path) -> Result<VectorFile, String> {
    let data = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&data).map_err(|e| e.to_string())
}

pub struct ConformanceReport {
    pub passed: usize,
    pub failed: usize,
    pub failures: Vec<String>,
}

impl ConformanceReport {
    pub fn ok(&self) -> bool {
        self.failed == 0
    }
}

pub fn run_vectors(file: &VectorFile) -> ConformanceReport {
    let mut report = ConformanceReport {
        passed: 0,
        failed: 0,
        failures: Vec::new(),
    };
    for v in &file.vectors {
        match run_one(v) {
            Ok(()) => report.passed += 1,
            Err(msg) => {
                report.failed += 1;
                report.failures.push(format!("{} ({}): {}", v.id, v.kind, msg));
            }
        }
    }
    let _ = file.vector_count; // informational
    report
}

fn run_one(v: &Vector) -> Result<(), String> {
    match v.kind.as_str() {
        "tier1_mapping" => check_tier1_mapping(v),
        "all_positions_coprime" => check_all_coprime(v),
        "char_roundtrip" => check_char_roundtrip(v),
        "packed_roundtrip" => check_packed_roundtrip(v),
        "infoton_demo" => check_infoton_demo(v),
        other => Err(format!("unknown kind {other}")),
    }
}

fn check_tier1_mapping(v: &Vector) -> Result<(), String> {
    let ch = v.text.chars().next().ok_or("empty text")?;
    if v.text.chars().count() != 1 {
        return Err("tier1_mapping expects one character".into());
    }
    let exp_val = v.expect["tier1_value"].as_u64().ok_or("missing tier1_value")? as u32;
    let exp_res = v.expect["residue_mod30"].as_u64().ok_or("missing residue_mod30")? as u8;
    let got = tier1_value(ch).ok_or("not tier1")?;
    if got != exp_val {
        return Err(format!("value {got} != {exp_val}"));
    }
    if residue_mod30(got) != exp_res {
        return Err(format!("residue {} != {}", residue_mod30(got), exp_res));
    }
    if !verify_position(got) {
        return Err("not coprime".into());
    }
    Ok(())
}

fn check_all_coprime(v: &Vector) -> Result<(), String> {
    let exp_count = v.expect["char_count"].as_u64().ok_or("missing char_count")? as usize;
    if v.text.chars().count() != exp_count {
        return Err(format!("char count {}", v.text.chars().count()));
    }
    for (i, ch) in v.text.chars().enumerate() {
        if !verify_position(position_value(ch, i)) {
            return Err(format!("not coprime at {i}"));
        }
    }
    Ok(())
}

fn check_char_roundtrip(v: &Vector) -> Result<(), String> {
    let enc = encode_char(&v.text);
    let dec = decode_char(&enc).map_err(|e| e.to_string())?;
    if dec != v.text {
        return Err("decode mismatch".into());
    }
    if !verify_char_payload(&v.text) {
        return Err("verify failed".into());
    }
    Ok(())
}

fn check_packed_roundtrip(v: &Vector) -> Result<(), String> {
    let enc = encode_packed(&v.text);
    let dec = decode_packed(&enc).map_err(|e| e.to_string())?;
    if dec != v.text {
        return Err("decode mismatch".into());
    }
    Ok(())
}

fn check_infoton_demo(v: &Vector) -> Result<(), String> {
    let snap = CalculatorSnapshot::from_text(&v.text);
    let mut check_usize = |field: &str, got: usize| -> Result<(), String> {
        let want = v.expect[field]
            .as_u64()
            .ok_or_else(|| format!("missing {field}"))? as usize;
        if got != want {
            return Err(format!("{field}: {got} != {want}"));
        }
        Ok(())
    };
    check_usize("char_count", snap.char_count)?;
    check_usize("utf8_bytes", snap.utf8_bytes)?;
    check_usize("library_ops", snap.library.total() as usize)?;
    check_usize("bios_ops", snap.bios.total() as usize)?;
    check_usize("hamming_ops", snap.hamming_ops as usize)?;
    check_usize("char_bytes", snap.char_storage_bytes)?;
    check_usize("packed_bytes", snap.packed_storage_bytes)?;
    check_usize("huffman_total", snap.huffman_total_bytes)?;
    check_usize("huffman_payload", snap.huffman_payload_bytes)?;
    check_usize("direct_bytes", snap.direct_storage_bytes)?;
    if let Some(arr) = v.expect.get("tier1_escapes").and_then(|x| x.as_array()) {
        let escapes: Vec<char> = v.text.chars().filter(|&c| !is_tier1(c)).collect();
        let exp: Vec<char> = arr
            .iter()
            .filter_map(|x| x.as_str().and_then(|s| s.chars().next()))
            .collect();
        if escapes != exp {
            return Err(format!("escapes {:?} != {:?}", escapes, exp));
        }
    }
    Ok(())
}

/// Verify embedded Tier-1 table matches spec/tier1_alphabet.json length.
pub fn verify_tier1_table_integrity() -> Result<(), String> {
    if TIER1_CHARS.len() != 68 || TIER1_VALUES.len() != 68 {
        return Err("tier1 table length != 68".into());
    }
    for (&ch, &val) in TIER1_CHARS.iter().zip(TIER1_VALUES.iter()) {
        if tier1_value(ch) != Some(val) {
            return Err(format!("table mismatch for {ch:?}"));
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn conformance_vectors_all_pass() {
        verify_tier1_table_integrity().unwrap();
        let path = spec_dir().join("conformance_vectors.json");
        let file = load_vectors(&path).expect("load vectors");
        assert!(file.vector_count >= 100, "need ≥100 vectors");
        let report = run_vectors(&file);
        for f in &report.failures {
            eprintln!("FAIL: {f}");
        }
        assert_eq!(report.failed, 0, "{} failures", report.failed);
        assert!(report.passed >= 100);
    }
}
