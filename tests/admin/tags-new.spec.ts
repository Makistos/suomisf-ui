import { test, expect } from '../fixtures/auth';
import { Page } from '@playwright/test';
import { expectAccessible } from '../fixtures/axe';

// The new tag list (docs/ui-redesign/pages/tags.md, identity style) under trial: a tab a group, big groups a letter at a time,
// from GET /api/tagindex. Everyone else gets the current list (tests/anon|user/tags-version.spec.ts).
const newPage = (page: Page) => page.locator('[data-tags-page="uusi"]');
const items = (page: Page) => page.locator('.tg-cols li');
const tab = (page: Page, name: string) => page.getByRole('tab', { name: new RegExp(`^${name}`) });

async function openNew(page: Page, query = '') {
    await page.goto('/faq');
    await page.evaluate(() => localStorage.setItem('suomisf.tagsPageVersion', 'uusi'));
    await page.goto(`/tags${query}`);
    await expect(newPage(page)).toBeVisible({ timeout: 20000 });
    await expect(page.locator('.tg-status')).toContainText(/asiasana/, { timeout: 20000 });
}
const index = (page: Page, test: (url: URL) => boolean) =>
    page.waitForResponse(r => r.url().includes('/api/tagindex') && test(new URL(r.url()))).then(r => r.json());

test('the switch button and Shift+U swap the tag list, apart from the tag page\'s choice', async ({ adminPage: page }) => {
    await page.goto('/tags');
    const toggle = page.getByTestId('page-version');
    await expect(toggle).toHaveText('Uusi asiasanasivu', { timeout: 20000 });
    await toggle.click();
    await expect(newPage(page)).toBeVisible({ timeout: 20000 });
    await expect(toggle).toHaveText('Nykyinen asiasanasivu');
    await page.waitForLoadState('networkidle');
    await page.goto('/tags/303');
    await expect(page.locator('main.sftag-page h1')).toBeVisible({ timeout: 20000 });
    await page.waitForLoadState('networkidle');
    await page.goto('/tags');
    await expect(newPage(page)).toBeVisible({ timeout: 20000 });
    await page.keyboard.press('Shift+KeyU');
    await expect(page.locator('h1.maintitle', { hasText: 'Asiasanat' })).toBeVisible({ timeout: 20000 });
});

test('opens on Alalajit with every tag and its count; tabs show each group\'s size', async ({ adminPage: page }) => {
    const response = index(page, u => u.searchParams.get('type') === '2');
    await openNew(page);
    const data = await response;
    expect(new URL(page.url()).search).toBe('');
    await expect(tab(page, 'Alalajit')).toHaveAttribute('aria-selected', 'true');
    await expect(items(page)).toHaveCount(data.tags.length);
    await expect(items(page).first()).toContainText(data.tags[0].name);
    await expect(items(page).first().locator('span')).toHaveText(String(data.tags[0].count));
    await expect(items(page).first().locator('a')).toHaveAttribute('href', `/tags/${data.tags[0].id}`);
    for (const t of data.types) {
        expect(await page.getByRole('tab').filter({ has: page.locator('small', { hasText: new RegExp(`^${t.count.toLocaleString('fi-FI').replace(/\s/g, '\\s')}$`) }) }).count()).toBeGreaterThan(0);
    }
    // Small groups have no letter bar.
    await expect(page.getByRole('group', { name: 'Alkukirjain' })).toHaveCount(0);
    await expect(page.locator('.tg-head p')).toHaveText(/^[\d\s]+ asiasanaa seitsemässä ryhmässä\./);
});

