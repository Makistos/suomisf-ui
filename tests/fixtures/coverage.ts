import fs from 'fs';
import path from 'path';
import type { Page } from '@playwright/test';
import { CoverageReport, type CoverageReportOptions } from 'monocart-coverage-reports';

/**
 * Frontend coverage from the E2E run (Chromium only).
 *
 * `npm run test:e2e:coverage` sets E2E_COVERAGE=1: the E2E build then has
 * source maps, each test page records which JavaScript ran, and
 * global-teardown writes the report to coverage/e2e/ (index.html, plus a
 * per-file summary on the console). Normal E2E runs are unaffected.
 */
export const coverageEnabled = !!process.env.E2E_COVERAGE;

// Tests run from the repository root (playwright.config.ts lives there).
const BUILD_DIR = path.resolve(process.cwd(), 'build-e2e');

export const coverageOptions: CoverageReportOptions = {
    name: 'SuomiSF frontend coverage (E2E)',
    outputDir: './coverage/e2e',
    // Only our own bundle, then only our own sources from its source maps.
    entryFilter: (entry) => entry.url.includes('/assets/') && entry.url.endsWith('.js'),
    // Mapped paths come out relative to src/ ("App.tsx", "components/...").
    sourceFilter: (sourcePath) => !sourcePath.includes('node_modules')
        && !sourcePath.startsWith('\0') && !sourcePath.includes('vite/'),
    sourcePath: (sourcePath) => `src/${sourcePath}`,
    reports: [['v8'], ['console-summary', { metrics: ['lines', 'functions'] }], ['json-summary']],
};

/** Start recording on a page; the returned function stores the result. */
export async function recordCoverage(page: Page): Promise<() => Promise<void>> {
    if (!coverageEnabled || page.context().browser()?.browserType().name() !== 'chromium') {
        return async () => {};
    }
    await page.coverage.startJSCoverage({ resetOnNavigation: false });
    return async () => {
        const coverage = await page.coverage.stopJSCoverage();
        // Attach each bundle's source map from the build folder rather than
        // relying on the report tool to fetch it from the preview server.
        const withMaps = coverage.map((entry) => {
            const mapFile = path.join(BUILD_DIR, new URL(entry.url).pathname + '.map');
            return fs.existsSync(mapFile)
                ? { ...entry, sourceMap: JSON.parse(fs.readFileSync(mapFile, 'utf8')) }
                : entry;
        });
        await new CoverageReport(coverageOptions).add(withMaps);
    };
}
