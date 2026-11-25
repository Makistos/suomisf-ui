import { test, expect } from '../fixtures/guard';

// Visitors always get the current short story page: the new one is an admin-only trial (tests/admin/short-new.spec.ts).
test('a visitor sees the current short story page, no switch, and the hotkey does nothing', async ({ page }) => {
    await page.goto('/faq');
    await page.evaluate(() => localStorage.setItem('suomisf.shortPageVersion', 'uusi'));
    await page.goto('/shorts/714');
    await expect(page.getByRole('tab', { name: 'Julkaisut' })).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('page-version')).toHaveCount(0);
    await page.keyboard.press('Shift+KeyU');
    await expect(page.locator('[data-short-page="uusi"]')).toHaveCount(0);
});
