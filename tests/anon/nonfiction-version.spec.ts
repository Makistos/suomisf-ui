import { test, expect } from '../fixtures/guard';

// Visitors always get the current non-fiction list: the new one is an admin-only trial (tests/admin/nonfiction-new.spec.ts).
test('a visitor sees the current non-fiction list, no switch, and the hotkey does nothing', async ({ page }) => {
    await page.goto('/faq');
    await page.evaluate(() => localStorage.setItem('suomisf.nonfictionPageVersion', 'uusi'));
    await page.goto('/nonfiction');
    await expect(page.locator('h1.title', { hasText: 'Tietokirjat' })).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('page-version')).toHaveCount(0);
    await page.keyboard.press('Shift+KeyU');
    await expect(page.locator('[data-bookindex-page="uusi"]')).toHaveCount(0);
});
