import { test, expect } from '../fixtures/guard';

// Missing records must show a clear message, not a blank page or an endless
// spinner. The API answers these inconsistently (404, 400, or 200 with an
// empty object for tags), so each kind is covered.
for (const [path, title] of [
    ['/works/9999999', 'Teosta ei löytynyt'],
    ['/people/9999999', 'Henkilöä ei löytynyt'],
    ['/tags/9999999', 'Asiasanaa ei löytynyt'],
    ['/no-such-page', 'Sivua ei löydy'],
] as const) {
    test(`${path} shows "${title}"`, async ({ page }) => {
        await page.goto(path);
        await expect(page.getByRole('heading', { name: title })).toBeVisible({ timeout: 10000 });
        await expect(page.getByRole('link', { name: 'Palaa etusivulle' })).toBeVisible();
    });
}
