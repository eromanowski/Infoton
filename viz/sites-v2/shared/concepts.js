/** P30 Investor Brief v2 — widget ids for native mount; demo = iframe fallback (Phase 2) */

window.P30_STORY = {

  beats: ['hamming', 'compare', 'encode', 'energy', 'fleet', 'history', 'learn'],

  beatLabels: ['The tax', 'The proof', 'The wedge', 'Unit econ', 'The scale', 'Why now', 'Close'],

  appendix: ['physics', 'mitochondria', 'atomic'],

};



window.P30_CONCEPTS = [

  {

    id: 'hamming',

    beat: 1,

    title: 'Every rack pays a hidden tax',

    titleHtml: 'Every rack pays a <em>hidden tax</em>',

    pitch: 'Before you see our solution, understand the line item nobody puts on the slide: 584 irreversible operations per 64-bit word, on every read, in every AI data center — because the industry still runs a 1964 byte encoding with bolt-on ECC.',

    theme: 'bits',

    stats: ['584 ops / word', '12,264 per sentence', 'Paid on every read'],

    widget: 'hamming',

    demo: 'hamming.html',

    chapter: 'Act I · The problem',

    hook: 'Loss framing: the incumbent cost is real, recurring, and growing with AI memory bandwidth.',

    takeaway: 'You are not investing in a faster chip story. You are investing in removing a tax that scales with the exact problem your LPs already care about.',

    riskNote: 'Hamming SECDED is the honest baseline — we model against it explicitly, not a strawman.',

    demoSectionTitle: 'Live cost model',

    demoSectionSubtitle: 'Run the baseline encoding model and watch the ECC work accumulate.',

    demoLead: 'The claim above is abstract. This demo shows where the operations go: one 64-bit word, one full tweet, or the same sentence used throughout the deck.',

    footerNote: '21 × 64-bit words × 584 ops = 12,264. Baseline defined in open reproduction.',

  },

  {

    id: 'compare',

    beat: 2,

    title: 'Sixty seconds that reframe the category',

    titleHtml: 'Sixty seconds that <em>reframe the category</em>',

    pitch: 'Press Run once. P30 finishes in 489 operations while traditional Hamming SECDED is still counting toward 12,264 — same sentence, same hardware class. This is the slide your technical partner will believe because they can reproduce it.',

    theme: 'dual',

    stats: ['25.1× gap · library', '75.2× · native path', 'Linkable · reproducible'],

    widget: 'compare',

    demo: 'compare.html',

    group: 'thesis',

    chapter: 'Act II · The proof',

    hook: 'Show, don\'t tell — transparent demo beats any deck animation.',

    takeaway: 'Operation count is the honest proxy for energy, heat, and silicon spent on integrity. A 25× gap on work every rack performs all day is a category shift.',

    riskNote: 'Counts are modeled and verified in open code — facility kW extrapolation is the next validation gate.',

    demoLead: 'Run the same sentence through both systems and compare modeled operations.',

    footerNote: 'Matches Infoton\'s published calculator · Conformance CI on every push.',

  },

  {

    id: 'encode',

    beat: 3,

    title: 'Revenue before the fab',

    titleHtml: 'Revenue <em>before the fab</em>',

    pitch: 'Library mode is the wedge investors can underwrite today: a transcoder on conventional CPUs — no OS rewrite, no rip-and-replace. License the codec, embed in validation pipelines, expand to firmware ingress where reads add zero re-verify cost.',

    theme: 'prime',

    stats: ['Ships on today\'s stack', '489 ops · library', '163 ops · BIOS path'],

    widget: 'encode',

    demo: 'encoder.html',

    group: 'thesis',

    chapter: 'Act III · The wedge',

    hook: 'Reduces time-to-revenue and de-risks the round — software before silicon NRE.',

    takeaway: 'Deploy path: transcoder licensing now → BIOS ingress → memory controller and silicon optionality. Size the round on Phase 1.',

    riskNote: 'BIOS-native mode needs deeper stack integration; library mode is the near-term milestone.',

    demoSectionTitle: 'Product demo',

    demoSectionSubtitle: 'Toggle library vs BIOS-native paths and watch operations per character.',

    demoLead: 'Library mode is the wedge investors can underwrite today — no OS rewrite, no rip-and-replace.',

    footerNote: '167-byte CHAR storage · 102 conformance vectors · Shippable today.',

  },

  {

    id: 'energy',

    beat: 4,

    title: 'Bottom-up: what one rack saves',

    titleHtml: 'Bottom-up: what <em>one rack</em> saves',

    pitch: 'If validation ops scale to power — Landauer says they do — a 75× reduction on the ECC slice turns a modeled 130 kW validation burden into ~1.7 kW. Build your IRR: op ratio × validation slice × PUE × $/kWh.',

    theme: 'thermal',

    stats: ['130 kW → 1.73 kW · model', 'Air-cool threshold', 'Landauer @ 350 K'],

    widget: 'impact',

    demo: 'impact.html',

    group: 'economics',

    chapter: 'Act IV · Unit economics',

    hook: 'Gives your associate a spreadsheet story that starts from proven ops.',

    takeaway: 'Start with the op ratio from Act II, apply to validation-power fraction you believe, stress-test in diligence.',

    riskNote: 'Illustrative — full-facility power includes compute, refresh, networking. FPGA bench pending.',

    demoSectionTitle: 'Rack model',

    demoSectionSubtitle: 'Run the baseline encoding model and watch the ECC work accumulate.',

    demoLead: 'Plug in your assumptions — start from the op ratio in Act II, then stress-test kW, PUE, and tariff.',

    footerNote: 'Hypothesis panel · Pair with your PUE and tariff.',

  },

  {

    id: 'fleet',

    beat: 5,

    title: 'Top-down: the fleet opportunity',

    titleHtml: 'Top-down: the <em>fleet</em> opportunity',

    pitch: 'Drag the slider. At 25× per site, converting even a fraction of 5,500 US data centers moves gigawatts — reactors never built, heat never dumped. The TAM story after unit economics check out.',

    theme: 'thermal',

    stats: ['183 TWh · US anchor', '5,500 sites', 'GW + SMRs avoided'],

    widget: 'fleet',

    demo: 'fleet.html',

    group: 'economics',

    chapter: 'Act V · Scale',

    hook: 'Interactive sensitivity — not a static TAM slide.',

    takeaway: 'Single-digit penetration × ~96% draw reduction per site is category-sized. Slider = sensitivity, not forecast.',

    riskNote: 'Assumes 25× ratio and 3.8 MW average DC — replace with your constants.',

    demoSectionTitle: 'Fleet sensitivity',

    demoSectionSubtitle: 'Drag conversion across US, global, or Utah anchor scenarios.',

    demoLead: 'Interactive TAM — not a static slide. Replace the 25× ratio and average MW with your diligence constants.',

    footerNote: 'Infoton fleet model · Export to your memo.',

  },

  {

    id: 'history',

    beat: 6,

    title: 'The industry has done this before',

    titleHtml: 'The industry has <em>done this before</em>',

    pitch: 'System/360 fixed the byte in 1964 — three years after Landauer in IBM\'s journal. Unicode moved the world in 1993. Encoding upgrades happen; AI power is the forcing function.',

    theme: 'timeline',

    stats: ['Unicode 1993', 'Landauer 1961', 'P30 · 2026'],

    widget: 'history',

    demo: 'history.html',

    group: 'defensibility',

    chapter: 'Act VI · Why now',

    hook: 'Precedent reduces "impossible" objections.',

    takeaway: 'The byte was a market choice. The next choice is deployable while power caps bite.',

    riskNote: 'Precedent ≠ adoption — library wedge shortens time-to-revenue.',

    demoSectionTitle: 'Precedent timeline',

    demoSectionSubtitle: 'From Stretch to System/360 to Unicode — encoding standards have changed before.',

    demoLead: 'Landauer published the energy floor in 1961; the 8-bit byte was fixed three years later. Power caps are the forcing function for the next update.',

    footerNote: 'Landauer predates the 8-bit byte standard.',

  },

  {

    id: 'learn',

    beat: 7,

    title: 'Your diligence, ready',

    titleHtml: 'Your diligence, <em>ready</em>',

    pitch: 'Landauer, Hsiao, Unicode, Buchholz, Walker/Infoton — primary sources, open reproduction, CI-backed conformance. Hand this to your technical advisor.',

    theme: 'constellation',

    stats: ['Primary citations', 'Open repo', '102 test vectors'],

    widget: 'learn',

    demo: 'infoton_reference/widget_7.html',

    group: 'defensibility',

    chapter: 'Close · Data room',

    hook: 'Make DD easy — shorten the cycle.',

    takeaway: 'Every claim traces to a citable baseline. We reproduced Infoton op counts independently.',

    riskNote: 'Infoton published no bit-level codec — our open implementation closes the gap.',

    demoSectionTitle: 'Diligence pack',

    demoSectionSubtitle: 'Primary sources, open reproduction, and conformance vectors — ready for your technical advisor.',

    demoLead: 'Every claim in this brief traces to a citable baseline. Hand this section to DD and shorten the cycle.',

    footerNote: 'Repo: <a href="https://github.com/eromanowski/Infoton">github.com/eromanowski/Infoton</a>',

  },

  {

    id: 'physics',

    beat: 0,

    title: 'Defensible science',

    titleHtml: 'Defensible <em>science</em>',

    pitch: 'Januarian Physics — Zenodo corpus, Landauer-grounded chain from k<sub>B</sub>T ln(2) to coprimality as the check.',

    theme: 'constellation',

    stats: ['Zenodo', 'Landauer chain', 'Prime-30 wheel'],

    widget: null,

    demo: null,

    group: 'defensibility',

    chapter: 'Appendix · Moat',

    takeaway: 'Science advisor can audit step by step.',

    riskNote: 'Preprint status varies.',

    footerNote: '<a href="https://doi.org/10.5281/zenodo.18210355">DOI 10.5281/zenodo.18210355</a>',

  },

  {

    id: 'mitochondria',

    beat: 0,

    title: 'Life sciences optionality',

    titleHtml: 'Life sciences <em>optionality</em>',

    pitch: 'Virtual Mitochondria — membrane potential Δψₘ drives a quantum → thermodynamic → biomarker chain. Full investor brief available separately; P30 appendix keeps the live calculator.',

    theme: 'cell',

    stats: ['Δψₘ', 'Zenodo', 'Investor brief'],

    widget: 'mitochondria',

    demo: null,

    group: 'platform',

    chapter: 'Appendix · Platform',

    takeaway: 'Standalone fundraise deck at mitochondria-brief — this slide is the live demo hook for P30 LPs.',

    riskNote: 'Separate regulatory horizon. Calculator is educational, not diagnostic.',

    demoSectionTitle: 'Mitochondria calculator',

    demoSectionSubtitle: 'Drag membrane potential — watch coherence, ATP, and ROS respond.',

    demoLead: 'Ported from the Infoton Virtual Mitochondria model. JC-1 assay Δψₘ in mV feeds the same equation chain published on Zenodo.',

    footerNote: '<a href="../mitochondria-brief/index.html#/">Full investor brief →</a> · <a href="https://zenodo.org/records/18373065">Zenodo 18373065</a>',

  },

  {

    id: 'atomic',

    beat: 0,

    title: 'Silicon roadmap',

    titleHtml: 'Silicon <em>roadmap</em>',

    pitch: 'Years 3–5: memory controller, Sky130 MPW, full 75× BIOS path. After software proof and FPGA soak.',

    theme: 'atom',

    stats: ['FPGA bench', 'Arty A7', 'MPW path'],

    widget: null,

    demo: null,

    group: 'platform',

    chapter: 'Appendix · Upside',

    takeaway: 'Upside if library wedge wins — not year-one.',

    riskNote: 'Silicon NRE is capital-intensive.',

    footerNote: 'Thermal claims gated on measured soak.',

  },

];



