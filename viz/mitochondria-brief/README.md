# Virtual Mitochondria — Investor Brief

Standalone v2-style fundraise deck for Infoton's Virtual Mitochondria / Quantum Heartbeat product. Same shell as [sites-v2](../sites-v2/) (hero, story rail, pillars, ask, trust, native instrument demo).

## Open locally

```powershell
cd viz
python -m http.server 8081
```

Then visit: [http://localhost:8081/mitochondria-brief/index.html](http://localhost:8081/mitochondria-brief/index.html)

## Structure

| Route | Label | Content |
|-------|-------|---------|
| `/` | Overview | Hero + "is / is not yet" scope box + embedded calculator + validation path |
| `#/problem` | Problem | Imaging vs bioenergetics gap |
| `#/model` | Model | Equation chain + Zenodo links (was `#/science`) |
| `#/calculator` | Demo | Full Quantum Heartbeat widget + guided "Try this" |
| `#/workflow` | Workflow | Signal → longitudinal stability score + roadmap (was `#/product`) |
| `#/validation` | Validation | Established today / not yet proven / this round unlocks (was `#/moat`) |
| `#/business` | Business | Research-use beachhead + who pays (was `#/market`) |
| `#/ask` | Ask | The ask + contact (was `#/close`) |
| `#/composable` | Appendix | Composable physics primitive |
| `#/p30` | Appendix | Link to P30 datacenter brief |

Old route IDs (`science`, `product`, `market`, `moat`, `close`) auto-redirect to the new ones, so existing deep links keep working.

## Deploy

Included automatically when `viz/` is published to GitHub Pages (`viz/*` → site root).

Live path: `/mitochondria-brief/index.html`

## Relation to P30 brief

- **P30 sites-v2** `#/mitochondria` — appendix slide with calculator for datacenter investors
- **mitochondria-brief** — primary deck for life-sciences / Virtual Mitochondria fundraising
