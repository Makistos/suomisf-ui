import { test, expect } from '../fixtures/guard';

test('work change history lists changes and expands an update', async ({ page }) => {
    // "Hevosten laakso", which has both "Uusi" and "Päivitys" entries
    await page.goto('/works/3');
    await page.getByRole('tab', { name: 'Muutoshistoria' }).click();

    const panel = page.getByRole('tabpanel');
    const rows = panel.locator('tbody > tr');
    await expect(rows.first()).toBeVisible({ timeout: 20000 });
    await expect(panel.getByRole('columnheader', { name: 'Muokkaaja' })).toBeVisible();
    await expect(panel.getByRole('cell', { name: 'Uusi' }).first()).toBeVisible();

    // Only updates expand, into the changed fields and their old values.
    const update = rows.filter({ hasText: 'Päivitys' }).first();
    await update.locator('.p-row-toggler').click();
    await expect(panel.getByRole('columnheader', { name: 'Vanha arvo' })).toBeVisible();
    // Deleting log entries is for admins only.
    await expect(panel.getByRole('columnheader', { name: 'Poista' })).toHaveCount(0);
});
