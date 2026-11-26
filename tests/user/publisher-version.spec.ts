import { test, expect } from '../fixtures/auth';

// A logged-in user who isn't an admin gets the current publisher page and no switch.
test('a regular user sees the current publisher page without the switch', async ({ userPage: page }) => {
    await page.evaluate(() => localStorage.setItem('suomisf.publisherPageVersion', 'uusi'));
    await page.goto('/publishers/387');
    await expect(page.locator('main.publisher-page')).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('page-version')).toHaveCount(0);
    await page.keyboard.press('Shift+KeyU');
    await expect(page.locator('[data-publisher-page="uusi"]')).toHaveCount(0);
});
