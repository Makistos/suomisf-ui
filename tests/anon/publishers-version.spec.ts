import { test, expect } from '../fixtures/guard';

// Visitors always get the current publisher list: the new one is an admin-only trial (tests/admin/publishers-new.spec.ts).
test('a visitor sees the current publisher list, no switch, and the hotkey does nothing', async ({ page }) => {
    await page.goto('/faq');
    await page.evaluate(() => localStorage.setItem('suomisf.publishersPageVersion', 'uusi'));
    await page.goto('/publishers');
    await expect(page.getByText(/Kustantajia yhteensä: \d+/)).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('page-version')).toHaveCount(0);
    await page.keyboard.press('Shift+KeyU');
    await expect(page.locator('[data-publishers-page="uusi"]')).toHaveCount(0);
});
