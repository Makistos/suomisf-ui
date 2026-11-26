import { test, expect } from '../fixtures/guard';

// Visitors always get the current book index: the new one is an admin-only trial (tests/admin/bookindex-new.spec.ts).
test('a visitor sees the current book index, no switch, and the hotkey does nothing', async ({ page }) => {
    await page.goto('/faq');
    await page.evaluate(() => localStorage.setItem('suomisf.bookindexPageVersion', 'uusi'));
    await page.goto('/bookindex');
    await expect(page.getByRole('heading', { name: 'Kirjatietokanta' })).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('page-version')).toHaveCount(0);
    await page.keyboard.press('Shift+KeyU');
    await expect(page.locator('[data-bookindex-page="uusi"]')).toHaveCount(0);
});
