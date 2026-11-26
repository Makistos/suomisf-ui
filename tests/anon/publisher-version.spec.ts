import { test, expect } from '../fixtures/guard';

// Visitors always get the current publisher page: the new one is an admin-only trial (tests/admin/publisher-new.spec.ts).
test('a visitor sees the current publisher page, no switch, and the hotkey does nothing', async ({ page }) => {
    await page.goto('/faq');
    await page.evaluate(() => localStorage.setItem('suomisf.publisherPageVersion', 'uusi'));
    await page.goto('/publishers/387');
    await expect(page.locator('main.publisher-page')).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('page-version')).toHaveCount(0);
    await page.keyboard.press('Shift+KeyU');
    await expect(page.locator('[data-publisher-page="uusi"]')).toHaveCount(0);
});
