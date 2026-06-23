# P30 visualization (Infoton-matched)

Interactive demos extracted from [infoton.ai/infoton-p30](https://infoton.ai/infoton-p30) (June 2026) for local open reproduction.

**GitHub Pages:** [eromanowski.github.io/Infoton](https://eromanowski.github.io/Infoton/) — deploys from `viz/` on push to `main` (see [`.github/workflows/pages.yml`](../.github/workflows/pages.yml)).

| File | Infoton widget | Description |
|------|----------------|-------------|
| [`landing.html`](landing.html) | — | Pages home — links to comparison + hub |
| [`compare.html`](compare.html) | — | **P30 vs Hamming** side-by-side race (489 vs 12,264 ops) |
| [`index.html`](index.html) | Main encoder | Prime 30 clock, Play/Step, Library vs BIOS panel |
| [`hamming.html`](hamming.html) | Byte cost | 584-op Hamming SECDED animation per 64-bit word |
| [`impact.html`](impact.html) | Datacenter | Rack power / no-water extrapolation panel |
| [`hub.html`](hub.html) | — | Navigation shell for all views |

## Run locally

```bash
python -m http.server 8080 --directory viz
```

Open [http://localhost:8080/hub.html](http://localhost:8080/hub.html)

Or open `index.html` directly in a browser (file:// works for the encoder).

## Canonical demo sentence (163 chars)

```
The Great Salt Lake can be fully restored to full health within as little as 3 years by returning 1,150,000 AF/yr. Resulting Utah's lake effect and water security.
```

## Regenerate from Infoton page dump

```bash
curl -sL https://infoton.ai/infoton-p30 -o _infoton_page.html
python tools/extract_infoton_iframes.py
python tools/prepare_viz.py
```

Reference originals remain in [`infoton_reference/`](infoton_reference/) for diffing.

## Notes

- CSS typo `--bg:##f6f6f6` fixed to `#f6f6f6` in prepared copies.
- Open reproduction banner added at top of prepared pages.
- Encoder uses Infoton's **Tier-1 alphabet** (`CHAR_VALS` / `CHAR_TO_VAL`) — same tables in `crates/p30_core` and `spec/tier1_alphabet.json`.
