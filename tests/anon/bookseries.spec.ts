import { test, expect } from '@playwright/test';

test('Book series page loads and displays data', async ({ page }) => {
    // Navigate to book series page
    await page.goto('/bookseries');

    // Check that the page heading exists
    await expect(page.getByRole('heading', { name: /Kirjasarjat/i })).toBeVisible();

    // Verify that the page has a data table
    const dataTable = page.getByRole('table');
    await expect(dataTable).toBeVisible();

    // Wait for the table to load
    await expect(page.getByRole('progressbar')).not.toBeVisible();

    // Debug: Log all column headers
    // const headers = await page.getByRole('columnheader').all();
    // console.log('All headers:', await Promise.all(headers.map(h => h.textContent())));

    // Verify essential columns exist using first() to handle multiple matches
    await expect(page.getByRole('columnheader', { name: /Nimi/i }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Alkup\. nimi/i }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Kirjoittaja/i }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Teoksia/i }).first()).toBeVisible();

    // Wait for and check total number of series
    await expect(async () => {
        const totalText = await page.getByText(/Kirjasarjoja yhteensä/).textContent();
        const totalCount = totalText ? parseInt(totalText.match(/\d+/)?.[0] || '0') : 0;
        expect(totalCount).toBeGreaterThan(0);
    }).toPass();

    const totalText = await page.getByText(/Kirjasarjoja yhteensä/).textContent();
    const totalCount = totalText ? parseInt(totalText.match(/\d+/)?.[0] || '0') : 0;
    expect(totalCount).toBeGreaterThan(730);
    expect(totalCount).toBeLessThan(1000);

    // Find the specific row by name and verify its contents
    const targetRow = page.getByRole('row').filter({ hasText: 'Aavekaksoset-sarja' });
    await expect(targetRow).toBeVisible();

    // Get all cells from the target row and verify their contents
    const cells = targetRow.getByRole('cell');
    await expect(cells.nth(0)).toHaveText('Aavekaksoset-sarja');
    await expect(cells.nth(1)).toHaveText('Ghost Twins');
    await expect(cells.nth(2)).toHaveText('Regan, Dian Curtis');
    await expect(cells.nth(3)).toHaveText('8');
});
