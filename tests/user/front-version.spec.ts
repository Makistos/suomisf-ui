import { test, expect } from '../fixtures/auth';

// A logged-in user who isn't an admin gets the current front page and no switch.
test('a regular user sees the current front page without the switch', async ({ userPage: page }) => {
    await page.evaluate(() => localStorage.setItem('suomisf.frontPageVersion', 'uusi'));
    await page.goto('/');
    await expect(page.locator('main.home-alt-page')).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('page-version')).toHaveCount(0);
    await page.keyboard.press('Shift+KeyU');
    await expect(page.locator('[data-front-page="uusi"]')).toHaveCount(0);
});
