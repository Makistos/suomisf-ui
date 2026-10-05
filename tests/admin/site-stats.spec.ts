import { test, expect } from '../fixtures/auth';

// The admin-only tabs of /stats, on the page views copied from the dev
// database.
test('admin sees visitor charts and can filter the page view log', async ({ adminPage }) => {
    await adminPage.goto('/stats');

    await adminPage.getByRole('tab', { name: 'Kävijät' }).click();
    await expect(adminPage.getByRole('heading', { name: 'Kävijät päivittäin' })).toBeVisible({ timeout: 20000 });
    await expect(adminPage.getByRole('heading', { name: 'Selaimet (90 pv)' })).toBeVisible({ timeout: 20000 });

    await adminPage.getByRole('tab', { name: 'Käynnit' }).click();
    const panel = adminPage.getByRole('tabpanel');
    const rows = panel.locator('tbody > tr');
    await expect(rows.first()).toBeVisible({ timeout: 20000 });

    // Column order: Aika, IP, Sivu, ... ; the filter row has one input per
    // filterable column.
    await panel.getByPlaceholder('Suodata…').nth(1).fill('/works/');
    await expect(async () => {
        const paths = await rows.locator('td:nth-child(3)').allTextContents();
        expect(paths.length).toBeGreaterThan(0);
        for (const path of paths) expect(path).toContain('/works/');
    }).toPass({ timeout: 20000 });
});
