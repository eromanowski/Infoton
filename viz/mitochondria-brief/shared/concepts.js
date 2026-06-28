/** Virtual Mitochondria — investor brief (v2 shell, native calculator)
 *  Diligence-forward edit: capability claims, research-use posture, validation path.
 */

window.MITO_STORY = {
  beats: ['problem', 'model', 'calculator', 'workflow', 'validation', 'business', 'ask'],
  beatLabels: ['Problem', 'Model', 'Demo', 'Workflow', 'Validation', 'Business', 'Ask'],
  appendix: ['composable', 'p30'],
};

window.MITO_CONCEPTS = [
  {
    id: 'problem',
    beat: 1,
    title: 'Imaging is not bioenergetics',
    titleHtml: 'Imaging is not <em>bioenergetics</em>',
    pitch: 'Standard oncology response criteria track tumor size; they do not measure the cell\u2019s energy system. Mitochondrial membrane potential (\u0394\u03c8\u2098), ATP synthesis, and ROS dynamics can move independently of a scan. Virtual Mitochondria models that energetic layer from an assay-derived signal.',
    theme: 'cell',
    stats: ['\u0394\u03c8\u2098 measured signal', 'ROS \u00b7 ATP \u00b7 VO\u2082 proxies', 'Trajectory, not snapshot'],
    chapter: 'Act I \u00b7 The problem',
    hook: 'Tumor size and cellular energetics are different measurements \u2014 the two can diverge, and only one is on the scan.',
    takeaway: 'Precision medicine is well funded; the bioenergetic layer between assay data and outcome is under-modeled. That gap is the opportunity.',
    riskNote: 'Educational / research-use model today \u2014 not a cleared diagnostic. Clinical claims require validation studies.',
    extraHtml:
      '<div class="mito-panel">' +
        '<div class="mito-quote">' +
          '<p class="mito-quote-std">Standard readout: \u201cTumor volume is decreasing \u2014 responding well.\u201d</p>' +
          '<p class="mito-quote-vm">Modeled readout: \u201cAt this \u0394\u03c8\u2098, the bioenergetic stability score is declining \u2014 flag for closer monitoring and a repeat assay.\u201d</p>' +
        '</div>' +
        '<p class="mito-panel-note">Illustrative model output, not a clinical claim. The point is the missing energetic layer, not a prediction about any patient.</p>' +
      '</div>',
  },
  {
    id: 'model',
    beat: 2,
    title: 'The published model',
    titleHtml: 'The published <em>model</em>',
    pitch: 'Infoton\u2019s Quantum Heartbeat math substitutes membrane potential into the Planck\u2013Einstein relation: E = e\u00b7\u0394\u03c8\u2098 \u2192 \u03c9 = E/\u210f. At \u0394\u03c8\u2098 \u2248 150 mV this yields \u03bd \u2248 36.26 THz \u2014 the model\u2019s mechanistic anchor, published on Zenodo and reproducible constant-for-constant.',
    theme: 'cell',
    stats: ['36.26 THz @ 150 mV', 'Wien \u2192 \u0394T \u2192 \u03c4', 'Auditable derivation'],
    chapter: 'Act II \u00b7 The model',
    hook: 'Built on the Infoton information-energy framework \u2014 first-principles equations, applied to bioenergetics.',
    takeaway: 'One deterministic equation chain from \u0394\u03c8\u2098 input to coherence time, biomarker proxies, and Infoton mass \u2014 every step open and auditable.',
    riskNote: 'Preprint on Zenodo \u00b7 peer review pending \u00b7 the THz identification is Infoton\u2019s hypothesis, not established ETC kinetics.',
    extraHtml:
      '<div class="mito-eq-chain">' +
        '<div class="mito-eq-step"><span>1</span><code>E = e \u00b7 \u0394\u03c8<sub>m</sub></code></div>' +
        '<div class="mito-eq-step"><span>2</span><code>\u03c9 = E/\u210f, \u03bb = c/\u03bd</code></div>' +
        '<div class="mito-eq-step"><span>3</span><code>T = W/\u03bb, \u0394T = T \u2212 T<sub>bath</sub></code></div>' +
        '<div class="mito-eq-step"><span>4</span><code>\u03c4 = \u210f/(k<sub>B</sub>\u00b7\u0394T)</code></div>' +
        '<div class="mito-eq-step"><span>5</span><code>m = k<sub>B</sub>T ln(2)/c\u00b2</code></div>' +
        '<div class="mito-eq-step"><span>6</span><code>ATP, ROS, VO\u2082 \u2190 \u03c4/\u03c4<sub>healthy</sub></code></div>' +
      '</div>' +
      '<div class="mini-links">' +
        '<a href="https://zenodo.org/records/18373065" target="_blank" rel="noopener">Zenodo 18373065 \u2192</a>' +
        '<a href="https://infoton.ai/mitochondria" target="_blank" rel="noopener">Live calculator \u2192</a>' +
        '<a href="https://www.youtube.com/watch?v=Kkt7Bfz8NFU" target="_blank" rel="noopener">Video walkthrough \u2192</a>' +
      '</div>',
  },
  {
    id: 'calculator',
    beat: 3,
    title: 'Try the calculator',
    titleHtml: 'Try the <em>calculator</em>',
    pitch: 'Drag membrane potential and watch the quantum \u2192 thermodynamic \u2192 biomarker chain update deterministically. This is the same Quantum Heartbeat engine on infoton.ai, rebuilt native in our v2 instrument shell so reviewers can interrogate every input and output.',
    theme: 'cell',
    stats: ['Live \u0394\u03c8\u2098 slider', 'State classification', 'Reproducible output'],
    widget: 'mitochondria',
    chapter: 'Act III \u00b7 Live demo',
    hook: 'Show, don\u2019t tell \u2014 advisors can stress-test the model\u2019s inputs and outputs in a single sitting.',
    takeaway: 'The demo is the product skeleton: parameterized input, deterministic readout, and a clear path to a longitudinal stability score.',
    riskNote: 'Default 150 mV = the healthy anchor in the published model. Research-use output, not medical advice.',
    demoSectionTitle: 'Quantum Heartbeat Calculator',
    demoSectionSubtitle: '\u00a75 driver: \u0394\u03c8\u2098. Advanced view back-solves \u03bd, \u03bb, T, and Infoton mass (\u00a71\u2013\u00a74).',
    demoLead: 'JC-1 assay \u0394\u03c8\u2098 (mV) is the primary input. Explore healthy, dysregulated, and cancer-associated bands \u2014 the output is a research readout, not a diagnosis.',
    footerNote: '<a href="https://infoton.ai/mitochondria" target="_blank" rel="noopener">infoton.ai/mitochondria</a> \u00b7 <a href="https://zenodo.org/records/18373065">Zenodo 18373065</a> \u00b7 <a href="https://www.youtube.com/watch?v=Kkt7Bfz8NFU" target="_blank" rel="noopener">Video walkthrough</a>',
  },
  {
    id: 'workflow',
    beat: 4,
    title: 'From signal to workflow',
    titleHtml: 'From signal to <em>workflow</em>',
    pitch: 'Ingest measured biomarkers (\u0394\u03c8\u2098, ROS, ATP, fusion/fission) and produce a longitudinal stability score. Over repeated assays, the readout shows whether energetics are stabilizing or degrading. Research-use today; a clinical decision-support workflow is the validated future state.',
    theme: 'cell',
    stats: ['Stability score', 'Biomarker ingest', 'Longitudinal readout'],
    chapter: 'Act IV \u00b7 Workflow',
    hook: 'Software-first: calculator free for research; commercial license for embeds and enterprise ingest.',
    takeaway: 'Revenue paths: licensed calculator, research partnerships, and \u2014 after validation \u2014 clinical decision-support and assay OEM integrations.',
    riskNote: 'Regulatory path depends on claims and jurisdiction \u2014 plan as SaMD / CDS adjunct with counsel before any clinical positioning.',
    extraHtml:
      '<div class="mito-product-grid">' +
        '<article class="mito-product-card"><h4>Today</h4><p>Deterministic research calculator \u00b7 Zenodo-backed math \u00b7 reproducible constants</p></article>' +
        '<article class="mito-product-card"><h4>Next</h4><p>Biomarker ingest API \u00b7 longitudinal stability score \u00b7 cohort-calibrated trajectory</p></article>' +
        '<article class="mito-product-card"><h4>Roadmap</h4><p>Cellular reprogramming R&amp;D \u2014 restore mitochondrial health (public Infoton roadmap)</p></article>' +
      '</div>',
  },
  {
    id: 'validation',
    beat: 5,
    title: 'What\u2019s proven, what\u2019s next',
    titleHtml: 'What\u2019s proven, <em>what\u2019s next</em>',
    pitch: 'Honest separation of what is established today from what this round must prove. The math is published and reproducible; the calculator is live and deterministic; the IP is owned. Clinical predictive value is explicitly unproven \u2014 and that is exactly what the fundraise calibrates.',
    theme: 'cell',
    stats: ['Reproducible math', 'Owned IP', 'Cohort validation next'],
    chapter: 'Act V \u00b7 Validation',
    hook: 'Diligence-forward: the gaps are named, not hidden \u2014 with a funded plan to close them.',
    takeaway: 'Defensibility = published derivations + commercial license + the validation dataset and workflow lock-in this round creates.',
    riskNote: 'Preprint status \u00b7 independent replication strengthens the round \u00b7 no clinical outcome claim is supported today.',
    extraHtml:
      '<div class="mito-ref-list">' +
        '<a href="https://zenodo.org/records/18373065" target="_blank" rel="noopener">The Quantum Heartbeat of Mitochondria \u00b7 Zenodo</a>' +
        '<a href="https://infoton.ai/mitochondria" target="_blank" rel="noopener">Live calculator \u00b7 infoton.ai</a>' +
        '<a href="https://www.youtube.com/watch?v=Kkt7Bfz8NFU" target="_blank" rel="noopener">Video walkthrough</a>' +
        '<a href="https://doi.org/10.5281/zenodo.18210355" target="_blank" rel="noopener">The Infoton: A Fundamental Particle of Information-Energy</a>' +
      '</div>',
  },
  {
    id: 'business',
    beat: 6,
    title: 'Who pays, and the wedge',
    titleHtml: 'Who pays, and <em>the wedge</em>',
    pitch: 'JC-1 and related mitochondrial assays are commercially available; researchers and advanced metabolic-health clinics already measure \u0394\u03c8\u2098 but lack a coherent model tying voltage to ATP, ROS, and stability over time. Virtual Mitochondria is the interpretability layer \u2014 sold first as a research instrument, not a clinical tool.',
    theme: 'cell',
    stats: ['Research-use beachhead', 'JC-1 already measured', 'Interpretability layer'],
    chapter: 'Act VI \u00b7 Business',
    hook: 'Beachhead = research and advanced metabolic-health clinics. Oncology is a deliberate later expansion, after validation.',
    takeaway: 'Wedge: licensed research calculator + partnerships \u2192 paid pilots generate the validation dataset \u2192 clinical workflows and payer-visible outcomes later.',
    riskNote: 'Market sizing is narrative until paid pilots exist. Leading with oncology raises the trust and regulatory bar prematurely \u2014 we don\u2019t.',
    extraHtml:
      '<div class="mito-care-grid">' +
        '<div class="mito-care-item"><strong>Research labs</strong><span>Mitochondrial assay interpretation \u00b7 no diagnostic claim</span></div>' +
        '<div class="mito-care-item"><strong>Metabolic-health clinics</strong><span>Longitudinal \u0394\u03c8\u2098 tracking \u00b7 research-use</span></div>' +
        '<div class="mito-care-item"><strong>Assay vendors</strong><span>Interpretability add-on over JC-1 and related kits</span></div>' +
        '<div class="mito-care-item"><strong>Later: oncology</strong><span>Clinical decision-support \u2014 only after cohort validation</span></div>' +
      '</div>' +
      '<p class="mito-panel-note">Pick one beachhead, prove it, then expand. Oncology earns its place after the data does.</p>',
  },
  {
    id: 'ask',
    beat: 7,
    title: 'The ask',
    titleHtml: 'The <em>ask</em>',
    pitch: 'This round funds the Virtual Mitochondria product path: harden the calculator platform, run cohort validation against measured biomarkers, and seed the reprogramming R&D line on Infoton\u2019s public roadmap.',
    theme: 'cell',
    stats: ['Seed / Series A', 'Cohort validation', 'Platform + R&D'],
    chapter: 'Close \u00b7 The ask',
    hook: 'Lead with the live demo \u2014 diligence can reproduce every constant in one session.',
    takeaway: 'Contact January@infoton.ai for diligence. Calculator and partnership inquiries go to the same line.',
    riskNote: 'We keep the P30 datacenter wedge (separate brief) out of this life-sciences round \u2014 clean cap-table narrative recommended.',
    extraHtml:
      '<div class="ask-table">' +
        '<div class="ask-row"><div class="ask-phase">Phase 1</div><div class="ask-body"><strong>Platform + license engine</strong><span>Calculator API, commercial embeds, research partnerships</span></div></div>' +
        '<div class="ask-row"><div class="ask-phase">Phase 2</div><div class="ask-body"><strong>Cohort validation</strong><span>JC-1 cohort studies \u00b7 stability-score calibration \u00b7 advisor board</span></div></div>' +
        '<div class="ask-row"><div class="ask-phase">Phase 3</div><div class="ask-body"><strong>Reprogramming R&amp;D</strong><span>Cellular intervention tech per public Infoton roadmap</span></div></div>' +
      '</div>' +
      '<div class="hero-cta mito-close-cta">' +
        '<a class="btn btn-primary btn-lg" href="mailto:January@infoton.ai?subject=Virtual%20Mitochondria%20Investor%20Brief">Contact Infoton \u2192</a>' +
        '<a class="btn btn-ghost" href="#/calculator">Open calculator</a>' +
      '</div>',
    footerNote: 'Inspired by Krystalee Krey \u00b7 Infoton LLC \u00b7 A January Walker Project',
  },
  {
    id: 'composable',
    beat: 0,
    title: 'A composable physics primitive',
    titleHtml: 'A composable <em>physics primitive</em>',
    pitch: 'The model is deterministic and single-input: one membrane-potential value in, the full quantum \u2192 thermodynamic \u2192 biomarker chain out, identically every time. That makes it a building block other systems can call \u2014 the virtual-cell and AI-for-biology programs are building exactly the pipelines that consume modules like this.',
    theme: 'cell',
    stats: ['1 input \u2192 full chain', 'JS + Python at parity', 'Open schema + vectors'],
    chapter: 'Appendix \u00b7 Integration',
    hook: 'Forward-looking optionality \u2014 not a partnership claim, but the substrate that makes one possible.',
    takeaway: 'The same engine behind the demo can drop into a virtual-cell pipeline as a verified, versioned component.',
    riskNote: 'Ecosystem named as market, not partners \u2014 no integration is live today. Packaged distribution is roadmap.',
    extraHtml:
      '<div class="mito-product-grid">' +
        '<article class="mito-product-card"><h4>Built today</h4><p>Versioned JSON snapshot contract \u00b7 published schema (units + provenance) \u00b7 conformance vectors \u00b7 JS\u2194Python parity tests</p></article>' +
        '<article class="mito-product-card"><h4>Why it connects</h4><p>Deterministic, first-principles vs. heuristic fields separated, language-portable \u2014 trustworthy enough to ingest</p></article>' +
        '<article class="mito-product-card"><h4>Roadmap</h4><p>Vectorized / differentiable core \u00b7 pip-installable package \u00b7 one-call integration notebook</p></article>' +
      '</div>' +
      '<div class="mini-links">' +
        '<a href="https://zenodo.org/records/18373065" target="_blank" rel="noopener">Paper \u00b7 Zenodo 18373065 \u2192</a>' +
        '<a href="https://infoton.ai/mitochondria" target="_blank" rel="noopener">Live calculator \u2192</a>' +
      '</div>',
  },
  {
    id: 'p30',
    beat: 0,
    title: 'Sibling: Infoton P30',
    titleHtml: 'Sibling: Infoton <em>P30</em>',
    pitch: 'Datacenter encoding wedge \u2014 25\u00d7 validation op reduction, library mode ships today. Separate round, separate cap table; same Infoton information-energy foundation.',
    theme: 'cell',
    stats: ['25\u00d7 library proof', 'Separate TAM', 'Same founder'],
    chapter: 'Appendix \u00b7 P30',
    takeaway: 'Some LPs will want both legs of the Infoton platform \u2014 compute integrity and biological energetics \u2014 but they are funded separately.',
    riskNote: 'Do not commingle milestones without board clarity. This brief stays life-sciences only.',
    extraHtml:
      '<div class="mini-links">' +
        '<a href="../sites-v2/index.html#/">P30 investor brief v2 \u2192</a>' +
        '<a href="https://github.com/eromanowski/Infoton" target="_blank" rel="noopener">Open reproduction repo \u2192</a>' +
      '</div>',
  },
];

