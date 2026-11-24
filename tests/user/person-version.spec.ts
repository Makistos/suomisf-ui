import { test, expect } from '../fixtures/auth';

// A logged-in user who isn't an admin gets the current person page and no switch.
test('a regular user sees the current person page without the switch', async ({ userPage: page }) => {
    await page.evaluate(() => localStorage.setItem('suomisf.personPageVersion', 'uusi'));
    await page.goto('/people/2435');
    await expect(page.locator('main.person-page')).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('page-version')).toHaveCount(0);
    await page.keyboard.press('Shift+KeyU');
    await expect(page.locator('[data-person-page="uusi"]')).toHaveCount(0);
});