test('a big group opens at A; letters, Kaikki and 0–9 land in the URL and survive reload', async ({ adminPage: page }) => {
    await openNew(page);
    await tab(page, 'Aiheet').click();
    await expect(page).toHaveURL(/ryhma=aiheet$/);
    const letters = page.getByRole('group', { name: 'Alkukirjain' });
    await expect(letters.getByRole('button', { name: 'A', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.tg-status')).toContainText('alkukirjain A');
    for (const name of await items(page).locator('a').allInnerTexts()) expect(name[0].toUpperCase()).toBe('A');
    await letters.getByRole('button', { name: 'Ä', exact: true }).click();
    await expect(page).toHaveURL(/kirjain=%C3%84|kirjain=Ä/);
    await page.reload();
    await expect(letters.getByRole('button', { name: 'Ä', exact: true })).toHaveAttribute('aria-pressed', 'true', { timeout: 20000 });
    await letters.getByRole('button', { name: '0–9' }).click();
    await expect(page).toHaveURL(/kirjain=0/);
    await letters.getByRole('button', { name: 'Kaikki' }).click();
    await expect(page).toHaveURL(/kirjain=kaikki/);
    const all = await page.locator('.tg-status b').innerText();
    expect(Number(all.replace(/\D/g, ''))).toBeGreaterThan(1000);
    await page.goBack();
    await expect(page).toHaveURL(/kirjain=0/);
});

test('search covers the group, recounts the tabs and hides the letters; sort by count', async ({ adminPage: page }) => {
    await openNew(page, '?ryhma=aiheet&kirjain=B');
    const response = index(page, u => u.searchParams.get('q') === 'punk');
    await page.getByLabel('Hae nimellä').fill('punk');
    await page.getByLabel('Hae nimellä').press('Enter');
    const data = await response;
    expect(new URL(page.url()).searchParams.get('haku')).toBe('punk');
    await expect(page.getByRole('group', { name: 'Alkukirjain' })).toHaveCount(0);
    await expect(page.locator('.tg-status')).toContainText('haulla "punk"');
    await expect(items(page)).toHaveCount(data.tags.length);
    const alalajit = data.types.find((t: { id: number }) => t.id === 2).count;
    await expect(tab(page, 'Alalajit').locator('small')).toHaveText(String(alalajit));
    await tab(page, 'Alalajit').click();
    await expect(items(page).filter({ hasText: 'kyberpunk' })).toHaveCount(1);
    await page.getByLabel('Järjestys').selectOption({ label: 'Yleisimmät ensin' });
    await expect(page).toHaveURL(/jarjestys=maara/);
    await expect.poll(async () => {
        const counts = (await items(page).locator('span').allInnerTexts()).map(t => Number(t.replace(/\D/g, '')));
        return counts.length > 1 && counts.every((c, i) => i === 0 || counts[i - 1] >= c);
    }).toBe(true);
    await page.getByRole('button', { name: 'Tyhjennä haku' }).click();
    await expect(page).not.toHaveURL(/haku=/);
});

test('an admin sees unused tags, greyed with 0', async ({ adminPage: page }) => {
    const response = index(page, u => u.searchParams.get('type') === '1' && u.searchParams.get('letter') === null);
    await openNew(page, '?ryhma=aiheet&kirjain=kaikki');
    const data = await response;
    const unused = data.tags.filter((t: { count: number }) => t.count === 0);
    test.skip(unused.length === 0, 'no unused tags in the test data');
    const row = items(page).filter({ has: page.getByRole('link', { name: unused[0].name, exact: true }) });
    await expect(row).toHaveClass(/tg-unused/);
    await expect(row.locator('span')).toHaveText('0');
});

test('a search with no results says so; a failed request shows an error with retry', async ({ adminPage: page }) => {
    await openNew(page, '?haku=zzqqxx');
    await expect(page.locator('.tg-empty')).toContainText('Haulla ei löytynyt asiasanoja');
    let fail = true;
    await page.route('**/api/tagindex?*', route => (fail ? route.fulfill({ status: 500, body: '{}' }) : route.fallback()));
    await page.goto('/tags?ryhma=tyylit');
    await expect(page.getByRole('alert')).toContainText('Asiasanoja ei saatu haettua.', { timeout: 20000 });
    fail = false;
    await page.getByRole('button', { name: 'Yritä uudelleen' }).click();
    await expect(items(page).first()).toBeVisible({ timeout: 20000 });
});

test('on a phone the page fits; tabs and letters scroll sideways', async ({ adminPage: page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openNew(page, '?ryhma=aiheet');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    await expect(items(page).first()).toBeVisible();
});

test('the new tag list has the site\'s own background and no accessibility violations', async ({ adminPage: page }) => {
    await openNew(page, '?ryhma=aiheet');
    const [site, own] = await page.evaluate(() => [
        getComputedStyle(document.body).backgroundColor,
        getComputedStyle(document.querySelector('[data-tags-page="uusi"]')!).backgroundColor,
    ]);
    expect(own).toBe(site);
    await page.waitForLoadState('networkidle');
    await expectAccessible(page, { include: '[data-tags-page="uusi"]' });
});
