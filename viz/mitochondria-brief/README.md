# Virtual Mitochondria — Investor Brief

Standalone v2-style fundraise deck for Infoton's Virtual Mitochondria / Quantum Heartbeat product. Same shell as [sites-v2](../sites-v2/) (hero, story rail, pillars, ask, trust, native instrument demo).

## Open locally

```powershell
cd viz
python -m http.server 8081
```

Then visit: [http://localhost:8081/mitochondria-brief/index.html](http://localhost:8081/mitochondria-brief/index.html)

## Structure

| Route | Content |
|-------|---------|
| `/` | Overview + embedded calculator |
| `#/problem` | Imaging vs bioenergetics gap |
| `#/science` | Equation chain + Zenodo links |
| `#/calculator` | Full Quantum Heartbeat widget |
| `#/product` | Platform + roadmap |
| `#/market` | TAM + care pathways |
| `#/moat` | IP + publications |
| `#/close` | The ask + contact |
| `#/p30` | Link to P30 datacenter brief |

## Deploy

Included automatically when `viz/` is published to GitHub Pages (`viz/*` → site root).

Live path: `/mitochondria-brief/index.html`

## Relation to P30 brief

- **P30 sites-v2** `#/mitochondria` — appendix slide with calculator for datacenter investors
- **mitochondria-brief** — primary deck for life-sciences / Virtual Mitochondria fundraising
