import { test, expect } from '@playwright/test';

test('Work page loads and displays content, including part_of relations', async ({ page }) => {
    await page.goto('/works/63');

    await expect(page.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });

    await expect(page.getByRole('heading', { name: 'Jules Verne' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Etelän tähti' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Genret' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Asiasanat' })).toBeVisible();

    // This work is part of an omnibus edition - exercises the part_of sort
    // fixed earlier this project (work-details.tsx)
    await expect(page.getByText('Myös teoksessa:')).toBeVisible();
    await expect(page.getByRole('link', { name: /Merkilliset matkat/ })).toBeVisible();
});
