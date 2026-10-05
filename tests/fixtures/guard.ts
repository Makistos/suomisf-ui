import { test as base, expect, Page } from '@playwright/test';
import { recordCoverage } from './coverage';

// Same API request this many times within the window = treated as a
// refetch/render loop. Real loops fire dozens of requests per second;
// normal pages repeat a request a handful of times at most (refetch after
// a save, StrictMode double effects).
const LOOP_LIMIT = 15;
const LOOP_WINDOW_MS = 5000;

/**
 * Watches a page for problems that individual specs don't check for:
 * uncaught errors (including unhandled promise rejections), React's
 * "Maximum update depth exceeded", and request loops caused by effects
 * re-running endlessly. Returns a function that asserts none happened.
 */
export function guardPage(page: Page): () => void {
    const problems: string[] = [];
    const recent = new Map<string, number[]>();

    page.on('pageerror', (error) => problems.push(`Uncaught error: ${error.message}`));
    page.on('console', (msg) => {
        if (msg.type() === 'error' && msg.text().includes('Maximum update depth exceeded')) {
            problems.push(`React render loop: ${msg.text().slice(0, 200)}`);
        }
    });
    page.on('request', (request) => {
        if (!request.url().includes('/api/')) return;
        // Body included: one POST URL can serve different queries.
        const key = `${request.method()} ${request.url()} ${request.postData() ?? ''}`;
        const now = Date.now();
        const times = (recent.get(key) ?? []).filter(t => now - t < LOOP_WINDOW_MS);
        times.push(now);
        recent.set(key, times);
        if (times.length === LOOP_LIMIT) {
            problems.push(`Request loop: ${key.slice(0, 200)} sent ${LOOP_LIMIT} times within ${LOOP_WINDOW_MS / 1000}s`);
        }
    });

    return () => expect(problems, 'page health problems').toEqual([]);
}

/** Playwright's test with the default `page` guarded by guardPage(). */
export const test = base.extend<{ page: Page }>({
    page: async ({ page }, use) => {
        const check = guardPage(page);
        const saveCoverage = await recordCoverage(page);
        await use(page);
        await saveCoverage();
        check();
    },
});

export { expect };
export type { Page } from '@playwright/test';
