import { test, expect } from '@playwright/test';

test('Short story page loads with all contributors listed', async ({ page }) => {
    await page.goto('/shorts/4985');

    await expect(page.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });

    await expect(page.getByRole('heading', { name: 'John Ajvide Lindqvist' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Kylä kukkulalla' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Genret' })).toBeVisible();

    // This short has 20 contributors (translators) - exercises the
    // deduplication/sort in remove-duplicate-contributions.ts
    await expect(page.getByText('Saila Korpi')).toBeVisible();
    await expect(page.getByText('Liisa Uusitalo')).toBeVisible();
});
