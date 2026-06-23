mod conformance;

use p30_core::ber::compare_single_bit_flips;
use p30_core::canonical::INFOTON_DEMO_SENTENCE;
use p30_core::ops::CalculatorSnapshot;
use p30_core::storage::{decode_char, decode_packed, encode_char, encode_packed, verify_char_payload};
use p30_core::tier1::{locate_character, residue_mod30, LocateResult};
use p30_core::position_value;
use std::io::{self, Read};
use std::path::PathBuf;
use std::process::ExitCode;

use conformance::{load_vectors, run_vectors, spec_dir, verify_tier1_table_integrity};

fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().collect();
    if args.len() < 2 {
        print_usage();
        return ExitCode::from(2);
    }
    let cmd = args[1].as_str();
    match cmd {
        "validate" => cmd_validate(&args[2..]),
        "stats" => cmd_stats(&args[2..]),
        "transcode" => cmd_transcode(&args[2..]),
        "positions" => cmd_positions(&args[2..]),
        "conformance" => cmd_conformance(&args[2..]),
        "help" | "-h" | "--help" => {
            print_usage();
            ExitCode::SUCCESS
        }
        _ => {
            eprintln!("unknown command: {cmd}");
            print_usage();
            ExitCode::from(2)
        }
    }
}

fn print_usage() {
    eprintln!(
        "p30inspect — P30 Prime 30 codec inspector

Usage:
  p30inspect validate [file]       Verify coprime positions (Tier-1 Locate)
  p30inspect stats [file]          Operation counts, storage sizes, BER sweep
  p30inspect transcode encode char [file]
  p30inspect transcode decode char [file]
  p30inspect transcode encode packed [file]
  p30inspect transcode decode packed [file]
  p30inspect positions [file]        Print Tier-1 position map for text
  p30inspect conformance [path]    Run spec/conformance_vectors.json (default)

  file: path to UTF-8 text, or omit for canonical demo sentence"
    );
}

fn read_text(args: &[String]) -> Result<String, io::Error> {
    if let Some(path) = args.first() {
        std::fs::read_to_string(path)
    } else {
        Ok(INFOTON_DEMO_SENTENCE.to_string())
    }
}

fn cmd_validate(args: &[String]) -> ExitCode {
    let text = match read_text(args) {
        Ok(t) => t,
        Err(e) => {
            eprintln!("read error: {e}");
            return ExitCode::from(1);
        }
    };
    let mut ok = true;
    for (i, ch) in text.chars().enumerate() {
        let pos = position_value(ch, i);
        if !p30_core::verify_position(pos) {
            eprintln!("FAIL char {i} {:?}: position {pos} not coprime", ch);
            ok = false;
        }
    }
    if ok {
        println!("OK: {} characters, all coprime positions", text.chars().count());
        ExitCode::SUCCESS
    } else {
        ExitCode::from(1)
    }
}

fn cmd_stats(args: &[String]) -> ExitCode {
    let text = match read_text(args) {
        Ok(t) => t,
        Err(e) => {
            eprintln!("read error: {e}");
            return ExitCode::from(1);
        }
    };
    let snap = CalculatorSnapshot::from_text(&text);
    println!("chars: {}", snap.char_count);
    println!("utf8_bytes: {}", snap.utf8_bytes);
    println!("library_ops: {}", snap.library.total());
    println!("bios_ops: {}", snap.bios.total());
    println!("hamming_ops: {}", snap.hamming_ops);
    println!("char_storage: {}", snap.char_storage_bytes);
    println!("packed_storage: {}", snap.packed_storage_bytes);
    println!("huffman_total: {}", snap.huffman_total_bytes);
    println!("huffman_payload: {}", snap.huffman_payload_bytes);
    println!("direct_storage: {}", snap.direct_storage_bytes);
    println!("landauer_zj_350k: {:.3}", snap.landauer_zj_at_350k);
    println!(
        "ratio_hamming_library: {:.1}x",
        snap.library_vs_hamming_ratio()
    );
    println!("ratio_hamming_bios: {:.1}x", snap.bios_vs_hamming_ratio());
    println!("verify: {}", verify_char_payload(&text));
    let ber = compare_single_bit_flips(&text);
    println!(
        "ber_trials: {} coprimality: {} packed: {} hamming: {}",
        ber.trials, ber.coprimality_detected, ber.packed_checksum_detected, ber.hamming_detected
    );
    ExitCode::SUCCESS
}

