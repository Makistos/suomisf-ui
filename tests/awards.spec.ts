import { test, expect } from '@playwright/test';

test('Awards page loads and displays data', async ({ page }) => {

    await page.goto('/awards');

    // Check that the page heading exists and wait for it
    await expect(page.getByRole('heading', { name: /Palkinnot/i }))
        .toBeVisible();

});
