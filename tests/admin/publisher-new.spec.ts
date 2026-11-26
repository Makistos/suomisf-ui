import { test, expect } from '../fixtures/auth';
import { Page } from '@playwright/test';
import { expectAccessible } from '../fixtures/axe';

// The new publisher page (docs/ui-redesign/pages/publishers.md, identity style) under trial: admins switch with the button or
// Shift+U; everyone else gets the current page (tests/anon|user/publisher-version.spec.ts). The page lists the publisher's
// printings one a row (owner, 2026-11-26: a publisher publishes editions, not works), from GET /api/publishers/:id/editions,
// with its facts, series and magazines from GET /api/publishers/:id/summary.
type Summary = { name: string; fullname: string; editions: number; works: number; first_year: number; last_year: number;
    genres: { abbr: string; name: string; works: number }[];
    series: { id: number; name: string; editions: number }[]; magazines: { id: number; name: string; issues: number }[] };
const WSOY = 387;
const HSFS = 85; // publishes Tähtivaeltaja
const LE_GUIN_FIRST = 4573; // Pimeyden vasen käsi, WSOY 1976

const newPage = (page: Page) => page.locator('[data-publisher-page="uusi"]');
const rows = (page: Page) => page.locator('.er-row');
const count = (page: Page) => page.locator('#pp-count');
const fi = (v: number) => v.toLocaleString('fi-FI').replace(/\s/g, ' ');

async function openNew(page: Page, path: string): Promise<Summary> {
    await page.goto('/faq');
    await page.evaluate(() => localStorage.setItem('suomisf.publisherPageVersion', 'uusi'));
    const summary = page.waitForResponse(r => /\/api\/publishers\/\d+\/summary$/.test(r.url()) && r.status() === 200);
    await page.goto(path);
    await expect(newPage(page)).toBeVisible({ timeout: 20000 });
    const data = await (await summary).json();
    await expect(page.locator('.pp-facts')).not.toHaveText('Haetaan…', { timeout: 20000 });
    return data;
}
const loaded = async (page: Page) => expect(count(page)).toHaveText(/painos/, { timeout: 20000 });

test('the switch button and Shift+U swap the publisher page, apart from the other pages\' choices', async ({ adminPage: page }) => {
    await page.goto(`/publishers/${WSOY}`);
    const toggle = page.getByTestId('page-version');
    await expect(toggle).toHaveText('Uusi kustantajan sivu', { timeout: 20000 });
    await toggle.click();
    await expect(newPage(page)).toBeVisible({ timeout: 20000 });
    await expect(toggle).toHaveText('Nykyinen kustantajan sivu');
    expect(await page.evaluate(() => localStorage.getItem('suomisf.publishersPageVersion'))).not.toBe('uusi');
    await page.keyboard.press('Shift+KeyU');
    await expect(page.locator('main.publisher-page')).toBeVisible({ timeout: 20000 });
});

