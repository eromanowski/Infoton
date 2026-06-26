/** Virtual Mitochondria — investor brief (v2 shell, native calculator) */

window.MITO_STORY = {
  beats: ['problem', 'science', 'calculator', 'product', 'market', 'moat', 'close'],
  beatLabels: ['Gap', 'Physics', 'Demo', 'Product', 'Market', 'Moat', 'Close'],
  appendix: ['p30'],
};

window.MITO_CONCEPTS = [
  {
    id: 'problem',
    beat: 1,
    title: 'Imaging is not bioenergetics',
    titleHtml: 'Imaging is not <em>bioenergetics</em>',
    pitch: 'Standard oncology can report “tumor shrinking, you’re responding well” while mitochondrial membrane potential, ATP synthesis, and ROS dynamics tell a different story. The Virtual Mitochondria model tracks the energy system the scan does not see.',
    theme: 'cell',
    stats: ['Δψₘ blind spot', 'ROS · ATP · VO₂', 'Trajectory, not snapshot'],
    chapter: 'Act I · The gap',
    hook: 'Loss framing: treatment can look successful while cellular energetics degrade on a predictable curve.',
    takeaway: 'Investors are funding precision medicine — this is the missing bioenergetic layer between assay data and outcome.',
    riskNote: 'Educational model today — not a cleared diagnostic. Clinical claims require validation studies.',
    extraHtml:
      '<div class="mito-panel">' +
        '<div class="mito-quote">' +
          '<p class="mito-quote-std">Standard: “Your tumor is shrinking.”</p>' +
          '<p class="mito-quote-vm">Virtual Mitochondria: “Cellular energy is degrading at rate X. At current trajectory, collapse at time Y unless energetics stabilize.”</p>' +
        '</div>' +
        '<p class="mito-panel-note">From the Infoton mitochondria FAQ — reframed as the investor insight, not a clinical claim.</p>' +
      '</div>',
  },
  {
    id: 'science',
    beat: 2,
    title: 'The quantum heartbeat',
    titleHtml: 'The quantum <em>heartbeat</em>',
    pitch: 'Published Infoton mathematics substitute membrane potential into the Planck–Einstein relation: E = e·Δψₘ → ω = E/ℏ. At healthy Δψₘ ≈ 150 mV that yields ν ≈ 36.26 THz — the mechanistic “heartbeat” published on Zenodo.',
    theme: 'constellation',
    stats: ['36.26 THz @ 150 mV', 'Wien → ΔT → τ', 'Landauer mass link'],
    chapter: 'Act II · The physics',
    hook: 'Same Januarian Physics stack as Infoton P30 — information-energy applied to biology.',
    takeaway: 'One equation chain from JC-1 input to coherence time, biomarker ratios, and Infoton mass — auditable in open code.',
    riskNote: 'Preprint on Zenodo · peer review pending · THz identification is Infoton’s hypothesis, not textbook ETC kinetics.',
    extraHtml:
      '<div class="mito-eq-chain">' +
        '<div class="mito-eq-step"><span>1</span><code>E = e · Δψ<sub>m</sub></code></div>' +
        '<div class="mito-eq-step"><span>2</span><code>ω = E/ℏ, λ = c/ν</code></div>' +
        '<div class="mito-eq-step"><span>3</span><code>T = W/λ, ΔT = T − T<sub>bath</sub></code></div>' +
        '<div class="mito-eq-step"><span>4</span><code>τ = ℏ/(k<sub>B</sub>·ΔT)</code></div>' +
        '<div class="mito-eq-step"><span>5</span><code>m = k<sub>B</sub>T ln(2)/c²</code></div>' +
        '<div class="mito-eq-step"><span>6</span><code>ATP, ROS, VO₂ ← τ/τ<sub>healthy</sub></code></div>' +
      '</div>' +
      '<div class="mini-links">' +
        '<a href="https://zenodo.org/records/18373065" target="_blank" rel="noopener">Zenodo 18373065 →</a>' +
        '<a href="https://doi.org/10.5281/zenodo.18210355" target="_blank" rel="noopener">Infoton paper →</a>' +
      '</div>',
  },
  {
    id: 'calculator',
    beat: 3,
    title: 'Try the calculator',
    titleHtml: 'Try the <em>calculator</em>',
    pitch: 'Drag membrane potential — watch the quantum → thermodynamic → biomarker chain update live. This is the same Quantum Heartbeat engine on infoton.ai, rebuilt native in our v2 instrument shell.',
    theme: 'cell',
    stats: ['Live Δψₘ slider', 'State classification', '12-step derivation'],
    widget: 'mitochondria',
    chapter: 'Act III · Live demo',
    hook: 'Show, don’t tell — investors and clinical advisors can stress-test the model in one sitting.',
    takeaway: 'The demo is the product skeleton: parameterized inputs, stability readout, intervention framing.',
    riskNote: 'Default 150 mV = HEALTHY anchor in the published model. Not medical advice.',
    demoSectionTitle: 'Quantum Heartbeat Calculator',
    demoSectionSubtitle: 'Membrane potential in → coherence, ATP, ROS, and state out.',
    demoLead: 'JC-1 assay Δψₘ (mV) is the primary input path described on the Infoton site. Explore dysregulated, healthy, and cancer-associated bands.',
    footerNote: '<a href="https://infoton.ai/mitochondria" target="_blank" rel="noopener">infoton.ai/mitochondria</a> · <a href="https://zenodo.org/records/18373065">Zenodo 18373065</a>',
  },
  {
    id: 'product',
    beat: 4,
    title: 'Virtual Mitochondria platform',
    titleHtml: 'Virtual Mitochondria <em>platform</em>',
    pitch: 'Populate real biomarkers (Δψₘ, ROS, ATP, fusion/fission) → generate a stability score. Confirms “treatment is restoring bioenergetic coherence” or signals “collapse is accelerating despite conventional response.” Precision education today; clinical workflow tomorrow.',
    theme: 'cell',
    stats: ['Stability score', 'Biomarker ingest', 'Provider-facing'],
    chapter: 'Act IV · Product',
    hook: 'Software-first: calculator free for research; commercial license for embeds and enterprise.',
    takeaway: 'Revenue paths: licensed calculator, clinical decision-support partnerships, diagnostic OEM integrations over JC-1 and related assays.',
    riskNote: 'Regulatory path depends on claims and jurisdiction — plan as SaMD / CDS adjunct with counsel.',
    extraHtml:
      '<div class="mito-product-grid">' +
        '<article class="mito-product-card"><h4>Today</h4><p>Quantum Heartbeat calculator · Zenodo-backed math · provider education</p></article>' +
        '<article class="mito-product-card"><h4>Next</h4><p>Biomarker ingest API · longitudinal stability score · treatment trajectory</p></article>' +
        '<article class="mito-product-card"><h4>Roadmap</h4><p>Cellular reprogramming technology — “design and develop tech to restore mitochondria to health” (site roadmap)</p></article>' +
      '</div>',
  },
  {
    id: 'market',
    beat: 5,
    title: 'Who pays and why now',
    titleHtml: 'Who pays and <em>why now</em>',
    pitch: 'JC-1 and related mitochondrial assays are commercially available. Oncology, longevity, and metabolic clinics already measure Δψₘ — but lack a coherent model tying voltage to ATP, ROS, and collapse timing. Virtual Mitochondria is the interpretability layer.',
    theme: 'thermal',
    stats: ['JC-1 commercially available', 'Oncology + longevity', 'Precision education TAM'],
    chapter: 'Act V · Market',
    hook: 'Adjunct to imaging and labs — not replacing oncologists, arming them with energetics.',
    takeaway: 'Beachhead: licensed calculator + research partnerships → clinical pilots → payer-visible outcomes.',
    riskNote: 'Market sizing here is narrative until paid pilots exist — treat as hypothesis in diligence.',
    extraHtml:
      '<div class="mito-care-grid">' +
        '<div class="mito-care-item"><strong>Ketogenic therapy</strong><span>Metabolic shift · glycolysis ↓</span></div>' +
        '<div class="mito-care-item"><strong>HBOT + PEMF</strong><span>Oxygenation · 10–50 Hz support</span></div>' +
        '<div class="mito-care-item"><strong>Mito support stack</strong><span>NAD+, CoQ10, ALA, carnitine…</span></div>' +
        '<div class="mito-care-item"><strong>Intervention map</strong><span>ROS → antioxidants · ATP → ETC support · ψ → energetic repair</span></div>' +
      '</div>' +
      '<p class="mito-panel-note">Care pathways from infoton.ai — product ties interventions to modeled failure mode.</p>',
  },
  {
    id: 'moat',
    beat: 6,
    title: 'Published math, owned IP',
    titleHtml: 'Published math, <em>owned IP</em>',
    pitch: 'The Quantum Heartbeat of Mitochondria is on Zenodo (CERN Open Repository). The calculator embed requires a commercial license from Infoton. Januarian Physics links mitochondria to the Infoton particle framework — same founder, same equation discipline.',
    theme: 'constellation',
    stats: ['Zenodo corpus', 'Commercial license', 'Infoton framework'],
    chapter: 'Act VI · Defensibility',
    hook: 'Human-created equations, not a wrapper on generic ML.',
    takeaway: 'Moat = published derivations + licensing + clinical workflow lock-in once biomarker pipelines integrate.',
    riskNote: 'Preprint status · independent replication strengthens the fundraise.',
    extraHtml:
      '<div class="mito-ref-list">' +
        '<a href="https://zenodo.org/records/18373065" target="_blank" rel="noopener">The Quantum Heartbeat of Mitochondria</a>' +
        '<a href="https://doi.org/10.5281/zenodo.18210355" target="_blank" rel="noopener">The Infoton: A Fundamental Particle of Information-Energy</a>' +
        '<a href="https://infoton.ai/mitochondria" target="_blank" rel="noopener">Live site + calculator</a>' +
      '</div>',
  },
  {
    id: 'close',
    beat: 7,
    title: 'The ask',
    titleHtml: 'The <em>ask</em>',
    pitch: 'This round funds the Virtual Mitochondria product path: harden the calculator platform, validate against clinical biomarker cohorts, and begin the reprogramming R&D line described in Infoton’s public roadmap.',
    theme: 'cell',
    stats: ['Seed / Series A', 'Clinical pilots', 'Platform + R&D'],
    chapter: 'Close · Fund the heartbeat',
    hook: 'Lead with the live demo — DD can reproduce every constant in one session.',
    takeaway: 'Contact January@infoton.ai for diligence. Calculator bugs and partnership inquiries go to the same line.',
    riskNote: 'We separate P30 datacenter wedge (separate brief) from this life-sciences round — clear cap table narrative recommended.',
    extraHtml:
      '<div class="ask-table">' +
        '<div class="ask-row"><div class="ask-phase">Phase 1</div><div class="ask-body"><strong>Platform + license engine</strong><span>Calculator API, commercial embeds, research partnerships</span></div></div>' +
        '<div class="ask-row"><div class="ask-phase">Phase 2</div><div class="ask-body"><strong>Clinical validation</strong><span>JC-1 cohort studies · stability score calibration · advisor board</span></div></div>' +
        '<div class="ask-row"><div class="ask-phase">Phase 3</div><div class="ask-body"><strong>Reprogramming R&D</strong><span>Cellular intervention tech per public Infoton roadmap</span></div></div>' +
      '</div>' +
      '<div class="hero-cta mito-close-cta">' +
        '<a class="btn btn-primary btn-lg" href="mailto:January@infoton.ai?subject=Virtual%20Mitochondria%20Investor%20Brief">Contact Infoton →</a>' +
        '<a class="btn btn-ghost" href="#/calculator">Open calculator</a>' +
      '</div>',
    footerNote: 'Inspired by Krystalee Krey · Infoton LLC · A January Walker Project',
  },
  {
    id: 'p30',
    beat: 0,
    title: 'Sibling: Infoton P30',
    titleHtml: 'Sibling: Infoton <em>P30</em>',
    pitch: 'Datacenter encoding wedge — 25× validation op reduction, library mode ships today. Separate round narrative; same physics foundation.',
    theme: 'bits',
    stats: ['25× library proof', 'Separate TAM', 'Same founder'],
    chapter: 'Appendix · P30',
    takeaway: 'Some LPs will want both legs of the Infoton platform — compute integrity and biological energetics.',
    riskNote: 'Do not commingle milestones without board clarity.',
    extraHtml:
      '<div class="mini-links">' +
        '<a href="../sites-v2/index.html#/">P30 investor brief v2 →</a>' +
        '<a href="https://github.com/eromanowski/Infoton" target="_blank" rel="noopener">Open reproduction repo →</a>' +
      '</div>',
  },
];

