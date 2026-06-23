//! UART-style monitor: LOAD / SAVE / VALIDATE / STATS (P30-ISA v0.1 §5).

use p30_core::ops::CalculatorSnapshot;
use p30_core::storage::{
    decode_char, decode_packed, encode_char, encode_packed, verify_char_payload,
};
use p30_core::position_value;
use std::io::{self, Write};
use std::path::Path;

use crate::memory::P30Memory;

const MAGIC_CHAR: &[u8; 4] = b"P30C";

pub enum LoadedFormat {
    Text,
    Char,
    Packed,
}

pub struct Monitor {
    pub text: Option<String>,
    pub format: Option<LoadedFormat>,
    pub mem: P30Memory,
    pub mem_base: usize,
}

impl Monitor {
    pub fn new() -> Self {
        Self {
            text: None,
            format: None,
            mem: P30Memory::with_default_size(),
            mem_base: 0,
        }
    }

    pub fn handle_line(&mut self, line: &str) -> Vec<String> {
        let line = line.split('#').next().unwrap_or("").trim();
        if line.is_empty() {
            return vec![];
        }
        let parts: Vec<&str> = line.split_whitespace().collect();
        match parts[0].to_ascii_uppercase().as_str() {
            "LOAD" => self.cmd_load(&parts[1..]),
            "SAVE" => self.cmd_save(&parts[1..]),
            "VALIDATE" => self.cmd_validate(),
            "STATS" => self.cmd_stats(),
            "MEM" => self.cmd_mem(&parts[1..]),
            "HELP" | "?" => vec![help_text()],
            "QUIT" | "EXIT" => vec!["OK QUIT".into()],
            other => vec![format!("ERR unknown command: {other}")],
        }
    }

    fn cmd_load(&mut self, args: &[&str]) -> Vec<String> {
        if args.is_empty() {
            return vec!["ERR LOAD requires path".into()];
        }
        let path = Path::new(args[0]);
        let data = match std::fs::read(path) {
            Ok(d) => d,
            Err(e) => return vec![format!("ERR LOAD read: {e}")],
        };

        if data.starts_with(MAGIC_CHAR) && data.len() >= 8 {
            if let Ok(text) = decode_packed(&data) {
                let n = text.chars().count();
                self.text = Some(text);
                self.format = Some(LoadedFormat::Packed);
                let blob = encode_packed(self.text.as_ref().unwrap());
                if self.materialize_residue_lanes().is_err() {
                    return vec!["ERR LOAD mem write".into()];
                }
                return vec![format!(
                    "OK LOAD chars={n} bytes={} format=PACKED",
                    blob.len()
                )];
            }
        }

        if data.starts_with(MAGIC_CHAR) {
            match decode_char(&data) {
                Ok(text) => {
                    let n = text.chars().count();
                    self.text = Some(text);
                    self.format = Some(LoadedFormat::Char);
                    let blob = encode_char(self.text.as_ref().unwrap());
                    if self.materialize_residue_lanes().is_err() {
                        return vec!["ERR LOAD mem write".into()];
                    }
                    return vec![format!(
                        "OK LOAD chars={n} bytes={} format=CHAR",
                        blob.len()
                    )];
                }
                Err(e) => return vec![format!("ERR LOAD decode: {e}")],
            }
        }

        // UTF-8 text file
        match String::from_utf8(data) {
            Ok(mut text) => {
                while text.ends_with('\n') || text.ends_with('\r') {
                    text.pop();
                }
                let n = text.chars().count();
                let blob = encode_char(&text);
                self.text = Some(text);
                self.format = Some(LoadedFormat::Text);
                if self.materialize_residue_lanes().is_err() {
                    return vec!["ERR LOAD mem write".into()];
                }
                vec![format!(
                    "OK LOAD chars={n} bytes={} format=TEXT",
                    blob.len()
                )]
            }
            Err(e) => vec![format!("ERR LOAD utf8: {e}")],
        }
    }

