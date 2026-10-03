#!/usr/bin/env node
/**
 * Network-level measurement of a deployed site (production by default).
 *
 * Usage:
 *   node perf-tests/network.cjs <label> ["free-text note"]
 *   PERF_BASE_URL=https://example.org PERF_RUNS=3 node perf-tests/network.cjs ...
 *
 * Unlike measure.cjs (dev server, regression gate), this measures what a
 * visitor's browser actually downloads, so it shows server-side changes such
 * as response compression. For each route in routes.json, under two network
 * profiles (the machine's own connection, and a throttled phone profile), it
 * loads the page PERF_RUNS times in a fresh context and keeps the median of:
 *   - time until the network is idle, and Largest Contentful Paint
 *   - bytes on the wire (encoded body size), API responses separately
 *   - API bytes after decoding, and whether API responses were compressed
 *   - the slowest API request (start to last byte)
 *
 * The app's pageview beacon (POST /api/p) is blocked so measurement runs
 * don't show up in the visitor analytics. Results append to
 * network-results.json and NETWORK.md is regenerated, with deltas against
 * the first run.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = (process.env.PERF_BASE_URL || 'https://www.sf-bibliografia.fi').replace(/\/$/, '');
const RUNS = parseInt(process.env.PERF_RUNS || '3', 10);
const ROUTES = JSON.parse(fs.readFileSync(path.join(__dirname, 'routes.json'), 'utf8'));
const RESULTS_JSON = path.join(__dirname, 'network-results.json');
const RESULTS_MD = path.join(__dirname, 'NETWORK.md');

const PROFILES = [
  { name: 'own-connection', throttle: null },
  // Roughly a mid-range phone on a weak 4G signal.
  { name: 'slow-phone', throttle: { latency: 150, down: 1.6e6 / 8, up: 750e3 / 8, cpu: 4 } },
];

const isApi = url => /\/api\//.test(url);
const median = xs => {
  const s = xs.filter(x => x !== null && x !== undefined).sort((a, b) => a - b);
  return s.length ? s[Math.floor((s.length - 1) / 2)] : null;
};

async function loadOnce(browser, route, profile) {
  const context = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
  const page = await context.newPage();
  await page.route(/\/api\/p$/, r => r.abort());
  if (profile.throttle) {
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: profile.throttle.latency,
      downloadThroughput: profile.throttle.down,
      uploadThroughput: profile.throttle.up,
    });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: profile.throttle.cpu });
  }
  await page.addInitScript(() => {
    window.__lcp = null;
    new PerformanceObserver(list => {
      const entries = list.getEntries();
      window.__lcp = entries[entries.length - 1].startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  });

  const done = [];
  page.on('requestfinished', req => done.push(req));

  const t0 = Date.now();
  let error = null;
  try {
    await page.goto(BASE_URL + route.path, { waitUntil: 'networkidle', timeout: 120000 });
  } catch (e) {
    error = String(e.message || e).split('\n')[0];
  }
  const idleMs = Date.now() - t0;
  const lcp = error ? null : await page.evaluate(() => window.__lcp).catch(() => null);

  let wireBytes = 0, apiWireBytes = 0, apiBodyBytes = 0, apiCount = 0, apiCompressed = 0;
  let slowestApiMs = 0, slowestApi = null;
  for (const req of done) {
    const sizes = await req.sizes().catch(() => null);
    if (!sizes) continue;
    wireBytes += sizes.responseBodySize + sizes.responseHeadersSize;
    if (!isApi(req.url())) continue;
    const res = await req.response();
    apiCount++;
    apiWireBytes += sizes.responseBodySize + sizes.responseHeadersSize;
    const body = await res.body().catch(() => null);
    if (body) apiBodyBytes += body.length;
    const enc = (await res.allHeaders())['content-encoding'];
    if (enc && enc !== 'identity') apiCompressed++;
    const t = req.timing();
    if (t.responseEnd > slowestApiMs) {
      slowestApiMs = t.responseEnd;
      slowestApi = req.url().replace(/^https?:\/\/[^/]+/, '');
    }
  }
  await context.close();
  return {
    error, idleMs, lcp: lcp === null ? null : Math.round(lcp),
    wireBytes, apiWireBytes, apiBodyBytes, apiCount, apiCompressed,
    slowestApiMs: Math.round(slowestApiMs), slowestApi,
  };
}

async function main() {
  const label = process.argv[2];
  const note = process.argv[3] || '';
  if (!label) {
    console.error('usage: node perf-tests/network.cjs <label> ["note"]');
    process.exit(2);
  }
  const browser = await chromium.launch();
  const run = { label, note, baseUrl: BASE_URL, runs: RUNS, timestamp: new Date().toISOString(), profiles: {} };
  for (const profile of PROFILES) {
    run.profiles[profile.name] = [];
    for (const route of ROUTES) {
      const samples = [];
      for (let i = 0; i < RUNS; i++) samples.push(await loadOnce(browser, route, profile));
      const ok = samples.filter(s => !s.error);
      const slowest = ok.reduce((a, s) => (s.slowestApiMs > (a?.slowestApiMs ?? -1) ? s : a), null);
      const r = {
        path: route.path,
        errors: samples.filter(s => s.error).map(s => s.error),
        idleMs: median(ok.map(s => s.idleMs)),
        lcp: median(ok.map(s => s.lcp)),
        wireBytes: median(ok.map(s => s.wireBytes)),
        apiWireBytes: median(ok.map(s => s.apiWireBytes)),
        apiBodyBytes: median(ok.map(s => s.apiBodyBytes)),
        apiCount: median(ok.map(s => s.apiCount)),
        apiCompressed: median(ok.map(s => s.apiCompressed)),
        slowestApiMs: median(ok.map(s => s.slowestApiMs)),
        slowestApi: slowest?.slowestApi ?? null,
      };
      run.profiles[profile.name].push(r);
      console.log(`${profile.name.padEnd(15)} ${route.path.padEnd(18)} idle ${r.idleMs}ms  lcp ${r.lcp}ms  ` +
        `wire ${kb(r.wireBytes)}  api ${kb(r.apiWireBytes)} (decoded ${kb(r.apiBodyBytes)}, ` +
        `${r.apiCompressed}/${r.apiCount} compressed)  slowest api ${r.slowestApiMs}ms ${r.slowestApi ?? ''}` +
        (r.errors.length ? `  ERRORS: ${r.errors.length}` : ''));
    }
  }
  await browser.close();

  const all = fs.existsSync(RESULTS_JSON) ? JSON.parse(fs.readFileSync(RESULTS_JSON, 'utf8')) : [];
  all.push(run);
  fs.writeFileSync(RESULTS_JSON, JSON.stringify(all, null, 2) + '\n');
  fs.writeFileSync(RESULTS_MD, render(all));
  console.log(`\nWrote ${path.relative(process.cwd(), RESULTS_MD)}`);
}

const kb = b => (b === null ? '-' : `${Math.round(b / 1024)} KB`);
const delta = (v, base, fmt) => {
  if (v === null || base === null || base === undefined || v === base) return fmt(v);
  const pct = Math.round(((v - base) / base) * 100);
  return `${fmt(v)} (${pct > 0 ? '+' : ''}${pct}%)`;
};
const ms = v => (v === null ? '-' : `${v} ms`);

function render(all) {
  const first = all[0];
  let md = '# Network measurements\n\n';
  md += 'Generated by `perf-tests/network.cjs`. Each value is the median of the run count shown, each load in a ' +
    'fresh browser context (empty cache). "Wire" is bytes actually transferred (compressed size when compressed); ' +
    '"API decoded" is the JSON size after decompression. Deltas are against the first run. The pageview beacon is ' +
    'blocked during measurement.\n\n';
  md += '| Label | Timestamp | Site | Runs | Note |\n|---|---|---|---|---|\n';
  for (const r of all) md += `| ${r.label} | ${r.timestamp} | ${r.baseUrl} | ${r.runs} | ${r.note} |\n`;
  for (const profile of PROFILES) {
    md += `\n## Profile: ${profile.name}` +
      (profile.throttle ? ` (latency ${profile.throttle.latency} ms, ${(profile.throttle.down * 8 / 1e6).toFixed(1)} Mbps down, ${profile.throttle.cpu}x CPU)` : ' (no throttling)') + '\n';
    for (const route of ROUTES) {
      const base = first.profiles[profile.name]?.find(x => x.path === route.path);
      md += `\n### \`${route.path}\`\n\n| Run | Network idle | LCP | Wire total | API wire | API decoded | API compressed | Slowest API |\n|---|---|---|---|---|---|---|---|\n`;
      for (const r of all) {
        const x = r.profiles[profile.name]?.find(y => y.path === route.path);
        if (!x) continue;
        md += `| ${r.label} | ${delta(x.idleMs, base?.idleMs, ms)} | ${delta(x.lcp, base?.lcp, ms)} | ` +
          `${delta(x.wireBytes, base?.wireBytes, kb)} | ${delta(x.apiWireBytes, base?.apiWireBytes, kb)} | ` +
          `${kb(x.apiBodyBytes)} | ${x.apiCompressed}/${x.apiCount} | ${ms(x.slowestApiMs)} \`${x.slowestApi ?? ''}\`` +
          `${x.errors.length ? ` ⚠ ${x.errors.length} failed` : ''} |\n`;
      }
    }
  }
  return md;
}

main().catch(e => { console.error(e); process.exit(1); });
