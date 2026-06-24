# Period-30 qudit basis (d = 8)

P30’s eight totative spokes `{1, 7, 11, 13, 17, 19, 23, 29}` are the **levels of an 8-dimensional qudit** in the classical projection used by this repository. Infoton and Januarian Physics cite García-Martín et al. (2020), [*The Prime state and its quantum relatives*](https://doi.org/10.22331/q-2020-12-11-371), which studies prime-number structure in **qubit and qudit bases** up to period 30.

## Classical vs quantum

| Layer | What we implement |
|-------|-------------------|
| **Quantum (paper)** | Hilbert-space prime states, qudit amplitudes |
| **P30 (this repo)** | One-hot classical levels on the 8 totatives; composite residues = **desert** |

We do **not** simulate quantum circuits or claim quantum speedup. The qudit basis makes the 8-ary wheel **explicit in code** and links integrity (“valid = on a spoke”) to a named **d = 8** alphabet.

## Mapping

```
residue mod 30 ∈ TOTATIVES  →  qudit index 0..7  →  ket |T[i]⟩
position p                  →  period ⌊p/30⌋ + active level
composite residue           →  desert (no level occupied)
```

Reference implementation: [`crates/p30_core/src/qudit.rs`](../crates/p30_core/src/qudit.rs).

Vectors: [`spec/qudit_vectors.json`](../spec/qudit_vectors.json).

## Tooling

```bash
cargo run -p p30_inspect -- qudit
cargo run -p p30_inspect -- qudit spec/canonical_corpus.txt
python tools/qudit_verify.py
```

## Relation to P30 integrity

- **Valid data** → one-hot qudit state (single totative level).
- **Corruption onto a composite** → desert; Layer 1 / Verify catches it.
- **Hamming SECDED** remains the **bit-level** baseline; qudit is the **symbol-level** alphabet for coprime positions.

See also [`validity-model-analysis.md`](validity-model-analysis.md).
