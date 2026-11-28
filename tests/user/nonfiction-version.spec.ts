import { test, expect } from '../fixtures/auth';

// A logged-in user who isn't an admin gets the current non-fiction list and no switch.
test('a regular user sees the current non-fiction list without the switch', async ({ userPage: page }) => {
    await page.evaluate(() => localStorage.setItem('suomisf.nonfictionPageVersion', 'uusi'));
    await page.goto('/nonfiction');
    await expect(page.locator('h1.title', { hasText: 'Tietokirjat' })).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('page-version')).toHaveCount(0);
    await page.keyboard.press('Shift+KeyU');
    await expect(page.locator('[data-bookindex-page="uusi"]')).toHaveCount(0);
});
