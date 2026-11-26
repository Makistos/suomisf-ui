import { test, expect } from '../fixtures/auth';

// A logged-in user who isn't an admin gets the current publisher list and no switch.
test('a regular user sees the current publisher list without the switch', async ({ userPage: page }) => {
    await page.evaluate(() => localStorage.setItem('suomisf.publishersPageVersion', 'uusi'));
    await page.goto('/publishers');
    await expect(page.getByText(/Kustantajia yhteensä: \d+/)).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('page-version')).toHaveCount(0);
    await page.keyboard.press('Shift+KeyU');
    await expect(page.locator('[data-publishers-page="uusi"]')).toHaveCount(0);
});
