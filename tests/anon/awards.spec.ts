import { test, expect } from '@playwright/test';

test('Awards page loads and displays data', async ({ page }) => {

    await page.goto('/awards');

    // Check that the page heading exists and wait for it. Not "exact" -
    // "Kotimaiset palkinnot" / "Ulkomaiset palkinnot" also match /Palkinnot/i
    // and load asynchronously, so this needs to target the h1 specifically
    // rather than any heading whose text contains the word.
    await expect(page.getByRole('heading', { name: 'Palkinnot', exact: true }))
        .toBeVisible();

});
