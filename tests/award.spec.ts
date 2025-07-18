import { test, expect } from '@playwright/test';

test('Apollo award page loads and displays data', async ({ page }) => {
    // Navigate to specific award page
    await page.goto('/awards/27');

    // Check that the page heading exists
    await expect(page.getByRole('heading', { name: /Apollo/i }))
        .toBeVisible();

    // Wait for table to load and be visible
    await expect(page.getByRole('progressbar')).not.toBeVisible();

    // Wait for table with retry logic
    await expect(async () => {
        const table = page.getByRole('table');
        await expect(table).toBeVisible();
        const rowCount = await page.getByRole('row').count();
        expect(rowCount).toBe(11); // 9 data rows + 2 header rows
    }).toPass();

    // Verify first row content
    const firstRow = page.getByRole('row').nth(2); // 0 is header row
    const cells = firstRow.getByRole('cell');
    await expect(cells.nth(0)).toHaveText('1974');
    await expect(cells.nth(1)).toHaveText('Spinrad, Norman: Rautainen unelma (The Iron Dream)');
});
