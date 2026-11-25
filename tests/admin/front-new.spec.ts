import { test, expect } from '../fixtures/auth';
import { Page } from '@playwright/test';
import { expectAccessible } from '../fixtures/axe';

// The new front page (docs/ui-redesign/pages/front-identity.md, behaviour from
// front-page.md) under trial: admins switch to it with the button or Shift+U;
// everyone else sees the current page (tests/anon|user/front-version.spec.ts).
const newPage = (page: Page) => page.locator('[data-front-page="uusi"]');

async function openNew(page: Page) {
    await page.goto('/faq');
    await page.evaluate(() => localStorage.setItem('suomisf.frontPageVersion', 'uusi'));
    await page.goto('/');
    await expect(newPage(page)).toBeVisible({ timeout: 20000 });
}

test('the switch button and Shift+U swap the front page, apart from the other pages\' choices', async ({ adminPage: page }) => {
    await page.goto('/');
    const toggle = page.getByTestId('page-version');
    await expect(toggle).toHaveText('Uusi etusivu', { timeout: 20000 });
    await toggle.click();
    await expect(newPage(page)).toBeVisible({ timeout: 20000 });
    await expect(toggle).toHaveText('Nykyinen etusivu');
    await page.goto('/works/3984');
    await expect(page.locator('main.work-page')).toBeVisible({ timeout: 20000 });
    await page.goto('/');
    await expect(newPage(page)).toBeVisible({ timeout: 20000 });
    await page.keyboard.press('Shift+KeyU');
    await expect(page.locator('main.home-alt-page')).toBeVisible({ timeout: 20000 });
});

test('the search opens the search results with "Vain nimet", shared with the menu search', async ({ adminPage: page }) => {
    await openNew(page);
    await page.getByRole('searchbox', { name: 'Hakusana' }).fill('Maameren velho');
    await page.getByRole('button', { name: 'Hae', exact: true }).click();
    await expect(page).toHaveURL(/\/search\?q=Maameren%20velho&titles=1/);
    // Turning it off here turns it off for the menu search too.
    await page.goto('/');
    await page.getByLabel('Vain nimet').first().uncheck();
    expect(await page.evaluate(() => localStorage.getItem('searchTitlesOnly'))).toBe('0');
    await expect(page.getByRole('link', { name: 'Tähtivaeltaja' })).toHaveAttribute('href', '/search?q=T%C3%A4htivaeltaja');
});

test('the holdings are one sentence of four linked counts', async ({ adminPage: page }) => {
    await openNew(page);
    const holdings = page.locator('.fn-holdings');
    await expect(holdings).toHaveText(/^Bibliografiassa on [\d\s]+ teosta, [\d\s]+ painosta, [\d\s]+ novellia ja \d+ lehteä\.$/, { timeout: 20000 });
    await expect(holdings.getByRole('link')).toHaveCount(4);
    await expect(holdings.getByRole('link', { name: /lehteä$/ })).toHaveAttribute('href', '/magazines');
});

test('the catalogue card swaps without moving the page, and "Arvo uudet" draws a new set', async ({ adminPage: page }) => {
    await openNew(page);
    const thumbs = page.getByRole('group', { name: 'Valitse kirja' }).getByRole('button');
    await expect(thumbs.first()).toBeVisible({ timeout: 20000 });
    // Position within the page, not the viewport: a click may scroll.
    const top = () => page.getByRole('heading', { name: 'Viimeisimmät lisäykset' }).evaluate(el => el.getBoundingClientRect().top + window.scrollY);
    const before = await top();
    const n = await thumbs.count();
    for (let i = 0; i < n; i++) {
        await thumbs.nth(i).click();
        await expect(thumbs.nth(i)).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator('.fn-feat.fn-on h3 a')).toBeVisible();
        expect(await top()).toBe(before);
    }
    // A pick with a cover says where the cover is from.
    await expect(page.locator('.fn-feat.fn-on img')).toBeVisible();
    await expect(page.locator('.fn-feat.fn-on .fn-cfacts')).toContainText('Kansikuva');
    const random = page.waitForResponse(r => r.url().includes('/frontpage/random'));
    await page.getByRole('button', { name: 'Arvo uudet' }).click();
    await random;
    await expect(thumbs.first()).toHaveAttribute('aria-pressed', 'true');
});