window.P30_GROUPS = {

  thesis: { label: 'Thesis', color: '#ffd84d' },

  economics: { label: 'Economics', color: '#fba238' },

  defensibility: { label: 'Trust', color: '#a31e9a' },

  platform: { label: 'Optionality', color: '#34d399' },

};



window.P30_THESIS = {

  eyebrow: 'Infoton P30 · Investor brief v2 · native demos',

  headline: 'Stop paying the 1964 byte tax on every AI rack',

  subhead: 'P30 is an encoding-layer upgrade — structural coprimality instead of bolt-on ECC. 25× fewer validation ops on today\'s stack. Library mode ships without a fab.',

  hookLine: 'Your LPs are already funding the AI power crisis. This is the line item nobody puts on the slide.',

  metrics: [

    { val: '25×', lab: 'Proven today', sub: '489 vs 12,264 ops' },

    { val: '75×', lab: 'Native path', sub: 'BIOS · firmware ingress' },

    { val: 'Now', lab: 'Library wedge', sub: 'Revenue before silicon' },

    { val: '183 TWh', lab: 'US DC anchor', sub: 'Top-down TAM model' },

  ],

  pillars: [

    { num: '01', title: 'Wedge, not rip-and-replace', body: 'Transcoder on existing CPUs. First revenue before NRE.' },

    { num: '02', title: 'Proof you can forward', body: 'Live demo, open repo, conformance CI. One sitting, not three calls.' },

    { num: '03', title: 'Physics, not marketing', body: 'Landauer → coprimality. Published corpus. Auditable moat.' },

  ],

  ask: {

    headline: 'What this round funds',

    phases: [

      { phase: 'Now', funds: 'Library transcoder · licensing · design-partner embeds', milestone: 'First commercial pipeline' },

      { phase: '12–18 mo', funds: 'BIOS ingress · FPGA thermal soak · claim chain', milestone: 'Measured energy story' },

      { phase: '24–36 mo', funds: 'Memory controller · silicon MPW · co-design', milestone: 'Native 75× path' },

    ],

    ctaPrimary: { label: 'Begin the briefing', route: 'hamming' },

    ctaSecondary: { label: 'Jump to proof', route: 'compare' },

    ctaClose: { label: 'Open diligence pack', route: 'learn' },

  },

  risks: [

    'kW claims extrapolate from op counts — hardware validation is next',

    'Hyperscaler cycles are long — library mode hedges time-to-revenue',

    'Size the round on the wedge; silicon is staged upside',

  ],

  trust: [

    'Open reproduction matches Infoton calculator',

    '102 conformance vectors · CI on every push',

    'Zenodo Januarian Physics corpus',

  ],

};



window.P30_NAV = [

  { route: '', label: 'Overview' },

  { route: 'compare', label: 'Proof' },

  { route: 'learn', label: 'Diligence' },

  { route: 'v1', label: 'v1', href: '../sites/index.html#/' },

];