window.MITO_THESIS = {
  eyebrow: 'Virtual Mitochondria · Investor brief · native demo',
  headlineHtml: 'See cellular <em>collapse</em> before the scan says you\'re fine',
  subhead: 'Infoton\'s published Quantum Heartbeat model turns JC-1 membrane potential into coherence, ATP, ROS, and a stability score — precision bioenergetics for oncology and metabolic medicine.',
  hookLine: 'Your LPs already fund precision oncology. This is the energetics layer imaging does not show.',
  metrics: [
    { val: '36.26 THz', lab: 'Quantum heartbeat', sub: '@ 150 mV Δψₘ' },
    { val: 'Δψₘ', lab: 'Primary input', sub: 'JC-1 assay path' },
    { val: 'Zenodo', lab: 'Published math', sub: '18373065 · open' },
    { val: 'Live', lab: 'Calculator demo', sub: 'Native · no iframe' },
  ],
  pillars: [
    { num: '01', title: 'Precision, not platitudes', body: 'Trajectory model — degradation rate and collapse timing, not a single lab snapshot.' },
    { num: '02', title: 'Demo you can audit', body: 'Every constant traceable to the embed and Zenodo derivations — same v2 instrument UX as P30.' },
    { num: '03', title: 'Platform path', body: 'Free for research · commercial license · clinical partnerships · reprogramming R&D upside.' },
  ],
  ask: {
    headline: 'What this round funds',
    phases: [
      { phase: 'Phase 1', funds: 'Calculator platform · API · commercial licensing', milestone: 'Paid embeds + research partners' },
      { phase: 'Phase 2', funds: 'Clinical validation · biomarker ingest · stability score', milestone: 'Pilot cohort readouts' },
      { phase: 'Phase 3', funds: 'Mitochondrial reprogramming R&D', milestone: 'Intervention technology line' },
    ],
    ctaPrimary: { label: 'Begin the briefing', route: 'problem' },
    ctaSecondary: { label: 'Jump to live demo', route: 'calculator' },
    ctaClose: { label: 'The ask', route: 'close' },
  },
  risks: [
    'Preprint physics — independent clinical validation required for diagnostic claims',
    'Regulatory path unset until product claims and jurisdiction are fixed',
    'Intervention cards on the site are adjunct education, not proven outcomes in the model',
  ],
  trust: [
    'Quantum Heartbeat on Zenodo (CERN Open Repository)',
    'Open calculator reproduction in this repo',
    'Same Januarian Physics / Infoton framework as published P30 work',
  ],
};

window.MITO_NAV = [
  { route: '', label: 'Overview' },
  { route: 'calculator', label: 'Demo' },
  { route: 'close', label: 'Ask' },
  { route: 'p30', label: 'P30 brief', href: '../sites-v2/index.html#/' },
];
