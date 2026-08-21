import { test, expect } from '@playwright/test';

test('Latest additions page loads with recent works', async ({ page }) => {
    await page.goto('/latest');

    await expect(page.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('heading', { name: 'Viimeisimmät lisäykset' })).toBeVisible();

    // Content here is inherently a moving target (newest works), so just
    // check the list actually has entries rather than specific names.
    const headings = await page.locator('h2, h3').allTextContents();
    expect(headings.length).toBeGreaterThan(1);
});
