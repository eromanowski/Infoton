/**
 * Browser QA for sites-v2 investor brief.
 * Usage: npx playwright install chromium && node viz/tools/browser-qa-v2.mjs [port]
 */
import { chromium } from 'playwright';

const PORT = parseInt(process.argv[2] || '8081', 10);
const BASE = `http://localhost:${PORT}`;

const WIDGET_ROUTES = [
  { hash: '/', expectWidget: true, label: 'home (compact compare)' },
  { hash: '/hamming', expectWidget: true },
  { hash: '/compare', expectWidget: true },
  { hash: '/encode', expectWidget: true },
  { hash: '/energy', expectWidget: true },
  { hash: '/fleet', expectWidget: true },
  { hash: '/history', expectWidget: true },
  { hash: '/learn', expectWidget: true },
  { hash: '/physics', expectWidget: false },
  { hash: '/mitochondria', expectWidget: true },
  { hash: '/atomic', expectWidget: false },
];

const issues = [];
const passes = [];

function fail(where, msg) {
  issues.push({ where, msg });
}

function pass(where, msg) {
  passes.push({ where, msg });
}

async function waitForDemo(page, timeout = 15000) {
  await page.waitForFunction(
    () => {
      const mount = document.querySelector('.demo-mount');
      if (!mount) return true;
      if (mount.querySelector('.demo-loading')) return false;
      if (mount.querySelector('.demo-error')) return true;
      return mount.children.length > 0;
    },
    { timeout }
  );
}

async function qaBrief(page) {
  for (const r of WIDGET_ROUTES) {
    const where = `brief${r.hash}`;
    const url = `${BASE}/sites-v2/index.html#${r.hash === '/' ? '/' : r.hash.replace(/^\//, '')}`;

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#app .deck', { timeout: 8000 });

    const title = await page.title();
    if (!title.includes('Infoton')) fail(where, `Unexpected title: ${title}`);
    else pass(where, `Title OK: ${title}`);

    const mount = page.locator('#app #demo-mount');
    const hasMount = (await mount.count()) > 0;

    if (r.expectWidget) {
      if (!hasMount) {
        fail(where, 'Missing .demo-mount');
        continue;
      }
      try {
        await waitForDemo(page);
      } catch {
        fail(where, 'Demo did not finish loading (timeout)');
        continue;
      }
      const err = await mount.locator('.demo-error').count();
      if (err) {
        fail(where, 'Demo error state shown');
        continue;
      }
      const wgt = await mount.locator('.wgt').count();
      if (!wgt) fail(where, 'No .wgt inside demo-mount');
      else pass(where, 'Widget mounted');
    } else if (hasMount) {
      fail(where, 'Unexpected demo-mount on appendix slide');
    } else {
      pass(where, 'Appendix slide (no widget)');
    }
  }
}

async function qaCompareStep(page) {
  const where = 'compare-step';
  await page.goto(`${BASE}/sites-v2/index.html#/compare`, { waitUntil: 'domcontentloaded' });
  await waitForDemo(page);
  const stepBtn = page.locator('#stepBtn').first();
  await stepBtn.click();
  await page.waitForFunction(
    () => {
      const el = document.querySelector('#stripP30');
      return el && !/^0\s*\//.test(el.textContent.trim());
    },
    { timeout: 8000 }
  );
  pass(where, 'Single step advances P30 progress');
}

