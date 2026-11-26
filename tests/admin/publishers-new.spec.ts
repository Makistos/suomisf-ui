import { test, expect } from '../fixtures/auth';
import { Page } from '@playwright/test';
import { expectAccessible } from '../fixtures/axe';

// The new publisher list (docs/ui-redesign/pages/publishers.md, list page, identity style) under trial: admins switch with the
// button or Shift+U; everyone else gets the current page (tests/anon|user/publishers-version.spec.ts). GET /api/publisherindex
// gives every publisher with its edition count, years and magazines; filtering and sorting happen in the page.
type Row = { id: number; name: string; fullname: string; editions: number; first_year: number | null; last_year: number | null;
    magazines: { id: number; name: string; issues: number }[] };
const WSOY = 387;
const AIKAKONE = 6; // no books, publishes Aikakone

const newPage = (page: Page) => page.locator('[data-publishers-page="uusi"]');
const rows = (page: Page) => page.locator('.pl-table tbody tr');
const count = (page: Page) => page.locator('#pl-count');
const fi = (v: number) => v.toLocaleString('fi-FI').replace(/\s/g, ' ');

// The rows the page itself received: other specs add and remove publishers in parallel (tests/admin/publisher.spec.ts),
// so a separate API call could see one publisher more or less than the page.
const loaded = async (page: Page, load: () => Promise<unknown>): Promise<Row[]> => {
    const response = page.waitForResponse(r => r.url().endsWith('/api/publisherindex') && r.status() === 200);
    await load();
    const rows: Row[] = (await (await response).json()).publishers;
    await expect(count(page)).toContainText('kustanta', { timeout: 20000 });
    return rows;
};
async function openNew(page: Page, query = '') {
    await page.goto('/faq');
    await page.evaluate(() => localStorage.setItem('suomisf.publishersPageVersion', 'uusi'));
    const rows = await loaded(page, () => page.goto(`/publishers${query}`));
    await expect(newPage(page)).toBeVisible({ timeout: 20000 });
    return rows;
}
const names = (page: Page) => page.locator('.pl-table tbody .pl-name > a').allInnerTexts();

test('the switch button and Shift+U swap the publisher list, apart from the other pages\' choices', async ({ adminPage: page }) => {
    await page.goto('/publishers');
    const toggle = page.getByTestId('page-version');
    await expect(toggle).toHaveText('Uusi kustantajasivu', { timeout: 20000 });
    await toggle.click();
    await expect(newPage(page)).toBeVisible({ timeout: 20000 });
    await expect(toggle).toHaveText('Nykyinen kustantajasivu');
    expect(await page.evaluate(() => localStorage.getItem('suomisf.bookindexPageVersion'))).not.toBe('uusi');
    await page.keyboard.press('Shift+KeyU');
    await expect(page.getByText(/Kustantajia yhteensä: \d+/)).toBeVisible({ timeout: 20000 });
});

test('every publisher is listed with the total, the five biggest, edition counts, years and full names', async ({ adminPage: page }) => {
    const all = await openNew(page);
    await expect(rows(page)).toHaveCount(all.length);
    await expect(count(page)).toHaveText(`${fi(all.length)} kustantajaa`);
    const biggest = [...all].sort((a, b) => b.editions - a.editions).slice(0, 5);
    await expect(page.locator('.pl-head p a')).toHaveText(biggest.map(p => p.name));
    await expect(page.locator('.pl-head p a').first()).toHaveAttribute('href', `/publishers/${biggest[0].id}`);
    const wsoy = all.find(p => p.id === WSOY)!;
    const row = rows(page).filter({ has: page.getByRole('link', { name: 'WSOY', exact: true }) });
    await expect(row.locator('.pl-name small')).toHaveText('Werner Söderström Oy');
    await expect(row.locator('.pl-n')).toContainText(fi(wsoy.editions));
    await expect(row.locator('.pl-y')).toHaveText(`${wsoy.first_year}–${wsoy.last_year}`);
    // names in Finnish order by default, nothing in the URL
    const shown = await names(page);
    expect(shown).toEqual([...shown].sort((a, b) => a.localeCompare(b, 'fi')));
    expect(new URL(page.url()).search).toBe('');
});

