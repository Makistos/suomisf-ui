#!/usr/bin/env node
/**
 * Parses `npm run build` output (captured via
 * `npm run build > perf-tests/build-<label>.txt 2>&1`) and appends the
 * chunk-size numbers to results.json / RESULTS.md under the matching run
 * label, produced by measure.cjs. Run measure.cjs for that label first.
 *
 * Usage: node perf-tests/record-build.cjs <label> <path-to-build-log>
 */
const fs = require('fs');
const path = require('path');

const RESULTS_JSON = path.join(__dirname, 'results.json');
const RESULTS_MD = path.join(__dirname, 'RESULTS.md');

const label = process.argv[2];
const logPath = process.argv[3];
if (!label || !logPath) {
  console.error('Usage: node record-build.cjs <label> <path-to-build-log>');
  process.exit(1);
}

const text = fs.readFileSync(logPath, 'utf8');
// Match lines like: build/assets/index-pzqi7XhV.js   2,582.35 kB │ gzip: 712.28 kB
const lineRe = /build\/assets\/(\S+\.js)\s+([\d,.]+)\s*kB(?:\s*│\s*gzip:\s*([\d,.]+)\s*kB)?/g;
const chunks = [];
let m;
while ((m = lineRe.exec(text)) !== null) {
  chunks.push({
    file: m[1],
    kb: parseFloat(m[2].replace(/,/g, '')),
    gzipKb: m[3] ? parseFloat(m[3].replace(/,/g, '')) : null,
  });
}
chunks.sort((a, b) => b.kb - a.kb);
const mainChunk = chunks.find(c => c.file.startsWith('index-')) || chunks[0];
const totalJsKb = chunks.reduce((sum, c) => sum + c.kb, 0);
const totalGzipKb = chunks.reduce((sum, c) => sum + (c.gzipKb || 0), 0);
const hasSizeWarning = /larger than 500 ?kB/.test(text);

if (!fs.existsSync(RESULTS_JSON)) {
  console.error('results.json not found — run measure.cjs first.');
  process.exit(1);
}
const allRuns = JSON.parse(fs.readFileSync(RESULTS_JSON, 'utf8'));
const run = allRuns.find(r => r.label === label);
if (!run) {
  console.error(`No run with label "${label}" found in results.json — run measure.cjs ${label} first.`);
  process.exit(1);
}
run.buildMetrics = {
  mainChunkFile: mainChunk.file,
  mainChunkKb: mainChunk.kb,
  mainChunkGzipKb: mainChunk.gzipKb,
  allChunks: chunks,
  totalJsKb: Math.round(totalJsKb),
  totalGzipKb: Math.round(totalGzipKb),
  hasSizeWarning,
};
fs.writeFileSync(RESULTS_JSON, JSON.stringify(allRuns, null, 2));

console.error(`Recorded build metrics for "${label}": main chunk ${mainChunk.kb} kB (gzip ${mainChunk.gzipKb} kB), ${chunks.length} JS chunks, total ${Math.round(totalJsKb)} kB (gzip ${Math.round(totalGzipKb)} kB)${hasSizeWarning ? ', size warning present' : ''}.`);

// Re-render the "Production build" section in RESULTS.md.
let md = fs.existsSync(RESULTS_MD) ? fs.readFileSync(RESULTS_MD, 'utf8') : '';
const marker = '## Production build size (npm run build)\n';
const idx = md.indexOf(marker);
if (idx !== -1) {
  md = md.slice(0, idx);
}

const baselineRun = allRuns.find(r => r.label === 'baseline');
let section = marker + '\n';
section += '| Run | Main chunk | Main chunk (gzip) | Total JS | Total JS (gzip) | Size warning? |\n';
section += '|---|---|---|---|---|---|\n';
for (const r of allRuns) {
  if (!r.buildMetrics) continue;
  const bm = r.buildMetrics;
  let mainCell = `${bm.mainChunkKb} kB`;
  let gzipCell = `${bm.mainChunkGzipKb} kB`;
  if (baselineRun && baselineRun.buildMetrics && r.label !== 'baseline') {
    const bbm = baselineRun.buildMetrics;
    const d = bm.mainChunkKb - bbm.mainChunkKb;
    const pct = bbm.mainChunkKb ? ((d / bbm.mainChunkKb) * 100).toFixed(0) : '?';
    mainCell += ` (${d >= 0 ? '+' : ''}${d.toFixed(0)}kB, ${d >= 0 ? '+' : ''}${pct}%)`;
    const dg = bm.mainChunkGzipKb - bbm.mainChunkGzipKb;
    const pctg = bbm.mainChunkGzipKb ? ((dg / bbm.mainChunkGzipKb) * 100).toFixed(0) : '?';
    gzipCell += ` (${dg >= 0 ? '+' : ''}${dg.toFixed(0)}kB, ${dg >= 0 ? '+' : ''}${pctg}%)`;
  }
  section += `| ${r.label} | ${mainCell} | ${gzipCell} | ${bm.totalJsKb} kB | ${bm.totalGzipKb} kB | ${bm.hasSizeWarning ? 'yes' : 'no'} |\n`;
}
section += '\n';

fs.writeFileSync(RESULTS_MD, md + section);
