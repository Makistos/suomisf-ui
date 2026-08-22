import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    globalSetup: './tests/global-setup.ts',
    globalTeardown: './tests/global-teardown.ts',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    // Uncapped (Playwright's default, one per CPU) was fine for the
    // original mostly-read-only suite, but the admin/ specs are numerous,
    // multi-step and write-heavy - full concurrency there saturates the
    // E2E backend/browser processes together and causes real timeouts, not
    // just slowness. Capped rather than tuning gunicorn's worker count
    // further upward, which just shifted the bottleneck to the machine
    // itself under both scaled up together.
    workers: process.env.CI ? 1 : 8,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:3100',
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
            // password-reset.spec.ts temporarily changes Test User's
            // password, which every other userPage-fixture test depends on
            // being unchanged (they log in via API with a fixed password).
            // It has its own project below, run explicitly with
            // --project=password-reset - kept out of this one and out of
            // `npm run test:e2e` (which pins --project=chromium) so a plain
            // `npx playwright test` with no flags is the only way to hit
            // both at once, and that's on the caller.
            testIgnore: '**/password-reset.spec.ts',
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
            testIgnore: '**/password-reset.spec.ts',
        },
        // {
        //     name: 'webkit',
        //     use: { ...devices['Desktop Safari'] },
        // },
        {
            name: 'password-reset',
            use: { ...devices['Desktop Chrome'] },
            testMatch: '**/password-reset.spec.ts',
        },
    ],
    // No webServer entry: global-setup.ts builds the frontend and starts
    // both it and the E2E backend itself (Playwright doesn't guarantee
    // globalSetup finishes before webServer's command starts, which raced
    // against the build here), and global-teardown.ts stops them.
});
