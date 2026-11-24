import { test, expect } from '../fixtures/guard';

// Visitors always get the current work page: the new version is an admin-only
// trial (tests/admin/work-new.spec.ts). Also checks the bug fixed on the
// current page (docs/ui-redesign/pages/work.md, "Series navigator").
const LE_GUIN_LEFT_HAND = 3984;

test('a visitor sees the current work page, no switch, and the hotkey does nothing', async ({ page }) => {
    await page.goto('/');
    // Even with the admin's choice left in this browser.
    await page.evaluate(() => localStorage.setItem('suomisf.workPageVersion', 'uusi'));
    await page.goto(`/works/${LE_GUIN_LEFT_HAND}`);
    await expect(page.locator('main.work-page')).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('page-version')).toHaveCount(0);
    await page.keyboard.press('Shift+KeyU');
    await expect(page.locator('[data-work-page="uusi"]')).toHaveCount(0);
});

test('the current page\'s series arrows follow the series order, not the database order', async ({ page }) => {
    await page.goto(`/works/${LE_GUIN_LEFT_HAND}`);
    // Hain-sarja has neither order nor numbers, so the original years decide:
    // Harhakaupunki (1967), Pimeyden vasen käsi (1969), Maailma, vihreä metsä (1972).
    const series = page.locator('main.work-page').locator('a[href="/bookseries/"], a[href^="/bookseries/"]').first().locator('..');
    await expect(series.locator('a:has(.pi-caret-left)')).toHaveAttribute('href', '/works/3966', { timeout: 20000 });
    await expect(series.locator('a:has(.pi-caret-right)')).toHaveAttribute('href', '/works/3972');
});
