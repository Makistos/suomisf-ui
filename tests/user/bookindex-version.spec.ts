import { test, expect } from '../fixtures/auth';

// A logged-in user who isn't an admin gets the current book index and no switch.
test('a regular user sees the current book index without the switch', async ({ userPage: page }) => {
    await page.evaluate(() => localStorage.setItem('suomisf.bookindexPageVersion', 'uusi'));
    await page.goto('/bookindex');
    await expect(page.getByRole('heading', { name: 'Kirjatietokanta' })).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('page-version')).toHaveCount(0);
    await page.keyboard.press('Shift+KeyU');
    await expect(page.locator('[data-bookindex-page="uusi"]')).toHaveCount(0);
});
