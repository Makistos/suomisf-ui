import { test, expect } from '@playwright/test';

test('Short story index page loads and an author search returns results', async ({ page }) => {
    await page.goto('/shortstoryindex');

    await expect(page.getByRole('heading', { name: 'Novellitietokanta' })).toBeVisible();

    await page.locator('#author').fill('Lindqvist');
    await page.getByRole('button', { name: 'Hae' }).click();

    await expect(page.getByText('John Ajvide Lindqvist')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Kylä kukkulalla')).toBeVisible();
});
