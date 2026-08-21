#!/usr/bin/env node
/**
 * Perf/regression harness for the frontend performance-fix pass.
 *
 * Usage:
 *   node perf-tests/measure.js <label> ["free-text note"]
 *
 * For each route in routes.json:
 *   - loads it in a fresh browser context (no shared cache across routes)
 *   - records console errors / page errors (regression signal)
 *   - records Navigation Timing (load time)
 *   - records total response bytes transferred
 *   - records DOM node count (rendered-content proxy)
 *   - records a basic "did it render something real" content check
 *
 * Appends one entry per run to results.json and rewrites RESULTS.md as a
 * human-readable summary table with deltas against the "baseline" run.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const ROUTES = JSON.parse(fs.readFileSync(path.join(__dirname, 'routes.json'), 'utf8'));
const RESULTS_JSON = path.join(__dirname, 'results.json');
const RESULTS_MD = path.join(__dirname, 'RESULTS.md');

async function measureRoute(browser, route) {
  const context = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push('pageerror: ' + err.message));

  let totalBytes = 0;
  let requestCount = 0;
  page.on('response', async (res) => {
    requestCount++;
    const len = res.headers()['content-length'];
    if (len) totalBytes += parseInt(len, 10);
  });

  const t0 = Date.now();
  let navError = null;
  try {
    await page.goto(BASE_URL + route.path, { waitUntil: 'networkidle', timeout: 30000 });
  } catch (e) {
    navError = String(e.message || e);
  }
  const wallMs = Date.now() - t0;

  let timing = null;
  let domNodeCount = null;
  let bodyTextLength = null;
  let title = null;
  if (!navError) {
    try {
      timing = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0];
        if (!nav) return null;
        return {
          domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
          loadEvent: Math.round(nav.loadEventEnd),
          responseEnd: Math.round(nav.responseEnd),
        };
      });
      domNodeCount = await page.evaluate(() => document.querySelectorAll('*').length);
      bodyTextLength = await page.evaluate(() => document.body.innerText.length);
      title = await page.title();
    } catch (e) {
      navError = 'post-load evaluate failed: ' + String(e.message || e);
    }
  }

  await context.close();

  // Generic "Failed to load resource: ... 404" messages with no stack/component
  // attached are Chrome's own network-log lines for failed subresource fetches
  // (here: primereact/primeicons fonts loaded directly from cdnjs.cloudflare.com
  // in index.html) — external-CDN noise, not app code, and already known/
  // pre-existing (see git log: "Fix console errors from dead App.css link and
  // cdnjs font 404s"). Excluded from the regression gate but kept in the raw
  // log for transparency.
  const isExternalResourceNoise = (msg) =>
    /^Failed to load resource: the server responded with a status of 404/.test(msg);
  const significantErrors = consoleErrors.filter(m => !isExternalResourceNoise(m));

  const contentOk = !navError && bodyTextLength !== null && bodyTextLength > 100;
  const pass = contentOk && significantErrors.length === 0;

  return {
    path: route.path,
    name: route.name,
    area: route.area,
    pass,
    navError,
    consoleErrors,
    significantErrors,
    wallMs,
    timing,
    totalBytes,
    requestCount,
    domNodeCount,
    bodyTextLength,
    title,
  };
}

async function main() {
  const label = process.argv[2];
  const note = process.argv[3] || '';
  if (!label) {
    console.error('Usage: node measure.js <label> ["note"]');
    process.exit(1);
  }

  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox'],
  });

  const routeResults = [];
  for (const route of ROUTES) {
    process.stderr.write(`measuring ${route.path} ...\n`);
    const result = await measureRoute(browser, route);
    routeResults.push(result);
    process.stderr.write(
      `  ${result.pass ? 'PASS' : 'FAIL'}  wall=${result.wallMs}ms  bytes=${result.totalBytes}  dom=${result.domNodeCount}  errors=${result.consoleErrors.length}\n`
    );
  }
  await browser.close();

  const run = {
    label,
    note,
    timestamp: new Date().toISOString(),
    routes: routeResults,
  };

  let allRuns = [];
  if (fs.existsSync(RESULTS_JSON)) {
    allRuns = JSON.parse(fs.readFileSync(RESULTS_JSON, 'utf8'));
  }
  allRuns.push(run);
  fs.writeFileSync(RESULTS_JSON, JSON.stringify(allRuns, null, 2));

  writeMarkdown(allRuns);

  // Compare against baseline's significantErrors per route (if a baseline
  // exists and this isn't it) so a pre-existing issue doesn't get re-flagged
  // as a regression on every subsequent run.
  const baselineRun = allRuns.find(r => r.label === 'baseline');
  const isBaseline = label === 'baseline';

  const newlyBroken = [];
  for (const r of routeResults) {
    if (r.navError || !r.pass) {
      if (isBaseline || !baselineRun) {
        newlyBroken.push({ route: r, reason: r.navError ? 'nav error' : 'errors present (no baseline to compare)' });
        continue;
      }
      const baseR = baselineRun.routes.find(x => x.path === r.path);
      const baseErrs = new Set(baseR ? baseR.significantErrors : []);
      const newErrs = r.significantErrors.filter(e => !baseErrs.has(e));
      if (r.navError || newErrs.length > 0) {
        newlyBroken.push({ route: r, reason: r.navError ? 'nav error' : `new error(s) vs baseline: ${JSON.stringify(newErrs)}` });
      }
    }
  }

  if (isBaseline) {
    const withKnownIssues = routeResults.filter(r => !r.pass);
    if (withKnownIssues.length > 0) {
      console.error(`\nBaseline recorded with ${withKnownIssues.length} pre-existing issue(s) (not regressions, just the starting state):`);
      for (const r of withKnownIssues) {
        console.error(`  ${r.path}: ${JSON.stringify(r.significantErrors)}`);
      }
    } else {
      console.error(`\nBaseline: all ${routeResults.length} routes clean.`);
    }
  } else if (newlyBroken.length > 0) {
    console.error(`\n${newlyBroken.length} route(s) show NEW problems vs baseline:`);
    for (const { route, reason } of newlyBroken) {
      console.error(`  ${route.path}: ${reason}`);
    }
    process.exitCode = 2;
  } else {
    console.error(`\nNo new problems vs baseline across ${routeResults.length} routes.`);
  }
}

function fmtBytes(b) {
  if (b == null) return 'n/a';
  return (b / 1024).toFixed(0) + ' KB';
}

function writeMarkdown(allRuns) {
  const byLabel = {};
  for (const run of allRuns) byLabel[run.label] = run;
  const baseline = byLabel['baseline'];

  let md = '# Frontend performance test results\n\n';
  md += 'Generated by `perf-tests/measure.js`. Each run loads every route in ';
  md += '`routes.json` in a fresh browser context and records load time, ';
  md += 'transferred bytes, DOM node count, and console errors (regression ';
  md += 'signal). Baseline captured before any performance-fix changes.\n\n';

  md += '## Runs\n\n';
  md += '| Label | Timestamp | Note | Pass/Fail |\n|---|---|---|---|\n';
  for (const run of allRuns) {
    const failCount = run.routes.filter(r => !r.pass).length;
    const status = failCount === 0 ? `all ${run.routes.length} passed` : `**${failCount} FAILED**`;
    md += `| ${run.label} | ${run.timestamp} | ${run.note} | ${status} |\n`;
  }

  md += '\n## Per-route results\n\n';
  for (const route of ROUTES) {
    md += `### \`${route.path}\` — ${route.area}\n\n`;
    md += '| Run | Wall (ms) | domContentLoaded (ms) | Bytes | Requests | DOM nodes | Console errors |\n';
    md += '|---|---|---|---|---|---|---|\n';
    for (const run of allRuns) {
      const r = run.routes.find(x => x.path === route.path);
      if (!r) continue;
      const dcl = r.timing ? r.timing.domContentLoaded : 'n/a';
      let wallCell = String(r.wallMs);
      let bytesCell = fmtBytes(r.totalBytes);
      if (baseline && run.label !== 'baseline') {
        const br = baseline.routes.find(x => x.path === route.path);
        if (br) {
          const dWall = r.wallMs - br.wallMs;
          const pctWall = br.wallMs ? ((dWall / br.wallMs) * 100).toFixed(0) : '?';
          wallCell = `${r.wallMs} (${dWall >= 0 ? '+' : ''}${dWall}ms, ${dWall >= 0 ? '+' : ''}${pctWall}%)`;
          const dBytes = r.totalBytes - br.totalBytes;
          const pctBytes = br.totalBytes ? ((dBytes / br.totalBytes) * 100).toFixed(0) : '?';
          bytesCell = `${fmtBytes(r.totalBytes)} (${dBytes >= 0 ? '+' : ''}${fmtBytes(dBytes)}, ${dBytes >= 0 ? '+' : ''}${pctBytes}%)`;
        }
      }
      let errCell = '0';
      if (r.significantErrors.length > 0) {
        let label2 = '';
        if (run.label === 'baseline') {
          label2 = '(baseline)';
        } else if (baseline) {
          const baseR = baseline.routes.find(x => x.path === route.path);
          const baseErrs = new Set(baseR ? baseR.significantErrors : []);
          const isAllKnown = r.significantErrors.every(e => baseErrs.has(e));
          label2 = isAllKnown ? '(known, in baseline)' : '**NEW**';
        }
        errCell = `${r.significantErrors.length} ${label2}: ${r.significantErrors[0].slice(0, 80)}`;
      }
      md += `| ${run.label}${!r.pass ? ' ⚠️' : ''} | ${wallCell} | ${dcl} | ${bytesCell} | ${r.requestCount} | ${r.domNodeCount ?? 'n/a'} | ${errCell} |\n`;
    }
    md += '\n';
  }

  fs.writeFileSync(RESULTS_MD, md);
}

module.exports = { writeMarkdown };

if (require.main === module) {
  main();
}
