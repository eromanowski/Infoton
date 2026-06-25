# P30 Investor Brief v2

Native-widget SPA — no iframes. v1 remains at `viz/sites/`.

## Migration phases

| Phase | Slides | Status |
|-------|--------|--------|
| **1** | energy, fleet, history, learn | Done |
| **2** | hamming, compare, encode | Done (native dual-pane compare) |
| **3** | Polish — lazy load, compare-v2 standalone, deploy | Done |

## Run locally

```bash
cd viz && python -m http.server 8080
# Brief:  http://localhost:8080/sites-v2/index.html
# Compare: http://localhost:8080/compare-v2.html
```

Deployed at `/sites-v2/` on GitHub Pages (v1 remains site root).

## Architecture

```
widgets/
  lib/hamming-core.js   ← extracted from viz/hamming.html
  lib/encoder-core.js   ← extracted from viz/encoder.html
  hamming.js            mount wrapper
  encoder.js            mount wrapper
  compare.js            dual-pane orchestrator (no postMessage)
  impact.js, fleet.js, history.js, learn.js
```

Re-extract cores after editing standalone demos:

```bash
python viz/tools/extract_embed_demo.py
```

## Widget API

Each widget exports `mount(root, opts)` → `{ destroy(), ...commands }`.

Compare calls encoder + hamming directly via API (lockstep tick), not iframes.