test('a publisher without books says which magazine it publishes', async ({ adminPage: page }) => {
    const aikakone = (await openNew(page)).find(p => p.id === AIKAKONE)!;
    const row = rows(page).filter({ has: page.getByRole('link', { name: 'Aikakone ry', exact: true }) });
    await expect(row.locator('.pl-zero')).toHaveText(`ei kirjoja; julkaisee lehteä Aikakone (${aikakone.magazines[0].issues} numeroa)`);
    await expect(row.locator('.pl-zero').getByRole('link', { name: 'Aikakone' })).toHaveAttribute('href', `/magazines/${aikakone.magazines[0].id}`);
    await expect(row.locator('.pl-n')).toHaveCount(0);
});

test('the name filters as it is typed, from any word of the name or the full name; Tyhjennä clears', async ({ adminPage: page }) => {
    const all = await openNew(page);
    // "söderström" starts a word in four names and in WSOY's full name, Werner Söderström Oy
    const matches = all.filter(p => `${p.name} ${p.fullname}`.toLocaleLowerCase('fi').split(/[\s/,&-]+/).some(w => w.startsWith('söderström')));
    expect(matches.map(p => p.id)).toContain(WSOY);
    await page.getByRole('searchbox', { name: 'Nimi' }).fill('söderström');
    await expect(page).toHaveURL(/nimi=s%C3%B6derstr%C3%B6m/);
    await expect(rows(page)).toHaveCount(matches.length);
    await expect(count(page)).toHaveText(`${matches.length} / ${fi(all.length)} kustantajaa`);
    await page.getByRole('searchbox', { name: 'Nimi' }).fill('werner');
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page).first()).toContainText('WSOY');
    const again = await loaded(page, () => page.reload());
    await expect(page.getByRole('searchbox', { name: 'Nimi' })).toHaveValue('werner', { timeout: 20000 });
    await expect(rows(page)).toHaveCount(1);
    await page.getByRole('button', { name: 'Tyhjennä', exact: true }).click();
    await expect(page.getByRole('searchbox', { name: 'Nimi' })).toHaveValue('');
    await expect(rows(page)).toHaveCount(again.length);
    expect(new URL(page.url()).search).toBe('');
});

test('the years active and hiding publishers without editions filter the list and land in the URL', async ({ adminPage: page }) => {
    const all = await openNew(page);
    const zero = all.filter(p => p.editions === 0).length;
    const hide = page.getByLabel(`Piilota ilman painoksia (${zero})`);
    // the box follows the URL, which React Router updates a moment after the click
    await hide.click();
    await expect(hide).toBeChecked();
    await expect(page).toHaveURL(/piilota=tyhjat/);
    await expect(rows(page)).toHaveCount(all.length - zero);
    await expect(page.locator('.pl-zero')).toHaveCount(0);
    await hide.click();
    await expect(hide).not.toBeChecked();
    await expect(page).not.toHaveURL(/piilota/);
    await page.getByLabel('Toiminut, vuodesta').fill('1900');
    await page.getByLabel('Toiminut, vuoteen').fill('1930');
    await page.getByRole('button', { name: 'Rajaa' }).click();
    await expect(page).toHaveURL(/toiminut=1900-1930/);
    const active = all.filter(p => p.first_year !== null && p.first_year <= 1930 && p.last_year! >= 1900);
    await expect(rows(page)).toHaveCount(active.length);
    await page.goBack();
    await expect(rows(page)).toHaveCount(all.length);
    await expect(page.getByLabel('Toiminut, vuodesta')).toHaveValue('');
});