test('the header gives the name, full name, one line of facts and the links; tabs with counts', async ({ adminPage: page }) => {
    const s = await openNew(page, `/publishers/${WSOY}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('WSOY');
    await expect(page.locator('.pp-full')).toHaveText('Werner Söderström Oy');
    await expect(page.locator('.pp-facts')).toHaveText(
        `${fi(s.editions)} painosta (${fi(s.works)} teosta) vuosina ${s.first_year}–${s.last_year}, ${s.series.length} kustantajan sarjaa.`);
    await expect(page.getByRole('link', { name: 'Kustantajat' })).toHaveAttribute('href', '/publishers');
    await expect(page.getByRole('tab')).toHaveText([`Painokset${fi(s.editions)}`, `Sarjat${s.series.length}`]);
    await expect(page.getByRole('tab', { name: /Painokset/ })).toHaveAttribute('aria-selected', 'true');
    expect(new URL(page.url()).search).toBe('');
});

test('the genre breakdown counts works, most first; a one-genre publisher has none', async ({ adminPage: page }) => {
    const s = await openNew(page, `/publishers/${WSOY}`);
    const section = page.getByRole('complementary', { name: 'Genret' });
    // the six biggest first, the rest from the button (WSOY has more)
    expect(s.genres.length).toBeGreaterThan(6);
    await expect(section.locator('.pp-gbar')).toHaveCount(6);
    const more = section.getByRole('button', { name: `${s.genres.length} genreä kaikkiaan` });
    await expect(more).toHaveAttribute('aria-expanded', 'false');
    await more.click();
    await expect(section.locator('.pp-gbar')).toHaveCount(s.genres.length);
    await expect(section.getByRole('button', { name: 'Näytä vähemmän' })).toHaveAttribute('aria-expanded', 'true');
    await expect(section.locator('.pp-gbar').first()).toHaveText(`${s.genres[0].name}${fi(s.genres[0].works)}`);
    const counts = (await section.locator('.pp-gbar b').allInnerTexts()).map(t => Number(t.replace(/\s/g, '')));
    expect(counts).toEqual(s.genres.map(g => g.works));
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
    // works, not editions: no genre count can exceed the publisher's works
    expect(Math.max(...counts)).toBeLessThanOrEqual(s.works);
    await expect(section).toContainText('Teoksia; teoksella voi olla useampi genre.');
    await section.getByRole('button', { name: 'Näytä vähemmän' }).click();
    await expect(section.locator('.pp-gbar')).toHaveCount(6);
    const hsfs = await openNew(page, `/publishers/${HSFS}`);
    expect(hsfs.genres.length).toBeLessThanOrEqual(1);
    await expect(page.getByRole('complementary', { name: 'Genret' })).toHaveCount(0);
});

test('a reader sees how many of the publisher\'s printings they own; nothing when none', async ({ adminPage: page }) => {
    let own: { editions: number; wishlisted: number } | null = { editions: 12, wishlisted: 2 };
    await page.route('**/api/publishers/387/summary', async route => {
        const response = await route.fetch();
        await route.fulfill({ response, json: { ...(await response.json()), own } });
    });
    await openNew(page, `/publishers/${WSOY}`);
    await expect(page.locator('.pp-own')).toHaveText('Omistat 12 tämän kustantajan painosta; muistilistallasi 2 painosta.');
    own = { editions: 0, wishlisted: 1 };
    await openNew(page, `/publishers/${WSOY}`);
    await expect(page.locator('.pp-own')).toHaveText('Muistilistallasi 1 painos.');
    own = { editions: 0, wishlisted: 0 };
    await openNew(page, `/publishers/${WSOY}`);
    await expect(page.locator('.pp-own')).toHaveCount(0);
});

test('printings come oldest first under year headings, 100 a page, with paging and rows per page', async ({ adminPage: page }) => {
    const s = await openNew(page, `/publishers/${WSOY}`);
    await loaded(page);
    await expect(count(page)).toHaveText(`${fi(s.editions)} painosta`);
    await expect(rows(page)).toHaveCount(100);
    await expect(page.locator('.er-year').first()).toContainText(String(s.first_year));
    const years = (await page.locator('.er-year').allInnerTexts()).map(t => Number(t.slice(0, 4)));
    expect(years).toEqual([...years].sort((a, b) => a - b));
    await page.getByRole('button', { name: 'Seuraava ›' }).click();
    await expect(page).toHaveURL(/sivu=2/);
    await expect(page.locator('.pp-paging')).toContainText('Näytetään 101–200');
    await page.getByLabel('Rivejä').selectOption('50');
    await expect(page).toHaveURL(/riveja=50/);
    await expect(page).not.toHaveURL(/sivu=/);
    await expect(rows(page)).toHaveCount(50);
    await page.getByRole('button', { name: 'Seuraava ›' }).click();
    await page.getByRole('button', { name: '‹ Edellinen' }).click();
    await expect(page).not.toHaveURL(/sivu=/);
});

test('a printing row reads as the old line, linked: author, title, original, label, translators, series', async ({ adminPage: page }) => {
    await openNew(page, `/publishers/${WSOY}?vuodet=1976-1976`);
    await loaded(page);
    await expect(page.getByLabel('Vuodet, vuodesta')).toHaveValue('1976');
    const row = rows(page).filter({ has: page.getByRole('link', { name: 'Pimeyden vasen käsi', exact: true }) });
    await expect(row.locator('.er-line')).toHaveText(
        'Ursula K. Le Guin: Pimeyden vasen käsi (The Left Hand of Darkness, 1969). Hain-sarja. Suom. Kalevi Nyytäjä. Sci-fi -sarja. ');
    // the work's book series, as in the book index (owner, 2026-11-27), linked and with its number
    await expect(row.getByRole('link', { name: 'Hain-sarja' })).toHaveAttribute('href', /\/bookseries\/\d+$/);
    const earthsea = rows(page).filter({ has: page.getByRole('link', { name: 'Maameren velho', exact: true }) });
    await expect(earthsea.locator('.er-bser')).toHaveText('Maameren tarinat 1. ');
    await expect(row.getByRole('link', { name: 'Pimeyden vasen käsi' })).toHaveAttribute('href', `/editions/${LE_GUIN_FIRST}`);
    await expect(row.getByRole('link', { name: 'Ursula K. Le Guin' })).toHaveAttribute('href', /\/people\/\d+$/);
    await expect(row.getByRole('link', { name: 'Kalevi Nyytäjä' })).toHaveAttribute('href', /\/people\/\d+$/);
    await expect(row.getByRole('link', { name: 'Sci-fi -sarja' })).toHaveAttribute('href', /\/pubseries\/\d+$/);
    await expect(row.locator('.er-genres')).toContainText('Science Fiction');
    // a reprint and a new laitos say so; one heading for the year
    await expect(rows(page).filter({ hasText: 'Saatana saapuu Moskovaan 1' }).locator('.er-note')).toHaveText('2. painos. ');
    await expect(rows(page).filter({ hasText: 'Keskiyön kansaa' }).locator('.er-note')).toHaveText('2. laitos. ');
    await expect(page.locator('.er-year')).toHaveCount(1);
    await expect(page.locator('.er-year')).toContainText('1976');
});

test('the text search finds an author or a title, in the URL; Tyhjennä clears', async ({ adminPage: page }) => {
    const s = await openNew(page, `/publishers/${WSOY}`);
    await loaded(page);
    await page.getByLabel('Tekijä tai nimi').fill('le guin');
    await page.getByLabel('Tekijä tai nimi').press('Enter');
    await expect(page).toHaveURL(/haku=le\+guin/);
    await expect(count(page)).toContainText(`/ ${fi(s.editions)}`);
    for (const a of await page.locator('.er-a').allInnerTexts()) expect(a).toContain('Le Guin');
    await page.getByLabel('Tekijä tai nimi').fill('pimeyden');
    await page.getByRole('button', { name: 'Hae' }).click();
    await expect(rows(page).filter({ hasText: 'Pimeyden vasen käsi' }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Tyhjennä', exact: true }).click();
    await expect(page).not.toHaveURL(/haku=/);
    await expect(count(page)).toHaveText(`${fi(s.editions)} painosta`);
});

test('the order changes the list: newest first keeps the year headings, title and author put the year on each row', async ({ adminPage: page }) => {
    const s = await openNew(page, `/publishers/${WSOY}`);
    await loaded(page);
    const order = page.getByLabel('Järjestys');
    await order.selectOption({ label: 'Uusin ensin' });
    await expect(page).toHaveURL(/jarjestys=uusin/);
    await expect(page.locator('.er-year').first()).toContainText(String(s.last_year));
    await order.selectOption({ label: 'Nimi' });
    await expect(page).toHaveURL(/jarjestys=nimi/);
    await expect(page.locator('.er-year')).toHaveCount(0);
    await expect(rows(page).first().locator('.er-y')).toHaveText(/^\d{4}\.$/);
    await order.selectOption({ label: 'Tekijä' });
    await expect(page).toHaveURL(/jarjestys=tekija/);
    await expect(order).toHaveValue('tekija');
    await order.selectOption({ label: 'Vanhin ensin' });
    expect(new URL(page.url()).search).toBe('');
});

test('Kannet shows the same printings as covers, and back', async ({ adminPage: page }) => {
    await openNew(page, `/publishers/${WSOY}?vuodet=1976-1976`);
    await loaded(page);
    const n = await rows(page).count();
    const toggle = page.getByRole('button', { name: 'Kannet' });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(page).toHaveURL(/nakyma=kannet/);
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    // 1976's printings each have a cover of their own or none, so every one is a tile
    await expect(page.locator('.er-covers li')).toHaveCount(n);
    await expect(rows(page)).toHaveCount(0);
    await expect(page.locator('.er-covers').getByRole('link', { name: /Pimeyden vasen käsi/ })).toHaveAttribute('href', `/editions/${LE_GUIN_FIRST}`);
    await toggle.click();
    await expect(page).not.toHaveURL(/nakyma/);
    await expect(rows(page)).toHaveCount(n);
});

test('Kannet shows each cover file once, captioned with the printings that share it (Hobitti)', async ({ adminPage: page }) => {
    await openNew(page, `/publishers/${WSOY}`);
    await loaded(page);
    const response = page.waitForResponse(r => r.url().includes('/api/publishers/387/editions') && r.url().includes('q=hobitti'));
    await page.getByLabel('Tekijä tai nimi').fill('hobitti');
    await page.getByLabel('Tekijä tai nimi').press('Enter');
    type Ed = { id: number; pubyear: number; cover: { image_src: string } | null };
    const editions: Ed[] = (await (await response).json()).editions;
    await loaded(page);
    // the expected tiles from the page's own response: one per cover file, one per printing without a cover
    const bySrc = new Map<string, Ed[]>();
    for (const e of editions) if (e.cover) bySrc.set(e.cover.image_src, [...(bySrc.get(e.cover.image_src) ?? []), e]);
    const shared = [...bySrc.values()].sort((a, b) => b.length - a.length)[0];
    expect(shared.length).toBeGreaterThan(1);
    await page.getByRole('button', { name: 'Kannet' }).click();
    await expect(page.locator('.er-covers li')).toHaveCount(bySrc.size + editions.filter(e => !e.cover).length);
    // no year headings in Kannet: the shared cover's caption gives its printings and years
    await expect(page.locator('.er-year')).toHaveCount(0);
    const years = shared.map(e => e.pubyear);
    const earliest = shared.reduce((a, b) => (b.pubyear < a.pubyear ? b : a));
    const tile = page.locator('.er-covers li').filter({ hasText: `${shared.length} painosta, ${Math.min(...years)}–${Math.max(...years)}` });
    await expect(tile).toHaveCount(1);
    await expect(tile.getByRole('link')).toHaveAttribute('href', `/editions/${earliest.id}`);
    expect(new Set(await page.locator('.er-covers img').evaluateAll(imgs => imgs.map(i => (i as HTMLImageElement).src))).size)
        .toBe(await page.locator('.er-covers img').count());
});

test('the reader\'s own printing is marked on its row', async ({ adminPage: page }) => {
    await page.route('**/api/publishers/387/editions?*', async route => {
        const response = await route.fetch();
        const body = await response.json();
        const e = body.editions.find((x: { id: number }) => x.id === LE_GUIN_FIRST);
        if (e) e.owned = true;
        await route.fulfill({ response, json: body });
    });
    await openNew(page, `/publishers/${WSOY}?vuodet=1976-1976`);
    await loaded(page);
    const row = rows(page).filter({ has: page.getByRole('link', { name: 'Pimeyden vasen käsi', exact: true }) });
    await expect(row.getByRole('img', { name: 'Omistat tämän painoksen' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Omistat tämän painoksen' })).toHaveCount(1);
});

test('Sarjat lists the series with printings and years, every column sorts', async ({ adminPage: page }) => {
    const s = await openNew(page, `/publishers/${WSOY}`);
    await page.getByRole('tab', { name: /Sarjat/ }).click();
    await expect(page).toHaveURL(/valilehti=sarjat/);
    const table = page.getByRole('table', { name: 'Kustantajan sarjat' });
    await expect(table.locator('tbody tr')).toHaveCount(s.series.length);
    await expect(table.locator('th.pp-name')).toHaveAttribute('aria-sort', 'ascending');
    await table.getByRole('button', { name: 'Painoksia' }).click();
    await expect(page).toHaveURL(/sarjat=painoksia/);
    await expect(table.locator('th.pp-n')).toHaveAttribute('aria-sort', 'descending');
    const biggest = Math.max(...s.series.map(x => x.editions));
    await expect(table.locator('tbody tr').first().locator('td.pp-n')).toContainText(fi(biggest));
    await table.getByRole('button', { name: 'Painoksia' }).click();
    await expect(page).toHaveURL(/suunta=nouseva/);
    await table.getByRole('button', { name: 'Vuodet' }).click();
    await expect(table.locator('th.pp-y')).toHaveAttribute('aria-sort', 'ascending');
    await table.getByRole('button', { name: 'Sarja' }).click();
    await expect(page).toHaveURL(/valilehti=sarjat$/);
    await expect(table.getByRole('link', { name: 'Sci-fi -sarja' })).toHaveAttribute('href', /\/pubseries\/\d+$/);
    await page.getByRole('tab', { name: /Painokset/ }).click();
    expect(new URL(page.url()).search).toBe('');
});

test('a publisher with a magazine has a Lehdet tab; one without falls back to the printings', async ({ adminPage: page }) => {
    const s = await openNew(page, `/publishers/${HSFS}?valilehti=lehdet`);
    const mag = s.magazines.find(m => m.name === 'Tähtivaeltaja')!;
    const table = page.getByRole('table', { name: 'Kustantajan lehdet' });
    await expect(table.getByRole('link', { name: 'Tähtivaeltaja' })).toHaveAttribute('href', `/magazines/${mag.id}`);
    await expect(table.locator('tbody tr').first().locator('td.pp-n')).toContainText(fi(mag.issues));
    await expect(page.locator('.pp-facts')).toContainText('1 lehti');
    await openNew(page, `/publishers/${WSOY}?valilehti=lehdet`);
    await expect(page.getByRole('tab', { name: /Lehdet/ })).toHaveCount(0);
    await expect(page.getByRole('tab', { name: /Painokset/ })).toHaveAttribute('aria-selected', 'true');
    await loaded(page);
    await expect(rows(page).first()).toBeVisible();
});

test('an unknown publisher says so', async ({ adminPage: page }) => {
    await page.goto('/faq');
    await page.evaluate(() => localStorage.setItem('suomisf.publisherPageVersion', 'uusi'));
    await page.goto('/publishers/999999');
    await expect(page.getByRole('heading', { name: 'Kustantajaa ei löytynyt' })).toBeVisible({ timeout: 20000 });
});

test('a failed printings request shows an error with retry', async ({ adminPage: page }) => {
    let fail = true;
    await page.route('**/api/publishers/387/editions?*', route => (fail ? route.fulfill({ status: 500, body: '{}' }) : route.fallback()));
    await openNew(page, `/publishers/${WSOY}`);
    await expect(page.getByRole('alert')).toContainText('Painoksia ei saatu haettua.', { timeout: 20000 });
    fail = false;
    await page.getByRole('button', { name: 'Yritä uudelleen' }).click();
    await expect(rows(page).first()).toBeVisible({ timeout: 20000 });
});

test('the admin dial edits the publisher; Poista is off while it has printings', async ({ adminPage: page }) => {
    await openNew(page, `/publishers/${WSOY}`);
    const dial = page.locator('.fixed-dial');
    await dial.locator('button.p-speeddial-button').click();
    // PrimeReact marks a disabled action with a class, not aria-disabled
    await expect(dial.getByRole('menuitem', { name: 'Poista' })).toHaveClass(/p-disabled/);
    await expect(dial.getByRole('menuitem', { name: 'Muokkaa' })).not.toHaveClass(/p-disabled/);
    await dial.locator('.p-speeddial-action').first().click();
    const dialog = page.getByRole('dialog', { name: 'Kustantajan muokkaus' });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('input[name="name"]')).toHaveValue('WSOY');
    await dialog.getByRole('button', { name: /close|sulje/i }).first().click();
    await expect(dialog).toBeHidden();
});

test('on a phone the page fits and the rows wrap', async ({ adminPage: page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openNew(page, `/publishers/${WSOY}?vuodet=1976-1976`);
    await loaded(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    await page.getByRole('button', { name: 'Kannet' }).click();
    await expect(page.locator('.er-covers li').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    await page.getByRole('tab', { name: /Sarjat/ }).click();
    await expect(page.locator('.pp-table thead')).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});

test('the new publisher page has the site\'s own background and no accessibility violations', async ({ adminPage: page }) => {
    await openNew(page, `/publishers/${WSOY}?vuodet=1976-1976`);
    await loaded(page);
    const [site, own] = await page.evaluate(() => [
        getComputedStyle(document.body).backgroundColor,
        getComputedStyle(document.querySelector('[data-publisher-page="uusi"]')!).backgroundColor,
    ]);
    expect(own).toBe(site);
    await page.waitForLoadState('networkidle');
    await expectAccessible(page, { include: '[data-publisher-page="uusi"]' });
    await page.getByRole('tab', { name: /Sarjat/ }).click();
    await expectAccessible(page, { include: '[data-publisher-page="uusi"]' });
});
