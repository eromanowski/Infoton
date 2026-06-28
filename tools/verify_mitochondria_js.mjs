#!/usr/bin/env node
/**
 * Parity test for the JS engine that actually runs in the widget.
 * Loads viz/sites-v2/widgets/lib/mitochondria-core.js and asserts the SAME golden
 * vectors used by tools/verify_mitochondria.py (which match the infoton.ai embed).
 * If the JS core ever drifts from the Python core / paper values, this fails.
 *
 * Usage: node tools/verify_mitochondria_js.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const corePath = resolve(here, '..', 'viz', 'sites-v2', 'widgets', 'lib', 'mitochondria-core.js');

// The core is an IIFE that attaches to `window`; shim it onto the global scope.
globalThis.window = globalThis;
// eslint-disable-next-line no-eval
(0, eval)(readFileSync(corePath, 'utf8'));

const core = globalThis.P30MitoCore;
if (!core) {
  console.error('FAIL: P30MitoCore did not load');
  process.exit(1);
}

let ok = true;
const log = (label, got, want, pass) => {
  ok = ok && pass;
  console.log(`  ${label}: ${got} (want ${want}) ${pass ? 'OK' : 'FAIL'}`);
};
const approx = (g, w, tol) => Math.abs(g - w) <= tol;

console.log('=== Virtual Mitochondria JS parity ===');

const r150 = core.calculate(150);
const checks150 = [
  ['psi=150 energy_j', r150.energyJ, 2.403265e-20, 1e-25],
  ['psi=150 nu_thz', r150.nuThz, 36.27, 0.05],
  ['psi=150 wavelength_um', r150.wavelengthUm, 8.3, 0.1],
  ['psi=150 t_wien_k', r150.tWienK, 350.6, 0.2],
  ['psi=150 delta_t_k', r150.deltaTK, 27.58, 0.05],
  ['psi=150 tau_coh_ps', r150.tauCohPs, 0.277, 0.01],
  ['psi=150 tau_ratio', r150.tauRatio, 0.993, 0.01],
  ['psi=150 atp', r150.atp, 2.46, 0.05],
  ['psi=150 ros', r150.ros, 1.01, 0.05],
  ['psi=150 vo2', r150.vo2, 0.99, 0.02],
];
for (const [label, got, want, tol] of checks150) log(label, got, want, approx(got, want, tol));
log('psi=150 state', r150.state.id, 'HEALTHY', r150.state.id === 'HEALTHY');

const stateCases = [
  [100, 'DYSREGULATED'],
  [145, 'HEALTHY'],
  [155, 'HEALTHY'],
  [160, 'MILD_HYPERPOLARIZED'],
  [180, 'PATHOLOGICAL'],
  [220, 'CANCER'],
];
for (const [psi, want] of stateCases) {
  const got = core.classifyState(psi).id;
  log(`classify(${psi})`, got, want, got === want);
}

const r100 = core.calculate(100);
const depressed =
  r100.tauCohS === 0 && approx(r100.atp, 0.5, 1e-9) && approx(r100.ros, 100, 1e-9) && approx(r100.vo2, 0.05, 1e-9);
log('psi=100 depressed biomarkers', `tau=${r100.tauCohS} atp=${r100.atp} ros=${r100.ros}`, 'tau=0 atp=0.5 ros=100', depressed);

const inverses = [
  ['energy', core.psiFromEnergy(r150.energyJ)],
  ['omega', core.psiFromOmega(r150.omegaRadS)],
  ['nu_thz', core.psiFromNuThz(r150.nuThz)],
  ['lambda_um', core.psiFromWavelengthUm(r150.wavelengthUm)],
  ['t_wien', core.psiFromTWien(r150.tWienK)],
  ['delta_t', core.psiFromDeltaT(r150.deltaTK)],
  ['tau_ps', core.psiFromTauPs(r150.tauCohPs)],
  ['infoton', core.psiFromInfotonMass(r150.infotonMass)],
  ['atp', core.psiFromAtp(r150.atp)],
  ['ros', core.psiFromRos(r150.ros)],
  ['vo2', core.psiFromVo2(r150.vo2)],
];
for (const [label, back] of inverses) log(`inverse ${label}`, back.toFixed(2), '150.00', approx(back, 150, 0.5));

// ── Conformance: JS core.snapshot() must reproduce the Python-generated vectors ──
console.log('\n=== Snapshot conformance (JS core vs published vectors) ===');
const vectors = JSON.parse(
  readFileSync(resolve(here, '..', 'spec', 'mitochondria_vectors.json'), 'utf8')
);
const leaves = (obj, prefix = '') => {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') Object.assign(out, leaves(v, key));
    else out[key] = v;
  }
  return out;
};
const rel = vectors.tolerance.rel;
const relClose = (g, w) => (typeof w === 'number' ? Math.abs(g - w) <= rel * Math.max(1, Math.abs(w)) : g === w);

if (core.MODEL_VERSION !== vectors.model_version) {
  ok = false;
  console.log(`  FAIL model_version ${core.MODEL_VERSION} != vectors ${vectors.model_version}`);
} else {
  console.log(`  model_version matches vectors (${core.MODEL_VERSION}): OK`);
}

let fwdOk = true;
for (const vec of vectors.forward) {
  const got = leaves(core.snapshot(vec.psi_mmV));
  const want = leaves(vec.snapshot);
  for (const [key, wv] of Object.entries(want)) {
    if (!relClose(got[key], wv)) {
      fwdOk = false;
      console.log(`  FAIL forward psi=${vec.psi_mmV} ${key}: ${got[key]} != ${wv}`);
    }
  }
}
ok = ok && fwdOk;
console.log(`  ${vectors.forward.length} forward vectors reproduce (JS == Python): ${fwdOk ? 'OK' : 'FAIL'}`);

console.log(`\nOverall: ${ok ? 'PASS' : 'FAIL'}`);
process.exit(ok ? 0 : 1);
