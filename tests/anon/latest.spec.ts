import { test, expect } from '../fixtures/guard';

test('Latest additions page loads with recent works', async ({ page }) => {
    await page.goto('/latest');

    await expect(page.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('heading', { name: 'Viimeisimmät lisäykset' })).toBeVisible();

    // Content here is inherently a moving target (newest works), so just
    // check the list actually has entries rather than specific names.
    // Wait for a second heading rather than reading them once: the
    // progressbar check above passes immediately if loading hasn't started
    // yet, which made this flaky under load.
    await expect(page.locator('h2, h3').nth(1)).toBeVisible({ timeout: 20000 });
});
