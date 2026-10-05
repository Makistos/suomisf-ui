import type { Page } from '@playwright/test';
import { CoverageReport, type CoverageReportOptions } from 'monocart-coverage-reports';

export const coverageEnabled = !!process.env.E2E_COVERAGE;

export const coverageOptions: CoverageReportOptions = {
    name: 'SuomiSF frontend coverage (E2E)',
    outputDir: './coverage/e2e',
    // Files no test loads are listed too, as 0 %.
    all: {
        dir: ['./src'],
        filter: { '**/*.test.*': false, '**/*.d.ts': false, '**/*.{ts,tsx}': true },
    },
    reports: [['html'], ['console-summary', { metrics: ['lines', 'functions', 'branches'] }], ['json-summary']],
};

type CoverageWindow = Window & {
    __coverage__?: unknown;
    __e2eSaveCoverage?: (json: string) => void;
};

/**
 * Collects the Istanbul counters (window.__coverage__) that the coverage
 * build (`npm run test:e2e:coverage`, see vite.config.ts) puts in the page.
 * Each document has its own counters and they vanish with it, so they are
 * handed over on every beforeunload (reloads, full navigations, history
 * steps across documents) and once more when the test ends. The hand-over
 * is a raw CDP binding: Playwright's exposeFunction drops calls from a
 * document that is being unloaded, and Chromium drops binding calls made
 * in pagehide/unload. Chromium only. Returns the function that adds the
 * counters to the report; a no-op when coverage is off.
 */
export async function recordCoverage(page: Page) {
    if (!coverageEnabled || page.context().browser()?.browserType().name() !== 'chromium') {
        return async () => {};
    }
    const snapshots: unknown[] = [];
    const cdp = await page.context().newCDPSession(page);
    cdp.on('Runtime.bindingCalled', (event) => {
        if (event.name === '__e2eSaveCoverage') snapshots.push(JSON.parse(event.payload));
    });
    await cdp.send('Runtime.enable');
    await cdp.send('Runtime.addBinding', { name: '__e2eSaveCoverage' });
    await page.addInitScript(() => {
        window.addEventListener('beforeunload', () => {
            const w = window as CoverageWindow;
            if (w.__coverage__) w.__e2eSaveCoverage?.(JSON.stringify(w.__coverage__));
        });
    });
    return async () => {
        const last = await page.evaluate(() => (window as CoverageWindow).__coverage__)
            .catch(() => undefined);
        if (last) snapshots.push(last);
        const report = new CoverageReport(coverageOptions);
        for (const snapshot of snapshots) await report.add(snapshot as never);
    };
}