window.MITO_THESIS = {
  eyebrow: 'Virtual Mitochondria \u00b7 Investor brief \u00b7 research-use calculator',
  headlineHtml: 'Model mitochondrial <em>stability</em> from membrane potential',
  subhead: 'Virtual Mitochondria turns \u0394\u03c8\u2098 assay inputs into an auditable, deterministic stability readout \u2014 coherence, ATP, and ROS proxies \u2014 built on Infoton\u2019s published Quantum Heartbeat model.',
  hookLine: 'A bioenergetic readout for what imaging does not measure \u2014 research-use today, clinical validation next.',
  metrics: [
    { val: '\u0394\u03c8\u2098', lab: 'Input', sub: 'assay-derived signal' },
    { val: 'Stability', lab: 'Output', sub: 'coherence \u00b7 ATP \u00b7 ROS readout' },
    { val: 'Research', lab: 'Current use', sub: 'education \u00b7 not diagnostic' },
    { val: 'Cohorts', lab: 'Next milestone', sub: 'clinical validation' },
  ],
  pillars: [
    { num: '01', title: 'Auditable, not asserted', body: 'Deterministic model \u2014 one input, the same quantum \u2192 thermodynamic \u2192 biomarker chain out every time. Every constant traces to a published derivation.' },
    { num: '02', title: 'A demo you can interrogate', body: 'The live calculator lets advisors stress-test inputs and outputs in one session \u2014 the same instrument shell as the P30 work.' },
    { num: '03', title: 'Clear research-to-clinic path', body: 'Research-use today; this round funds the cohort validation and biomarker ingest that unlock clinical workflows.' },
  ],
  scope: {
    is: [
      'A deterministic, research-use calculator',
      'A model linking \u0394\u03c8\u2098 to downstream energetic proxies (coherence, ATP, ROS)',
      'A prototype for longitudinal stability scoring',
    ],
    isNot: [
      'A cleared diagnostic',
      'A treatment-recommendation engine',
      'A validated predictor of patient outcomes',
    ],
  },
  tryThis: [
    'Start at <strong>150 mV</strong> \u2014 the healthy anchor in the published model.',
    'Drag \u0394\u03c8\u2098 lower \u2014 watch state classification, the ATP proxy, the ROS proxy, and coherence shift together.',
    'The thesis is not the slider \u2014 it is longitudinal interpretation of this one signal over time.',
  ],
  validation: {
    today: [
      'Deterministic research / education calculator',
      'Published derivation (Zenodo) with reproducible constants',
      'JS \u2194 Python parity + conformance vectors',
    ],
    unproven: [
      'Clinical outcome prediction',
      'Diagnostic use',
      'Treatment guidance',
      'Payer-visible benefit',
    ],
    unlocks: [
      'Biomarker-cohort validation',
      'Biomarker ingest + longitudinal stability score',
      'Clinical advisor board',
      'Regulatory positioning (SaMD / CDS adjunct)',
    ],
  },
  ask: {
    headline: 'What this round funds',
    phases: [
      { phase: 'Phase 1', funds: 'Calculator platform \u00b7 API \u00b7 commercial licensing', milestone: 'Paid research embeds + partners' },
      { phase: 'Phase 2', funds: 'Biomarker ingest \u00b7 longitudinal stability score \u00b7 cohort validation', milestone: 'Pilot cohort readouts' },
      { phase: 'Phase 3', funds: 'Mitochondrial reprogramming R&D', milestone: 'Intervention technology line' },
    ],
    ctaPrimary: { label: 'Try the calculator', route: 'calculator' },
    ctaSecondary: { label: 'View validation plan', route: 'validation' },
    ctaClose: { label: 'The ask', route: 'ask' },
  },
};

window.MITO_NAV = [
  { route: '', label: 'Overview' },
  { route: 'problem', label: 'Problem' },
  { route: 'calculator', label: 'Demo' },
  { route: 'workflow', label: 'Workflow' },
  { route: 'validation', label: 'Validation' },
  { route: 'ask', label: 'Ask' },
];
