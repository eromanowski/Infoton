# Infoton

Infoton is to exalt the dignity and promote the happiness of humankind, intelligence, and all life.

## P30 — Prime 30 (open exploration)

Open implementation of the [Infoton P30](https://infoton.ai/infoton-p30) demo: **P30 = Prime 30** — coprime positions on the prime-30 wheel, Library vs BIOS profiles, and Hamming SECDED baseline comparison. We reproduce the demo metrics, publish a spec, and explore the path to a full native stack.

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for phases 0–10.

## Visualization (matches Infoton UI)

**Live demo:** [eromanowski.github.io/Infoton](https://eromanowski.github.io/Infoton/) — P30 vs Hamming side-by-side comparison (GitHub Pages).

```bash
python tools/prepare_viz.py          # refresh from viz/infoton_reference/
python -m http.server 8080 --directory viz
# → http://localhost:8080/hub.html  (or landing.html for Pages-style home)
```

- **Prime 30 clock** with Play/Step/Inject Error
- **Library vs BIOS** operation panel
- **Hamming 584-op** animation (`hamming.html`)
- **Datacenter impact** panel (`impact.html`)

Canonical sentence (163 chars): Great Salt Lake restoration text — see [`spec/canonical_corpus.txt`](spec/canonical_corpus.txt).

## Quick start (metrics CLI)

```bash
cargo run -p p30_calculator
cargo run -p p30_inspect -- stats
cargo run -p p30_inspect -- conformance
cargo run -p p30emu -- monitor
cargo test
```

Without Rust:

```bash
python tools/verify_demo.py
python tools/conformance.py
python tools/p30emu_smoke.py
python tools/verify_p30_pack.py
python tools/verify_litex_soc.py
python tools/soak_emulate.py          # --mode max: pass-rate
python tools/soak_emulate.py --mode rate --rate 1 --duration 10   # publishable chain
```

## Infoton demo targets (163-char canonical sentence)

| Metric | Target |
|--------|--------|
| Library ops | 489 (3 × 163) |
| BIOS ops | 163 (1 × 163) |
| Hamming SECDED | 12,264 (21 × 584) |
| CHAR storage | 167 B |
| PACKED storage | 171 B |

Canonical corpus: [`spec/canonical_corpus.txt`](spec/canonical_corpus.txt)

## Layout

- `docs/ROADMAP.md` — **full-stack roadmap** (phases 0–10, effort, deliverables)
- `crates/p30_core` — Tier-1 Locate, Emit/Verify, storage formats, CCP-0 op counter
- `crates/p30_inspect` — **`p30inspect`** CLI: validate, stats, transcode, conformance
- `spec/tier1_alphabet.json` — Infoton Tier-1 character → coprime value table (68 entries)
- `spec/conformance_vectors.json` — 102 golden vectors (regenerate: `python tools/generate_conformance_vectors.py`)
- `crates/p30_calculator` — CLI reproducing demo metrics
- `emulator/p30emu` — Phase 2 monitor emulator (`LOAD` / `SAVE` / `VALIDATE`)
- `fpga/p30_pack.v` — 30-bit lane pack/unpack RTL (golden-tested)
- `fpga/litex/` — LiteX SoC (VexRiscv + UART + P30 mem)
- `fpga/monitor_rom/` — bare-metal UART monitor stub
- `spec/pack_vectors.json` — pack/unpack golden vectors
- `docs/P30-SPEC.md` — normative spec (v0.2)
- `docs/qudit-basis.md` — period-30 d=8 qudit basis (classical projection)
- `docs/adr/` — ADR-001 (code unit), ADR-002 (ISA strategy)
- `spec/test-vectors.json` — golden targets

## References

- [Infoton P30](https://infoton.ai/infoton-p30)
- [Full stack roadmap](docs/ROADMAP.md)