    fn cmd_save(&mut self, args: &[&str]) -> Vec<String> {
        let Some(text) = self.text.as_ref() else {
            return vec!["ERR SAVE nothing loaded".into()];
        };
        if args.is_empty() {
            return vec!["ERR SAVE requires path".into()];
        }
        let path = args[0];
        let fmt = args.get(1).copied().unwrap_or("packed").to_ascii_lowercase();
        let blob = match fmt.as_str() {
            "char" => encode_char(text),
            "packed" => encode_packed(text),
            other => return vec![format!("ERR SAVE unknown format: {other}")],
        };
        match std::fs::write(path, &blob) {
            Ok(()) => vec![format!("OK SAVE bytes={}", blob.len())],
            Err(e) => vec![format!("ERR SAVE write: {e}")],
        }
    }

    fn cmd_validate(&self) -> Vec<String> {
        let Some(text) = self.text.as_ref() else {
            return vec!["ERR VALIDATE nothing loaded".into()];
        };
        if !verify_char_payload(text) {
            return vec!["ERR VALIDATE coprimality check failed".into()];
        }
        if matches!(self.format, Some(LoadedFormat::Packed)) {
            let blob = encode_packed(text);
            if decode_packed(&blob).is_err() {
                return vec!["ERR VALIDATE packed checksum failed".into()];
            }
        }
        vec![format!("OK VALIDATE chars={}", text.chars().count())]
    }

    fn cmd_stats(&self) -> Vec<String> {
        let Some(text) = self.text.as_ref() else {
            return vec!["ERR STATS nothing loaded".into()];
        };
        let snap = CalculatorSnapshot::from_text(text);
        vec![
            format!("chars: {}", snap.char_count),
            format!("utf8_bytes: {}", snap.utf8_bytes),
            format!("library_ops: {}", snap.library.total()),
            format!("bios_ops: {}", snap.bios.total()),
            format!("hamming_ops: {}", snap.hamming_ops),
            format!("char_storage: {}", snap.char_storage_bytes),
            format!("packed_storage: {}", snap.packed_storage_bytes),
            format!("huffman_total: {}", snap.huffman_total_bytes),
            format!("huffman_payload: {}", snap.huffman_payload_bytes),
            format!("direct_storage: {}", snap.direct_storage_bytes),
            format!(
                "ratio_hamming_library: {:.1}x",
                snap.library_vs_hamming_ratio()
            ),
        ]
    }

    fn cmd_mem(&self, args: &[&str]) -> Vec<String> {
        let addr = if let Some(s) = args.first() {
            parse_hex_usize(s).unwrap_or(self.mem_base)
        } else {
            self.mem_base
        };
        let count = args
            .get(1)
            .and_then(|s| parse_hex_usize(s))
            .unwrap_or(32)
            .min(128);
        let Ok(cells) = self.mem.read_units(addr, count) else {
            return vec!["ERR MEM out of range".into()];
        };
        let mut lines = vec![format!("MEM @{addr:04x} units={count}")];
        for (row, line) in cells.chunks(8).enumerate() {
            let cols: String = line
                .iter()
                .map(|u| format!("{u:>8}"))
                .collect::<Vec<_>>()
                .join(" ");
            lines.push(format!("  {:04x}: {cols}", addr + row * 8));
        }
        // Physical transport view: how the first quad serializes to a 15-byte lane.
        if count >= 4 {
            if let Ok(bytes) = self.mem.to_packed_bytes(addr, 4) {
                let hex: String = bytes
                    .iter()
                    .map(|b| format!("{b:02x}"))
                    .collect::<Vec<_>>()
                    .join(" ");
                lines.push(format!("  lane[0..4] -> 15B: {hex}"));
            }
        }
        lines
    }

