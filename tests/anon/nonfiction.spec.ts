import { test, expect } from '@playwright/test';

test('Nonfiction works list loads, and Kannet view lazy-loads cover images', async ({ page }) => {
    await page.goto('/nonfiction');

    await expect(page.getByRole('heading', { name: 'Tietokirjat' })).toBeVisible();
    await expect(page.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });

    // Default "Lista" view shows author/work entries
    await expect(page.getByText('Khairat Al-Saleh')).toBeVisible();

    // Switch to "Kannet" (cover-image-list.tsx) - this is the view that
    // exercises lazy-loaded cover images (see perf-tests findings)
    await page.getByText('Kannet', { exact: true }).click();
    const lazyImages = page.locator('img[loading="lazy"]');
    await expect(async () => {
        expect(await lazyImages.count()).toBeGreaterThan(0);
    }).toPass();
});
