import { test, expect } from '../fixtures/guard';
import { expectAccessible } from '../fixtures/axe';

// Every public page type, scanned once its content has loaded.
const PAGES: [string, RegExp | string][] = [
    ['/', ''],
    ['/works/63', ''],
    ['/editions/1731', ''],
    ['/people/368', 'Johanna Sinisalo'],
    ['/shorts/4985', ''],
    ['/tags', 'Asiasanat'],
    ['/tags/521', 'dystopia'],
    ['/awards', 'Palkinnot'],
    ['/awards/27', 'Apollo'],
    ['/magazines', ''],
    ['/magazines/6', 'Alienisti'],
    ['/bookindex', ''],
    ['/shortstoryindex', ''],
    ['/stats', ''],
    ['/latest', ''],
    ['/publishers', ''],
    ['/bookseries', 'Kirjasarjat'],
    ['/bookseries/1', ''],
    ['/pubseries', ''],
    ['/people', ''],
    ['/changes', ''],
    ['/faq', ''],
    ['/login', ''],
    ['/nonfiction', ''],
];

for (const [path, heading] of PAGES) {
    test(`${path} has no accessibility violations`, async ({ page }) => {
        await page.goto(path);
        if (heading) await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible({ timeout: 20000 });
        await expect(page.getByRole('progressbar')).toHaveCount(0, { timeout: 20000 });
        await page.waitForLoadState('networkidle');
        await expectAccessible(page);
    });
}

test('login and register dialogs have no accessibility violations', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('menuitem', { name: 'Käyttäjätili' }).click();
    await page.getByRole('menuitem', { name: 'Rekisteröidy' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expectAccessible(page, { include: '.p-dialog' });
});
