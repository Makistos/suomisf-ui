import { test, expect } from '../fixtures/guard';

// The new tag list and tag page are admin-only trials (tests/admin/tags-new.spec.ts, tag-new.spec.ts).
test('a visitor sees the current tag list and tag page, no switch, and the hotkey does nothing', async ({ page }) => {
    await page.goto('/faq');    await page.evaluate(() => {
        localStorage.setItem('suomisf.tagsPageVersion', 'uusi');
        localStorage.setItem('suomisf.tagPageVersion', 'uusi');
    });
    await page.goto('/tags');
    await expect(page.locator('h1.maintitle', { hasText: 'Asiasanat' })).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('page-version')).toHaveCount(0);
    await page.keyboard.press('Shift+KeyU');
    await expect(page.locator('[data-tags-page="uusi"]')).toHaveCount(0);
    await page.goto('/tags/303');
    await expect(page.locator('main.sftag-page h1', { hasText: 'kyberpunk' })).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('page-version')).toHaveCount(0);
    await page.keyboard.press('Shift+KeyU');
    await expect(page.locator('[data-tag-page="uusi"]')).toHaveCount(0);
});
