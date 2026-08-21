import { test, expect } from '@playwright/test';

test('Tag page loads with description and linked works', async ({ page }) => {
    await page.goto('/tags/521');

    await expect(page.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });

    await expect(page.getByRole('heading', { name: 'dystopia' })).toBeVisible();
    await expect(page.getByText('Alagenre')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Teoksia' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Novelleja' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Artikkeleita' })).toBeVisible();

    // A large tag (300+ works) - regression coverage for rendering many rows
    await expect(page.getByRole('heading', { name: 'Stephen King' })).toBeVisible();
});