test('latest additions show eight books with titles and authors, and every way in links', async ({ adminPage: page }) => {
    await openNew(page);
    const shelf = page.locator('.fn-shelf li');
    await expect(shelf).toHaveCount(8, { timeout: 20000 });
    for (const t of await page.locator('.fn-shelf .fn-t').allTextContents()) expect(t.trim()).not.toBe('');
    await expect(page.getByRole('link', { name: 'Kaikki lisäykset' })).toHaveAttribute('href', '/latest');
    const index = page.getByRole('navigation', { name: 'Selaa bibliografiaa' }).getByRole('link');
    await expect(index).toHaveCount(10);
    await expect(page.getByRole('link', { name: 'Aloita kirjaehdotukset' })).toHaveAttribute('href', '/suggestions');
    await expect(page.getByRole('link', { name: 'Aloita kirjaehdotukset' })).not.toHaveAttribute('target', '_blank');
});

test('a failed random pick request shows its own error, and the rest of the page stays', async ({ adminPage: page }) => {
    await page.route('**/api/frontpage/random', route => route.fulfill({ status: 500, body: '{}' }));
    await openNew(page);
    await expect(page.getByRole('alert')).toContainText('Satunnaisia kirjoja ei saatu haettua.', { timeout: 20000 });
    await expect(page.getByRole('button', { name: 'Yritä uudelleen' })).toBeVisible();
    await expect(page.locator('.fn-shelf li')).toHaveCount(8);
});

test('books without a cover, or whose cover fails to load, show a plain cloth binding', async ({ adminPage: page }) => {
    // Every cover image fails, as when the image folder lacks the newest covers.
    await page.route(/\.(jpe?g|png|webp|gif)(\?.*)?$/i, route => route.fulfill({ status: 404, body: '' }));
    // The first random pick has no cover at all; it is shown, not dropped.
    await page.route('**/api/frontpage/random', async route => {
        const picks = await (await route.fetch()).json();
        picks[0].images = [];
        await route.fulfill({ json: picks });
    });
    await openNew(page);
    const shelf = page.locator('.fn-shelf li');
    await expect(shelf).toHaveCount(8, { timeout: 20000 });
    await expect(page.locator('.fn-shelf .fn-cloth')).toHaveCount(8);
    await expect(page.locator('.fn-shelf img')).toHaveCount(0);
    const thumbs = page.getByRole('group', { name: 'Valitse kirja' }).getByRole('button');
    await expect(thumbs.first()).toBeVisible();
    await expect(page.locator('.fn-feat.fn-on .fn-cloth')).toBeVisible();
    // The same binding everywhere (the card's cover rule once painted it pale grey).
    const bg = (sel: string) => page.locator(sel).first().evaluate(el => getComputedStyle(el).backgroundColor);
    expect(await bg('.fn-feat.fn-on .fn-cloth')).toBe(await bg('.fn-shelf .fn-cloth'));
    await expect(page.locator('.fn-feat.fn-on h3 a')).toBeVisible();
    await expect(page.locator('.fn-feat.fn-on .fn-cfacts')).not.toContainText('Kansikuva');
    await expect(page.locator('.fn-thumbs .fn-cloth')).toHaveCount(await thumbs.count());
    await expect(page.locator('.fn-card img, .fn-thumbs img')).toHaveCount(0);
});

test('on a phone the page fits the screen', async ({ adminPage: page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openNew(page);
    await expect(page.getByRole('searchbox', { name: 'Hakusana' })).toHaveAttribute('placeholder', 'Hae kirjaa tai henkilöä…');
    // Before the counts load, too: their placeholder once was a fixed 480 px.
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    await expect(page.locator('.fn-shelf li').first()).toBeVisible({ timeout: 20000 });
    // The picks are random, so check several sets: a pick with long genre names once widened the page.
    for (let i = 0; i < 4; i++) {
        await expect(page.locator('.fn-feat.fn-on')).toBeVisible({ timeout: 20000 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
        const random = page.waitForResponse(r => r.url().includes('/frontpage/random'));
        await page.getByRole('button', { name: 'Arvo uudet' }).click();
        await random;
    }
});

test('the new front page has the site\'s own background and no accessibility violations', async ({ adminPage: page }) => {
    await openNew(page);
    await expect(page.locator('.fn-shelf li').first()).toBeVisible({ timeout: 20000 });
    const [site, front] = await page.evaluate(() => [
        getComputedStyle(document.body).backgroundColor,
        getComputedStyle(document.querySelector('[data-front-page="uusi"]')!).backgroundColor,
    ]);
    expect(front).toBe(site);
    await page.waitForLoadState('networkidle');
    await expectAccessible(page, { include: '[data-front-page="uusi"]' });
});