    /// Encode loaded text residues into 15-byte lanes in memory (BIOS Emit path).
    /// Materialize loaded text into P30 unit cells at `mem_base`: one 30-bit
    /// unit (full coprime position) per character. Returns the unit count.
    /// Units are the native storage cell, so no byte packing or lane alignment
    /// is involved here.
    pub fn materialize_residue_lanes(&mut self) -> Result<usize, &'static str> {
        let units: Vec<u32> = {
            let text = self.text.as_ref().ok_or("nothing loaded")?;
            text.chars()
                .enumerate()
                .map(|(i, ch)| position_value(ch, i))
                .collect()
        };
        self.mem.write_units(self.mem_base, &units)?;
        Ok(units.len())
    }

    /// PVALL-style: count invalid units among the materialized cells.
    pub fn validate_materialized_lanes(&self, unit_count: usize) -> Result<usize, &'static str> {
        self.mem.validate_lanes(self.mem_base, unit_count)
    }
}

pub fn help_text() -> String {
    "Commands: LOAD <path> | SAVE <path> [char|packed] | VALIDATE | STATS | MEM [addr] [len] | HELP | QUIT".into()
}

fn parse_hex_usize(s: &str) -> Option<usize> {
    let s = s.strip_prefix("0x").unwrap_or(s);
    usize::from_str_radix(s, 16).ok()
}

/// Run interactive monitor on stdin/stdout.
pub fn run_repl() -> io::Result<()> {
    let mut mon = Monitor::new();
    let stdin = io::stdin();
    let mut stdout = io::stdout();
    writeln!(stdout, "p30emu monitor — P30-ISA v0.1 (type HELP)")?;
    loop {
        write!(stdout, "> ")?;
        stdout.flush()?;
        let mut line = String::new();
        if stdin.read_line(&mut line)? == 0 {
            break;
        }
        for resp in mon.handle_line(&line) {
            if resp == "OK QUIT" {
                writeln!(stdout, "{resp}")?;
                return Ok(());
            }
            writeln!(stdout, "{resp}")?;
        }
    }
    Ok(())
}

/// Run a script file (one command per line).
pub fn run_script(path: &Path) -> io::Result<bool> {
    let content = std::fs::read_to_string(path)?;
    let mut mon = Monitor::new();
    let mut ok = true;
    for line in content.lines() {
        for resp in mon.handle_line(line) {
            println!("{resp}");
            if resp.starts_with("ERR") {
                ok = false;
            }
            if resp == "OK QUIT" {
                return Ok(ok);
            }
        }
    }
    Ok(ok)
}

#[cfg(test)]
mod tests {
    use super::*;
    use p30_core::canonical::INFOTON_DEMO_SENTENCE;

    #[test]
    fn load_validate_stats_canonical() {
        let mut mon = Monitor::new();
        let corpus_path = Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../spec/canonical_corpus.txt");
        let r = mon.handle_line(&format!("LOAD {}", corpus_path.display()));
        assert!(r[0].starts_with("OK LOAD"));
        let v = mon.handle_line("VALIDATE");
        assert_eq!(v[0], format!("OK VALIDATE chars={}", 163));
        let s = mon.handle_line("STATS");
        assert!(s.iter().any(|l| l.contains("library_ops: 489")));
    }

    #[test]
    fn char_roundtrip_via_save_load() {
        let mut mon = Monitor::new();
        let text = INFOTON_DEMO_SENTENCE.to_string();
        mon.text = Some(text.clone());
        mon.format = Some(LoadedFormat::Text);
        let dir = std::env::temp_dir();
        let path = dir.join("p30emu_test_packed.bin");
        let save_cmd = format!("SAVE {} packed", path.display());
        assert!(mon.handle_line(&save_cmd)[0].starts_with("OK SAVE"));
        let mut mon2 = Monitor::new();
        let load_cmd = format!("LOAD {}", path.display());
        assert!(mon2.handle_line(&load_cmd)[0].starts_with("OK LOAD"));
        assert_eq!(mon2.text.as_ref().unwrap(), &text);
        let _ = std::fs::remove_file(path);
    }

    #[test]
    fn materialize_and_validate_lanes() {
        let mut mon = Monitor::new();
        mon.text = Some("Hi".into());
        mon.format = Some(LoadedFormat::Text);
        let units = mon.materialize_residue_lanes().unwrap();
        assert_eq!(units, 2);
        assert_eq!(mon.validate_materialized_lanes(2).unwrap(), 0);
    }
}