fn cmd_transcode(args: &[String]) -> ExitCode {
    if args.is_empty() {
        eprintln!("transcode requires: encode|decode char|packed [file]");
        return ExitCode::from(2);
    }
    let direction = args[0].as_str();
    let format = args.get(1).map(String::as_str).unwrap_or("char");
    match (direction, format) {
        ("encode", "char") => {
            let text = match read_text(&args[2..]) {
                Ok(t) => t,
                Err(e) => {
                    eprintln!("{e}");
                    return ExitCode::from(1);
                }
            };
            let blob = encode_char(&text);
            io::Write::write_all(&mut io::stdout(), &blob).ok();
            ExitCode::SUCCESS
        }
        ("decode", "char") => {
            let data = read_bytes(&args[2..]);
            match data {
                Ok(d) => match decode_char(&d) {
                    Ok(s) => {
                        print!("{s}");
                        ExitCode::SUCCESS
                    }
                    Err(e) => {
                        eprintln!("decode: {e}");
                        ExitCode::from(1)
                    }
                },
                Err(e) => {
                    eprintln!("{e}");
                    ExitCode::from(1)
                }
            }
        }
        ("encode", "packed") => {
            let text = match read_text(&args[2..]) {
                Ok(t) => t,
                Err(e) => {
                    eprintln!("{e}");
                    return ExitCode::from(1);
                }
            };
            let blob = encode_packed(&text);
            io::Write::write_all(&mut io::stdout(), &blob).ok();
            ExitCode::SUCCESS
        }
        ("decode", "packed") => {
            let data = read_bytes(&args[2..]);
            match data {
                Ok(d) => match decode_packed(&d) {
                    Ok(s) => {
                        print!("{s}");
                        ExitCode::SUCCESS
                    }
                    Err(e) => {
                        eprintln!("decode: {e}");
                        ExitCode::from(1)
                    }
                },
                Err(e) => {
                    eprintln!("{e}");
                    ExitCode::from(1)
                }
            }
        }
        _ => {
            eprintln!("unsupported: {direction} {format}");
            ExitCode::from(2)
        }
    }
}

fn read_bytes(args: &[String]) -> Result<Vec<u8>, io::Error> {
    if let Some(path) = args.first() {
        std::fs::read(path)
    } else {
        let mut buf = Vec::new();
        io::stdin().read_to_end(&mut buf)?;
        Ok(buf)
    }
}

fn cmd_positions(args: &[String]) -> ExitCode {
    let text = match read_text(args) {
        Ok(t) => t,
        Err(e) => {
            eprintln!("read error: {e}");
            return ExitCode::from(1);
        }
    };
    for (i, ch) in text.chars().enumerate() {
        match locate_character(ch, i) {
            LocateResult::Tier1 { value } => {
                println!(
                    "{i:4} {:?} tier1 value={value} residue={}",
                    ch,
                    residue_mod30(value)
                );
            }
            LocateResult::Escape { primary, .. } => {
                println!(
                    "{i:4} {:?} escape primary={primary} residue={}",
                    ch,
                    residue_mod30(primary)
                );
            }
        }
    }
    ExitCode::SUCCESS
}

fn cmd_conformance(args: &[String]) -> ExitCode {
    if let Err(e) = verify_tier1_table_integrity() {
        eprintln!("tier1 table: {e}");
        return ExitCode::from(1);
    }
    let path = if let Some(p) = args.first() {
        PathBuf::from(p)
    } else {
        spec_dir().join("conformance_vectors.json")
    };
    let file = match load_vectors(&path) {
        Ok(f) => f,
        Err(e) => {
            eprintln!("load {}: {e}", path.display());
            return ExitCode::from(1);
        }
    };
    println!(
        "Running {} conformance vectors from {} …",
        file.vectors.len(),
        path.display()
    );
    let report = run_vectors(&file);
    println!("passed: {} failed: {}", report.passed, report.failed);
    for f in &report.failures {
        eprintln!("  {f}");
    }
    if report.ok() {
        ExitCode::SUCCESS
    } else {
        ExitCode::from(1)
    }
}
