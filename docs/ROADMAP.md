# P30 Computer Stack Roadmap

**P30 = Prime 30** — an open exploration from demo calculator parity to a full native computer stack. This document is the public summary; the detailed plan lives in [`.cursor/plans/p30_computer_stack_378ba9ab.plan.md`](../.cursor/plans/p30_computer_stack_378ba9ab.plan.md).

We start from the [Infoton P30 demo](https://infoton.ai/infoton-p30): its operation model, storage modes, and Hamming baseline. This repository **implements and extends** that model in the open—spec, code, visualization, and a path toward silicon.

---

## Where we are

| Phase | Status |
|-------|--------|
| **0** — Source study, ADR-001, demo parity | Done |
| **1** — Core spec + reference library | In progress (stub spec, `p30_core`, viz; CI and bit-layout freeze next) |
| **2–10** — CPU through migration | Ahead of us (gated on Phase 1) |

Demo targets on the [163-char canonical sentence](../spec/canonical_corpus.txt): Library **489** ops, BIOS **163** ops, Hamming SECDED **12,264** ops (21 × 584).

---

## Engineering scope

Building a new encoding touches every layer of the stack. We borrow patterns from open-ISA work (RISC-V, LoongArch), LLVM backends, and OS ports:

- **Toolchains** for a new ISA are a large investment. Our default path: extend **RISC-V** with pack/unpack and a P30 coprocessor, alongside the **encoding-layer transcoder** that runs today.
- **OS bring-up** starts with **xv6-p30** and **virtio**; a full Linux port is a parallel, longer track.
- **Energy and cooling** scale with the whole system—Phase 9 measures op counts, silicon energy, and rack-level behavior together.
- The roadmap is **incremental**: each phase ships a working artifact (spec, emulator, Hello World, shell, network, eval board) before the next.

---

## Phases at a glance

| Phase | Goal | Deliverable |
|-------|------|-------------|
| **0** | Align to the demo; choose unit model | Demo parity + [ADR-001](adr/001-coprime-position.md) |
| **1** | Core specification | [P30-SPEC.md](P30-SPEC.md) + reference test suite |
| **2** | Processor | FPGA/emulator core: load, save, validate P30 data |
| **3** | Toolchain | Cross-compiled **Hello, world** on emulator |
| **4** | Operating system | Bootable kernel → shell (xv6 first) |
| **5** | Memory & storage | SQLite or KV store on native P30 |
| **6** | Networking | Two nodes over bridged Ethernet |
| **7** | Applications | REST service speaking JSON to a standard browser |
| **8** | Silicon | Developer evaluation boards (MPW → 22 nm) |
| **9** | Benchmarks | Measured energy, integrity, and system-level behavior |
| **10** | Migration | Dual-stack coexistence + standards consortium |

---

## Phase details

### Phase 1 — Core specification

Foundation for compilers, storage, and silicon.

1. **Code unit** — Bit layout, 30/60/120-bit words, valid/invalid patterns, intrinsic validity (coprimality), corruption detection (Verify, PACKED checksum, Hamming/Hsiao baselines).
2. **Memory layout** — Endianness, alignment, mapping onto 8-bit buses (draft: 4×30 = 120 bits → 15 bytes per group).
3. **Interop** — Lossless UTF-8/UTF-16 transcoding for mixed systems during migration.

**Exit:** ≥100 golden vectors pass; demo op counts and storage sizes hold.

### Phase 2 — Processor architecture *(in progress)*

Prototype on **FPGA** before silicon. Adapt a **RISC-V soft core** with hardware pack/unpack for 30-bit units.

**Reference board:** **[Digilent Arty A7-35T](https://digilent.com/shop/arty-a7-35t-fpga-development-board/)** (XC7A35T) — LiteX-supported, ~\$129 each. Order **two identical units** for the Phase 9 thermal A/B bench. Optional upgrade: Arty A7-100T if 35T closes timing tight.

- Register width: **120 bits** (4 units); addresses: **30 bits**
- [`docs/isa/P30-ISA-v0.1.md`](isa/P30-ISA-v0.1.md) — coprocessor + monitor commands
- [`emulator/p30emu`](../emulator/p30emu) — functional monitor REPL
- [`fpga/`](../fpga/) — `p30_pack.v`, LiteX scaffold, monitor ROM
- Deliverable: monitor on **Arty A7** + soak firmware for thermal experiment

### Phase 3 — Toolchain

Assembler, linker, ABI, and minimal libc first; LLVM backend as a parallel track.

Deliverable: `p30-elf-gcc hello.c && p30-emu hello.elf`

### Phase 4 — Operating system

- **First:** xv6-riscv → xv6-p30
- **Later:** Linux `arch/p30/`
- **v1 I/O:** virtio console, block, net

Deliverable: shell with `p30inspect` in initramfs.

### Phase 5 — Memory and storage

Byte DIMMs + controller pack/unpack; **P30FS** blocks; SQLite on 4096-byte pages.

Deliverable: `SELECT 1` on emulator.

### Phase 6 — Interconnect and networking

**P30TP** framing, 120-bit DMA descriptors, FPGA bridges for migration.

Deliverable: two nodes exchange 1 MiB with matching SHA-256.

### Phase 7 — Application ecosystem

C stdlib, crypto, JSON shims; MicroPython before heavier runtimes.

Deliverable: **p30-httpd** — REST to a browser, native P30 storage inside.

### Phase 8 — Silicon tape-out

Sky130 / GF180 MPW → 22 nm; eval board with DDR4 (byte mode), UART, PCIe.

Deliverable: lab board running the same monitor as FPGA.

### Phase 9 — Benchmarking and impact

Characterize the stack with measurements, not assumptions.

| Measure | Explores |
|---------|----------|
| CCP-0 op counts | Alignment with demo definitions |
| **Dual-FPGA thermal (early)** | 2× **Arty A7-35T**: Mode **RATE** @ 1 Hz → J/validation, ⟨P⟩; see [claim chain](bench/thermal-claim-chain.md) |
| pJ/op (ALU, cache, DRAM) | 30-bit vs 32/64-bit at same node |
| BER sweep | Coprimality, Hamming, and Hsiao on identical blocks |
| System PUE | Full workloads (nginx, inference, storage) |
| Rack scaling | How op-ratio models map to facility power |

**Dual-board experiment:** Use **Mode RATE** (`PASS` at 1 Hz) for publishable energy/power claims. Mode MAX for pass-rate only. Full chain: [`docs/bench/thermal-claim-chain.md`](bench/thermal-claim-chain.md).

Findings feed back into spec, silicon, and deployment path.

### Phase 10 — Migration and coexistence

QEMU emulation; dual-stack VFS and HTTP `Accept` negotiation; **P30 Consortium** for spec versions and compliance tests.

---

## Effort concentration

| Phase | Order-of-magnitude | Build on |
|-------|-------------------|----------|
| 1 Spec | 1–3 person-months | Demo + wheel math |
| 2 CPU | 6–18 person-months | LiteX / VexRiscv |
| 3 Toolchain (minimal) | 3–6 person-months | RISC-V asm patterns |
| 3 Toolchain (full LLVM) | 2–5 person-years | LLVM fork |
| 4 OS (xv6) | 3–9 person-months | xv6-riscv |
| 4 OS (Linux) | 1–3 person-years | upstream Linux |
| 5–6 Storage + net | 6–20 person-months | virtio, byte DIMMs |
| 7 Apps | Ongoing | C first |
| 8 Silicon | 12–24 person-months + NRE | Sky130 MPW |
| 9–10 Bench + migration | Continuous | From Phase 1 |

A focused team can reach eval silicon + OS + REST in roughly **5–15 person-years**. Industry-wide adoption is a longer horizon—and worth exploring in phases.

---

## Next milestones (Phase 1 completion)

Before Phase 2 (CPU/FPGA):

- [x] Tier-1 alphabet parity with Infoton viz codec in `p30_core`
- [x] `p30inspect` CLI (`crates/p30_inspect`) + conformance CI (`.github/workflows/conformance.yml`)
- [x] Expand conformance vectors to ≥100 ([`spec/conformance_vectors.json`](../spec/conformance_vectors.json))
- [x] Freeze bit layout in [P30-SPEC v0.2](P30-SPEC.md); [ADR-002](adr/002-isa-strategy.md) (RISC-V + coprocessor)

**Phase 1 complete — Phase 2 in progress.** Soak stack emulated on host; hardware Arty run pending.

---

## Phase 2 next steps

- [x] Draft [P30-ISA v0.1](isa/P30-ISA-v0.1.md)
- [x] `emulator/p30emu` monitor (`LOAD` / `SAVE` / `VALIDATE` / `STATS`)
- [x] `fpga/p30_pack.v` golden-tested against emulator unit pack/unpack
- [x] LiteX SoC scaffold + **Arty A7-35T** platform (`fpga/litex/p30_soc.py --platform arty`)
- [x] P30 + Hamming soak firmware (`p30_soak.c`, `hamming_soak.c`, `corpus_data.c`)
- [x] Dual-board harness: [`tools/bench_dual_fpga.py`](../tools/bench_dual_fpga.py) (hardware)
- [x] **Host emulation:** [`tools/soak_emulate.py`](../tools/soak_emulate.py) — `--mode max` and **`--mode rate`**
- [x] **Publishable claim chain:** [`docs/bench/thermal-claim-chain.md`](bench/thermal-claim-chain.md) + [`tools/thermal_report.py`](../tools/thermal_report.py)
- [x] Firmware **`PASS`** command (throughput-matched validations)
- [x] Bench doc: [`docs/bench/dual-fpga-thermal.md`](bench/dual-fpga-thermal.md)
- [ ] **Arty A7-35T** bitstream programmed on two boards + INA260 hardware soak (≥1 h)

### Emulation (no FPGA required)

```bash
python tools/soak_emulate.py
python tools/verify_soak_bench.py
```

Validates op counts (489 / 326 BIOS soak / 12 264), ~25× pass-rate ratio, CSV under `benches/thermal/`. CI runs this in `.github/workflows/conformance.yml`.

---

## Phase 9 early deliverable (thermal)

| Stage | Status | Artifact |
|-------|--------|----------|
| Claim chain doc | Done | [`docs/bench/thermal-claim-chain.md`](bench/thermal-claim-chain.md) |
| Mode RATE emulation | Done | `soak_emulate.py --mode rate` |
| Mode RATE hardware | Pending | `bench_dual_fpga.py --mode rate` + INA260 |
| Temperature (step 6) | Pending | XADC / thermocouple on Arty |
| Published results | Pending | `benches/thermal/report.md` |

## Related documents

- [P30-SPEC.md](P30-SPEC.md) — normative spec (v0.2)
- [infoton-source-audit.md](infoton-source-audit.md) — demo decode and public sources
- [adr/001-coprime-position.md](adr/001-coprime-position.md) — native code unit decision
- [adr/002-isa-strategy.md](adr/002-isa-strategy.md) — RISC-V + P30 coprocessor
- [isa/P30-ISA-v0.1.md](isa/P30-ISA-v0.1.md) — Phase 2 coprocessor + monitor
- [bench/dual-fpga-thermal.md](bench/dual-fpga-thermal.md) — BOM, **procurement & wiring**, Mode MAX/RATE protocol
- [bench/thermal-claim-chain.md](bench/thermal-claim-chain.md) — **publishable thermal claim chain**
- [validity-model-analysis.md](validity-model-analysis.md) — integrity model options
