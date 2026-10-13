import { test, expect } from '../fixtures/guard';

test('Stats page renders every tab without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/stats');
    await expect(page.getByRole('heading', { name: 'Tilastoja' })).toBeVisible();
    // Overview: headline tiles, no chart.
    await expect(page.getByText('Teoksia', { exact: true })).toBeVisible({ timeout: 20000 });

    for (const tabName of ['Julkaisut ajassa', 'Sisältö', 'Henkilöt', 'Kustantajat', 'Novellit', 'Lehdet']) {
        await page.getByRole('tab', { name: tabName }).click();
        await expect(page.locator('.p-tabview-panel canvas').first()).toBeVisible({ timeout: 20000 });
    }

    expect(errors).toEqual([]);
});

test('the open tab is kept in the URL', async ({ page }) => {
    await page.goto('/stats?tab=lehdet');
    await expect(page.getByRole('tab', { name: 'Lehdet', selected: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Lehdet vuosittain' })).toBeVisible({ timeout: 20000 });

    await page.getByRole('tab', { name: 'Kustantajat' }).click();
    await expect(page).toHaveURL(/tab=kustantajat/);
});

test('admin-only tabs are hidden from visitors', async ({ page }) => {
    await page.goto('/stats');
    await expect(page.getByRole('tab', { name: 'Yleiskatsaus' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Kävijät' })).toHaveCount(0);
    await expect(page.getByRole('tab', { name: 'Käynnit' })).toHaveCount(0);
});
