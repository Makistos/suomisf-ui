import { test, expect } from '@playwright/test';

test('Book index page loads and an alphabet filter returns results', async ({ page }) => {
    await page.goto('/bookindex');

    await expect(page.getByRole('heading', { name: 'Kirjatietokanta' })).toBeVisible();

    await page.getByRole('button', { name: 'V', exact: true }).click();
    await expect(page.getByText('Vahtokari')).toBeVisible({ timeout: 20000 });
});
