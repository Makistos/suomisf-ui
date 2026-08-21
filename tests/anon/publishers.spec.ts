import { test, expect } from '@playwright/test';

test('Publishers page loads and displays data', async ({ page }) => {
    // Navigate to publishers page
    await page.goto('/publishers');

    // Check that the page heading exists
    await expect(page.getByRole('heading', { name: /Kustantajat/i })).toBeVisible();

    // Verify that the page has a data table
    const dataTable = page.getByRole('table');
    await expect(dataTable).toBeVisible();

    // Wait for the table to load
    await expect(page.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });

    // Verify essential columns exist
    await expect(page.getByRole('columnheader', { name: 'Nimi' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Julkaisuja' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Vanhin julkaisu' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Uusin julkaisu' })).toBeVisible();

    // Wait for and check total number of publishers
    await expect(async () => {
        const totalText = await page.getByText(/Kustantajia yhteensä/).textContent();
        const totalCount = totalText ? parseInt(totalText.match(/\d+/)?.[0] || '0') : 0;
        expect(totalCount).toBeGreaterThan(0);
    }).toPass();

    const totalText = await page.getByText(/Kustantajia yhteensä/).textContent();
    const totalCount = totalText ? parseInt(totalText.match(/\d+/)?.[0] || '0') : 0;
    expect(totalCount).toBeGreaterThan(470);
    expect(totalCount).toBeLessThan(670);

    // Find Ajanviete row and verify its contents
    const targetRow = page.getByRole('row').filter({ hasText: 'Ajanviete' });
    await expect(targetRow).toBeVisible();

    // Get all cells from the target row and verify their contents
    const cells = targetRow.getByRole('cell');
    await expect(cells.nth(0)).toHaveText('Ajanviete');
    await expect(cells.nth(1)).toHaveText('10');
    await expect(cells.nth(2)).toHaveText('1957');
    await expect(cells.nth(3)).toHaveText('1965');
});