test('every column sorts from its header, each in its natural direction first, empty years last', async ({ adminPage: page }) => {
    const all = await openNew(page);
    const byEditions = page.getByRole('button', { name: 'Painoksia' });
    await byEditions.click();
    await expect(page).toHaveURL(/jarjestys=painoksia$/);
    await expect(page.locator('th.pl-n')).toHaveAttribute('aria-sort', 'descending');
    const biggest = [...all].sort((a, b) => b.editions - a.editions)[0];
    await expect(page.locator('.pl-table tbody .pl-name > a').first()).toHaveText(biggest.name);
    await byEditions.click();
    await expect(page).toHaveURL(/suunta=nouseva/);
    await expect(page.locator('th.pl-n')).toHaveAttribute('aria-sort', 'ascending');
    // the publishers without editions stay last in both directions
    await expect(rows(page).last().locator('.pl-zero')).toHaveCount(1);
    await page.getByRole('button', { name: 'Vuodet' }).click();
    await expect(page.locator('th.pl-y')).toHaveAttribute('aria-sort', 'ascending');
    const oldest = Math.min(...all.filter(p => p.first_year !== null).map(p => p.first_year!));
    await expect(rows(page).first().locator('.pl-y')).toHaveText(new RegExp(`^${oldest}`));
    await expect(rows(page).last().locator('.pl-zero')).toHaveCount(1);
    await page.getByRole('button', { name: 'Nimi' }).click();
    expect(new URL(page.url()).search).toBe('');
    await page.getByRole('button', { name: 'Nimi' }).click();
    await expect(page).toHaveURL(/suunta=laskeva/);
    // the table re-renders a moment after the URL changes
    await expect.poll(async () => { const shown = await names(page); return shown.join('|') === [...shown].sort((a, b) => b.localeCompare(a, 'fi')).join('|'); }).toBe(true);
});

test('the activity bars share one axis from the earliest to the latest year', async ({ adminPage: page }) => {
    const all = await openNew(page);
    const years = all.filter(p => p.first_year !== null);
    const from = Math.min(...years.map(p => p.first_year!)), to = Math.max(...years.map(p => p.last_year!));
    await expect(page.locator('th.pl-bar')).toHaveText(`${from}${to}`);
    const wsoy = all.find(p => p.id === WSOY)!;
    const bar = rows(page).filter({ has: page.getByRole('link', { name: 'WSOY', exact: true }) }).locator('.pl-track i');
    const style = await bar.getAttribute('style');
    const left = Number(style!.match(/left: ([\d.]+)%/)![1]);
    expect(left).toBeCloseTo(((wsoy.first_year! - from) / (to - from)) * 100, 1);
});

test('a filter with no results says so and offers to clear', async ({ adminPage: page }) => {
    await openNew(page, '?nimi=zzzzqqqq');
    await expect(page.locator('.pl-empty')).toContainText('Rajauksilla ei löytynyt kustantajia.');
    await page.getByRole('button', { name: 'Tyhjennä rajaukset' }).click();
    await expect(rows(page).first()).toBeVisible();
});

test('a failed request shows an error with retry', async ({ adminPage: page }) => {
    let fail = true;
    await page.route('**/api/publisherindex', route => (fail ? route.fulfill({ status: 500, body: '{}' }) : route.fallback()));
    await page.goto('/faq');
    await page.evaluate(() => localStorage.setItem('suomisf.publishersPageVersion', 'uusi'));
    await page.goto('/publishers');
    await expect(page.getByRole('alert')).toContainText('Kustantajia ei saatu haettua.', { timeout: 20000 });
    fail = false;
    await page.getByRole('button', { name: 'Yritä uudelleen' }).click();
    await expect(rows(page).first()).toBeVisible({ timeout: 20000 });
});

test('on a phone the rows are cards without the bar, they fit, and the sort select sorts', async ({ adminPage: page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openNew(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    await expect(page.locator('.pl-table thead')).toBeHidden();
    await expect(page.locator('.pl-track').first()).toBeHidden();
    const row = rows(page).filter({ has: page.getByRole('link', { name: 'WSOY', exact: true }) });
    await expect(row.locator('.pl-n')).toHaveText(/^[\d ]+ painosta$/);
    await expect(row.locator('.pl-y')).toBeVisible();
    await page.getByLabel('Järjestys').selectOption({ label: 'Uusimmat ensin' });
    await expect(page).toHaveURL(/jarjestys=vuodet&suunta=laskeva/);
    await expect(page.getByLabel('Järjestys')).toHaveValue('vuodet:laskeva');
    await expect(rows(page).last().locator('.pl-zero')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});

test('the new publisher list has the site\'s own background and no accessibility violations', async ({ adminPage: page }) => {
    await openNew(page, '?nimi=ws');
    const [site, list] = await page.evaluate(() => [
        getComputedStyle(document.body).backgroundColor,
        getComputedStyle(document.querySelector('[data-publishers-page="uusi"]')!).backgroundColor,
    ]);
    expect(list).toBe(site);
    await page.waitForLoadState('networkidle');
    await expectAccessible(page, { include: '[data-publishers-page="uusi"]' });
});
