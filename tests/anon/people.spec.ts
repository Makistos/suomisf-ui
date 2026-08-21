import { test, expect } from '@playwright/test';

test('People page loads and displays data', async ({ page }) => {
    // Navigate to people page
    await page.goto('/people');

    // Check that the page heading exists
    await expect(page.getByRole('heading', { name: /Henkilöluettelo/i })).toBeVisible();

    // Verify that the page has a data table
    const dataTable = page.getByRole('table');
    await expect(dataTable).toBeVisible();

    // Wait for the table to load
    await expect(page.getByRole('progressbar')).not.toBeVisible();

    // Check that the table contains rows
    const tableRows = page.getByRole('row');
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThan(1);

    // Verify essential columns exist
    await expect(page.getByRole('columnheader', { name: 'Nimi' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Synt' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Kuoli' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Kansallisuus' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Teoksia' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Novelleja' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Roolit' })).toBeVisible();

    // Wait for and check total number of people
    await expect(async () => {
        const totalText = await page.getByText(/Henkilöitä yhteensä/).textContent();
        const totalCount = totalText ? parseInt(totalText.match(/\d+/)?.[0] || '0') : 0;
        expect(totalCount).toBeGreaterThan(0);
    }).toPass();

    const totalText = await page.getByText(/Henkilöitä yhteensä/).textContent();
    const totalCount = totalText ? parseInt(totalText.match(/\d+/)?.[0] || '0') : 0;
    expect(totalCount).toBeGreaterThan(6500);
    expect(totalCount).toBeLessThan(10000);

    // Find the specific row by name and verify its contents
    const targetRow = page.getByRole('row').filter({ hasText: 'Aalto, Amanda' });
    await expect(targetRow).toBeVisible();

    // Get all cells from the target row and verify their contents
    const cells = targetRow.getByRole('cell');
    await expect(cells.nth(0)).toHaveText('Aalto, Amanda');
    await expect(cells.nth(1)).toHaveText('1990');
    await expect(cells.nth(3)).toHaveText('Suomi');
    await expect(cells.nth(4)).toHaveText('2');
    await expect(cells.nth(5)).toHaveText('5');
});
