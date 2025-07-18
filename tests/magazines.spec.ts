import { test, expect } from '@playwright/test';

test('Magazines page loads and displays content', async ({ page }) => {
    // Navigate to magazines page
    await page.goto('/magazines');

    // Check that the page heading exists
    await expect(page.getByRole('heading', { name: 'Lehdet' }))
        .toBeVisible({ timeout: 20000 });

    // Wait for loading to complete
    await expect(page.getByRole('progressbar')).not.toBeVisible({ timeout: 60000 });

    // Check specific magazine links exist
    await expect(page.getByRole('link', { name: 'Alienisti' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Legolas' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Usva' })).toBeVisible();
});
