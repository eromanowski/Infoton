use p30_core::ber::compare_single_bit_flips;
use p30_core::canonical::INFOTON_DEMO_SENTENCE;
use p30_core::infoton;
use p30_core::ops::{CalculatorSnapshot, Profile};
use p30_core::{landauer_energy_zj, storage};

fn main() {
    let text = std::env::args()
        .nth(1)
        .unwrap_or_else(|| INFOTON_DEMO_SENTENCE.to_string());

    let snap = CalculatorSnapshot::from_text(&text);
    print_snapshot(&text, &snap);

    if text.len() == infoton::TARGET_UTF8_BYTES {
        print_infoton_conformance(&snap);
    }
}

fn print_snapshot(text: &str, snap: &CalculatorSnapshot) {
    println!("=== P30 Calculator (open reproduction) ===");
    println!("Input: {} chars, {} UTF-8 bytes", snap.char_count, snap.utf8_bytes);
    println!();

    println!("--- Operations (CCP-0) ---");
    let lib = snap.library.total();
    let bios = snap.bios.total();
    println!(
        "Library:  locate={} emit={} verify={}  total={}",
        snap.library.locate, snap.library.emit, snap.library.verify, lib
    );
    println!("BIOS:     ingress_encode={}  total={}", snap.bios.ingress_encode, bios);
    println!("Hamming SECDED baseline: {}", snap.hamming_ops);
    println!(
        "Ratios vs Hamming: library {:.1}x, BIOS {:.1}x",
        snap.library_vs_hamming_ratio(),
        snap.bios_vs_hamming_ratio()
    );
    println!();

    println!("--- Storage ---");
    println!("UTF-8 baseline:           {} bytes", snap.utf8_bytes);
    println!("CHAR round-trip:            {} bytes", snap.char_storage_bytes);
    println!("PACKED round-trip:          {} bytes", snap.packed_storage_bytes);
    println!("HUFFMAN total:              {} bytes", snap.huffman_total_bytes);
    println!("HUFFMAN payload only:       {} bytes", snap.huffman_payload_bytes);
    println!("DIRECT write-only:          {} bytes", snap.direct_storage_bytes);
    println!();

    println!("--- Landauer floor @ 350 K ---");
    println!("Per op: {:.3} zJ", snap.landauer_zj_at_350k);
    println!(
        "Library run energy (floor): {:.6e} J",
        lib as f64 * landauer_energy_zj(infoton::DRAM_JUNCTION_K) * 1e-21
    );
    println!();

    if storage::verify_char_payload(text) {
        println!("Verify: all coprime positions OK");
    } else {
        println!("Verify: FAILED");
    }

    let ber = compare_single_bit_flips(text);
    println!();
    println!("--- Single-bit flip sweep ({} trials) ---", ber.trials);
    println!("Coprimality (Locate only): {}", ber.coprimality_detected);
    println!("PACKED checksum:           {}", ber.packed_checksum_detected);
    println!("Hamming parity (64b word): {}", ber.hamming_detected);
    println!("Silent (none):             {}", ber.silent);
}

fn print_infoton_conformance(snap: &CalculatorSnapshot) {
    println!("=== Infoton demo conformance (163-byte corpus) ===");
    let checks = [
        ("UTF-8 bytes", snap.utf8_bytes, infoton::TARGET_UTF8_BYTES),
        ("Library ops", snap.library.total() as usize, infoton::TARGET_LIBRARY_OPS as usize),
        ("BIOS ops", snap.bios.total() as usize, infoton::TARGET_BIOS_OPS as usize),
        ("Hamming ops", snap.hamming_ops as usize, infoton::TARGET_HAMMING_OPS as usize),
        ("CHAR bytes", snap.char_storage_bytes, infoton::TARGET_CHAR_BYTES),
        ("PACKED bytes", snap.packed_storage_bytes, infoton::TARGET_PACKED_BYTES),
        ("HUFFMAN total", snap.huffman_total_bytes, infoton::TARGET_HUFFMAN_TOTAL),
        ("HUFFMAN payload", snap.huffman_payload_bytes, infoton::TARGET_HUFFMAN_PAYLOAD),
        ("DIRECT bytes", snap.direct_storage_bytes, infoton::TARGET_DIRECT_BYTES),
    ];
    let mut all_ok = true;
    for (name, got, want) in checks {
        let ok = got == want;
        if !ok {
            all_ok = false;
        }
        println!("  {}: {} (want {}) {}", name, got, want, if ok { "OK" } else { "MISMATCH" });
    }
    println!(
        "Overall: {}",
        if all_ok {
            "PASS"
        } else {
            "PARTIAL — storage codec may differ from proprietary Infoton encoder"
        }
    );
}
