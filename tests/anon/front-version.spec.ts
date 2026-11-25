import { test, expect } from '../fixtures/guard';

// Visitors always get the current front page: the new one is an admin-only trial (tests/admin/front-new.spec.ts).
test('a visitor sees the current front page, no switch, and the hotkey does nothing', async ({ page }) => {
    await page.goto('/faq');
    await page.evaluate(() => localStorage.setItem('suomisf.frontPageVersion', 'uusi'));
    await page.goto('/');
    await expect(page.locator('main.home-alt-page')).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('page-version')).toHaveCount(0);
    await page.keyboard.press('Shift+KeyU');
    await expect(page.locator('[data-front-page="uusi"]')).toHaveCount(0);
});
