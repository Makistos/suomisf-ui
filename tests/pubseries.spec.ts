import { test, expect } from '@playwright/test';

test('Publisher series page loads and displays data', async ({ page }) => {
    // Navigate to publisher series page with longer timeout
    await page.goto('/pubseries', { waitUntil: 'domcontentloaded', timeout: 30000 });
    // await expect(page).toHaveURL(/.*\/pubseries/);

    // Check that the page heading exists and wait for it
    await expect(page.getByRole('heading', { name: /Kustantajien sarjat/i }))
        .toBeVisible({ timeout: 10000 });

    await expect(page.getByRole('progressbar')).not.toBeVisible({ timeout: 30000 });

    // Wait for table with retry logic
    await expect(async () => {
        const table = page.getByRole('table');
        await expect(table).toBeVisible({ timeout: 10000 });
        const rowCount = await page.getByRole('row').count();
        expect(rowCount).toBeGreaterThan(1);
    }).toPass({ timeout: 30000 });

    // Verify essential columns exist using first() to handle multiple matches
    await expect(page.getByRole('columnheader', { name: /Nimi/i }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Kustantaja/i }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Kirjoja/i }).first()).toBeVisible();

    // Wait for and check total number of series
    await expect(async () => {
        const totalText = await page.getByText(/Sarjoja yhteensä/).textContent();
        const totalCount = totalText ? parseInt(totalText.match(/\d+/)?.[0] || '0') : 0;
        expect(totalCount).toBeGreaterThan(0);
    }).toPass();

    const totalText = await page.getByText(/Sarjoja yhteensä/).textContent();
    const totalCount = totalText ? parseInt(totalText.match(/\d+/)?.[0] || '0') : 0;
    expect(totalCount).toBeGreaterThan(270);
    expect(totalCount).toBeLessThan(500);

    // Find the specific row by name and verify its contents
    const targetRow = page.getByRole('row').filter({ hasText: 'Action-sarja' });
    await expect(targetRow).toBeVisible();

    // Get all cells from the target row and verify their contents
    const cells = targetRow.getByRole('cell');
    await expect(cells.nth(0)).toHaveText('Action-sarja');
    await expect(cells.nth(1)).toHaveText('Viihdeviikarit');
    await expect(cells.nth(2)).toHaveText('6');
});
