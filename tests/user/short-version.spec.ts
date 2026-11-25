import { test, expect } from '../fixtures/auth';

// A logged-in user who isn't an admin gets the current short story page and no switch.
test('a regular user sees the current short story page without the switch', async ({ userPage: page }) => {
    await page.evaluate(() => localStorage.setItem('suomisf.shortPageVersion', 'uusi'));
    await page.goto('/shorts/714');
    await expect(page.getByRole('tab', { name: 'Julkaisut' })).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('page-version')).toHaveCount(0);
    await page.keyboard.press('Shift+KeyU');
    await expect(page.locator('[data-short-page="uusi"]')).toHaveCount(0);
});
