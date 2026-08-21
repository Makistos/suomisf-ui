import { test, expect } from '@playwright/test';

test('Stats page renders charts across tabs without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/stats');

    await expect(page.getByRole('heading', { name: 'Tilastoja' })).toBeVisible();
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 20000 });

    for (const tabName of ['Teokset', 'Kustantajat', 'Lehdet', 'Novellit', 'Genret']) {
        await page.getByRole('tab', { name: tabName }).click();
        await expect(page.locator('canvas').first()).toBeVisible();
    }

    expect(errors).toEqual([]);
});
