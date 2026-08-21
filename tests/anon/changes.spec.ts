import { test, expect } from '@playwright/test';

test('Changes page loads and displays data', async ({ page }) => {
    // Navigate to changes page
    await page.goto('/changes');

    // Check that the page heading exists
    await expect(page.getByRole('heading', { name: /muutokset/i })).toBeVisible();

    // Verify that the page has a data table
    const dataTable = page.getByRole('table');
    await expect(dataTable).toBeVisible();

    // Wait for the table to load (spinner to disappear)
    await expect(page.getByRole('progressbar')).not.toBeVisible();

    // Check that the table contains rows
    const tableRows = page.getByRole('row');
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThan(1); // At least header row + one data row

    // Verify column headers exist
    await expect(page.getByRole('columnheader', { name: 'Nimi' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Taulu' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Muutettu' })).toBeVisible();
});
