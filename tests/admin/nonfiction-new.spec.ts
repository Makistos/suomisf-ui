import { test, expect } from '../fixtures/auth';
import { Page } from '@playwright/test';
import { expectAccessible } from '../fixtures/axe';

// /nonfiction in the identity style (book-index.md, step 4): the new book index with the type fixed to Tietokirja, paged on the
// server, as an admin-only trial. Everyone else gets the current list (tests/anon|user/nonfiction-version.spec.ts).
const newPage = (page: Page) => page.locator('[data-bookindex-page="uusi"][data-kind="tietokirjat"]');
const rows = (page: Page) => page.locator('.bn-row');
const count = (page: Page) => page.locator('#bn-count');
const total = (page: Page) => count(page).locator('b').innerText().then(t => Number(t.replace(/\D/g, '')));

async function openNew(page: Page, query = '') {
    await page.goto('/faq');
    await page.evaluate(() => localStorage.setItem('suomisf.nonfictionPageVersion', 'uusi'));
    await page.goto(`/nonfiction${query}`);
    await expect(newPage(page)).toBeVisible({ timeout: 20000 });
    await expect(count(page)).toContainText(/teos/, { timeout: 20000 });
}

test('the switch button and Shift+U swap the non-fiction page, apart from the book index\'s choice', async ({ adminPage: page }) => {
    await page.goto('/nonfiction');
    const toggle = page.getByTestId('page-version');
    await expect(toggle).toHaveText('Uusi tietokirjasivu', { timeout: 20000 });
    await toggle.click();
    await expect(newPage(page)).toBeVisible({ timeout: 20000 });
    await expect(toggle).toHaveText('Nykyinen tietokirjasivu');
    await page.waitForLoadState('networkidle');
    await page.goto('/bookindex');
    await expect(page.getByRole('heading', { name: 'Kirjatietokanta' })).toBeVisible({ timeout: 20000 });
    await page.waitForLoadState('networkidle');
    await page.goto('/nonfiction');
    await expect(newPage(page)).toBeVisible({ timeout: 20000 });
    await page.keyboard.press('Shift+KeyU');
    await expect(page.locator('h1.title', { hasText: 'Tietokirjat' })).toBeVisible({ timeout: 20000 });
    await expect(newPage(page)).toHaveCount(0);
});

test('lists only non-fiction, one page from the server, with no type filter', async ({ adminPage: page }) => {
    const response = page.waitForResponse(r => r.url().includes('/api/bookindex?') && r.url().includes('type=4'));
    await openNew(page, '?tyyppi=romaani');
    const api = (await (await response).json());
    await expect(page.getByRole('heading', { level: 1, name: 'Tietokirjat' })).toBeVisible();
    await expect(page.locator('.bn-head p')).toHaveText(/^Kaikki bibliografian [\d\s]+ tietokirjaa\./);
    expect(await total(page)).toBe(api.total);
    // The type is the page itself: no chips for it, and a type in the URL changes nothing.
    await expect(page.getByRole('group', { name: 'Tyyppi' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Tyhjennä' })).toHaveCount(0);
    expect(api.works.every((w: { type: number }) => w.type === 4)).toBe(true);
    await expect(rows(page)).toHaveCount(Math.min(200, api.total));
});

test('filters, sorting and grouping work as on the book index', async ({ adminPage: page }) => {
    await openNew(page);
    const all = await total(page);
    await page.getByRole('group', { name: 'Genre' }).getByRole('button', { name: 'Fantasia', exact: true }).click();
    await expect(page).toHaveURL(/genre=F(&|$)/);
    await expect(count(page)).toContainText('Fantasia');
    await expect(count(page)).not.toContainText('tietokirja');
    await expect.poll(() => total(page)).toBeLessThan(all);
    await page.getByLabel('Järjestys').selectOption({ label: 'Uusin ensin' });
    await expect(page).toHaveURL(/jarjestys=uusin/);
    // The checkbox follows the URL, so it changes after the click (uncheck() checks too soon).
    await page.getByLabel('Ryhmittele tekijöittäin').click();
    await expect(page.getByLabel('Ryhmittele tekijöittäin')).not.toBeChecked();
    await expect(page.locator('.bn-group')).toHaveCount(0);
    await page.getByLabel('Rivejä').selectOption('50');
    await expect(page).toHaveURL(/riveja=50/);
    await page.getByRole('button', { name: 'Tyhjennä' }).first().click();
    await expect(page).toHaveURL(/\/nonfiction$/);
    await expect.poll(() => total(page)).toBe(all);
});

test('statistics for the whole non-fiction list', async ({ adminPage: page }) => {
    await openNew(page);
    const response = page.waitForResponse(r => r.url().includes('/api/bookindex/stats') && r.url().includes('type=4'));
    await page.getByRole('button', { name: 'Tilastot tästä hausta' }).click();
    const stats = (await (await response).json());
    await expect(page).toHaveURL(/tilastot=1/);
    await expect(page.locator('.bn-gbar')).toHaveCount(stats.genres.length);
    await expect(page.locator('.bn-tags li')).toHaveCount(stats.tags.length);
});

test('the new non-fiction page has the site\'s own background and no accessibility violations', async ({ adminPage: page }) => {
    await openNew(page, '?tilastot=1');
    await expect(page.locator('.bn-stats-genres')).toBeVisible({ timeout: 20000 });
    const [site, index] = await page.evaluate(() => [
        getComputedStyle(document.body).backgroundColor,
        getComputedStyle(document.querySelector('[data-bookindex-page="uusi"]')!).backgroundColor,
    ]);
    expect(index).toBe(site);
    await page.waitForLoadState('networkidle');
    await expectAccessible(page, { include: '[data-bookindex-page="uusi"]' });
});
