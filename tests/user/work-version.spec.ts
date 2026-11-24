import { test, expect } from '../fixtures/auth';

// A logged-in user who isn't an admin gets the current work page and no switch.
test('a regular user sees the current work page without the switch', async ({ userPage: page }) => {
    await page.evaluate(() => localStorage.setItem('suomisf.workPageVersion', 'uusi'));
    await page.goto('/works/3984');
    await expect(page.locator('main.work-page')).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('page-version')).toHaveCount(0);
    await page.keyboard.press('Shift+KeyU');
    await expect(page.locator('[data-work-page="uusi"]')).toHaveCount(0);
});