async function qaCompareRun(page) {
  const where = 'compare-run';
  await page.goto(`${BASE}/sites-v2/index.html#/compare`, { waitUntil: 'domcontentloaded' });
  await waitForDemo(page);

  const runBtn = page.locator('#runBtn').first();
  if (!(await runBtn.count())) {
    fail(where, 'Run button missing');
    return;
  }

  const stripP30 = page.locator('#stripP30').first();
  const before = (await stripP30.textContent()) || '0';

  await runBtn.click();
  await page.waitForFunction(
    () => {
      const el = document.querySelector('#stripP30');
      return el && !/^0\s*\//.test(el.textContent.trim());
    },
    { timeout: 12000 }
  ).catch(() => fail(where, 'P30 progress did not advance after Run'));

  const after = (await stripP30.textContent()) || '';
  if (!/^0\s*\//.test(after.trim())) pass(where, `Progress advanced: ${after.trim()}`);
  else if (!issues.some((i) => i.where === where)) fail(where, 'Progress still at zero');

  const resetBtn = page.locator('#resetBtn').first();
  await resetBtn.click();
  await page.waitForTimeout(300);
  pass(where, 'Reset clicked without error');
}

async function qaRouteDestroy(page) {
  const where = 'route-destroy';
  await page.goto(`${BASE}/sites-v2/index.html#/compare`, { waitUntil: 'domcontentloaded' });
  await waitForDemo(page);
  const compareCount = await page.locator('.wgt-compare').count();
  if (compareCount !== 1) fail(where, `Expected 1 compare widget, got ${compareCount}`);
  else pass(where, 'Single compare on /compare');

    await page.goto(`${BASE}/sites-v2/index.html#/hamming`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#app .deck-chapter', { timeout: 8000 });
    await waitForDemo(page);
  const hamCount = await page.locator('.wgt-compare').count();
  if (hamCount !== 0) fail(where, 'Compare widget leaked after route change');
  else pass(where, 'Compare destroyed on route change');

  const hamWgt = await page.locator('.demo-mount .wgt').count();
  if (!hamWgt) fail(where, 'Hamming widget not mounted after navigation');
  else pass(where, 'Hamming mounted after navigation');
}

async function qaCompareV2(page) {
  const where = 'compare-v2';
  await page.goto(`${BASE}/compare-v2.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () => document.querySelector('#mount .wgt-compare') || document.querySelector('#app .wgt-compare'),
      { timeout: 15000 }
    ).catch(() => fail(where, 'Compare widget did not mount'));
  if (!issues.some((i) => i.where === where)) pass(where, 'Standalone compare mounted');

  const runBtn = page.locator('#runBtn').first();
  if (await runBtn.count()) {
    await runBtn.click();
    await page.waitForTimeout(800);
    pass(where, 'Run clicked on standalone page');
  }
}

async function qaMobileStack(page) {
  const where = 'mobile-compare';
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/sites-v2/index.html#/compare`, { waitUntil: 'domcontentloaded' });
  await waitForDemo(page);

  const panes = page.locator('.wgt-compare .panes');
  if (!(await panes.count())) {
    fail(where, 'Compare panes missing');
    return;
  }
  const cols = await panes.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
  if (!cols || cols.split(' ').length < 2 && cols !== '1fr') {
    // single column = stacked on narrow viewports
    if (cols !== '1fr' && !/^\d/.test(cols)) fail(where, `Unexpected grid columns: ${cols}`);
  }
  if (cols === '1fr' || (cols && !cols.includes('1fr 1fr'))) pass(where, `Compare panes stack on mobile (${cols})`);
  else fail(where, `Expected single column grid, got: ${cols}`);

  const rail = page.locator('.story-rail');
  if (await rail.count()) pass(where, 'Story rail visible on mobile');
  else fail(where, 'Story rail missing');

  const clock = page.locator('.wgt-compare #clock').first();
  if (await clock.count()) {
    const fit = await clock.evaluate((el) => {
      const mount = el.closest('.pane-mount');
      if (!mount) return true;
      return el.getBoundingClientRect().width <= mount.getBoundingClientRect().width + 2;
    });
    if (fit) pass(where, 'P30 clock fits pane width on mobile');
    else fail(where, 'P30 clock overflows pane on mobile');
  }
}

async function qaNoIframes(page) {
  const where = 'no-iframes';
  for (const hash of ['/', '/compare', '/learn']) {
    await page.goto(`${BASE}/sites-v2/index.html#${hash === '/' ? '/' : hash.slice(1)}`, {
      waitUntil: 'domcontentloaded',
    });
    if (hash !== '/physics') await waitForDemo(page).catch(() => {});
    const iframes = await page.locator('#app iframe').count();
    if (iframes) fail(where, `${hash}: found ${iframes} iframe(s) in #app`);
  }
  if (!issues.some((i) => i.where === where)) pass(where, 'No iframes in #app on sampled routes');
}

async function qaMitochondria(page) {
  const where = 'mitochondria-calc';
  await page.goto(`${BASE}/sites-v2/index.html#/mitochondria`, { waitUntil: 'domcontentloaded' });
  await waitForDemo(page);

  const wgt = page.locator('.wgt-mito');
  if (!(await wgt.count())) {
    fail(where, 'Mitochondria widget missing');
    return;
  }

  const badge = page.locator('[data-wgt="stateBadge"]');
  const badgeText = ((await badge.textContent()) || '').trim();
  if (badgeText !== 'HEALTHY') fail(where, `Expected HEALTHY at default, got "${badgeText}"`);
  else pass(where, 'Default 150 mV shows HEALTHY state');

  const psi = page.locator('[data-wgt="psiVal"]');
  if (((await psi.textContent()) || '').trim() !== '150') fail(where, 'Default psi not 150');
  else pass(where, 'Default membrane potential 150 mV');
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));

  try {
    await qaBrief(page);
    await qaCompareStep(page);
    await qaCompareRun(page);
    await qaRouteDestroy(page);
    await qaCompareV2(page);
    await qaMobileStack(page);
    await qaNoIframes(page);
    await qaMitochondria(page);
  } finally {
    await browser.close();
  }

  console.log('\n=== P30 sites-v2 browser QA ===\n');
  console.log(`Base: ${BASE}\n`);

  for (const p of passes) console.log(`  PASS  [${p.where}] ${p.msg}`);
  for (const i of issues) console.log(`  FAIL  [${i.where}] ${i.msg}`);

  if (consoleErrors.length) {
    console.log('\nConsole errors:');
    [...new Set(consoleErrors)].forEach((e) => console.log(`  - ${e}`));
  }
  if (pageErrors.length) {
    console.log('\nPage errors:');
    [...new Set(pageErrors)].forEach((e) => console.log(`  - ${e}`));
  }

  console.log(`\nSummary: ${passes.length} passed, ${issues.length} failed`);
  const exitCode = issues.length || consoleErrors.length || pageErrors.length ? 1 : 0;
  process.exit(exitCode);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
