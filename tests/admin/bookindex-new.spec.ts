import { test, expect } from '../fixtures/auth';
import { Page } from '@playwright/test';
import { expectAccessible } from '../fixtures/axe';

// The new book index (docs/ui-redesign/pages/book-index.md, identity style) under trial: admins switch with the button or
// Shift+U; everyone else gets the current page (tests/anon|user/bookindex-version.spec.ts). GET /api/bookindex pages on the server.
const newPage = (page: Page) => page.locator('[data-bookindex-page="uusi"]');
const rows = (page: Page) => page.locator('.bn-row');
const count = (page: Page) => page.locator('#bn-count');

async function openNew(page: Page, query = '') {
    await page.goto('/faq');
    await page.evaluate(() => localStorage.setItem('suomisf.bookindexPageVersion', 'uusi'));
    await page.goto(`/bookindex${query}`);
    await expect(newPage(page)).toBeVisible({ timeout: 20000 });
    await expect(count(page)).toContainText(/teos/, { timeout: 20000 });
}
const total = (page: Page) => count(page).locator('b').innerText().then(t => Number(t.replace(/\D/g, '')));

test('the switch button and Shift+U swap the book index, apart from the other pages\' choices', async ({ adminPage: page }) => {
    await page.goto('/bookindex');
    const toggle = page.getByTestId('page-version');
    await expect(toggle).toHaveText('Uusi kirjasivu', { timeout: 20000 });
    await toggle.click();
    await expect(newPage(page)).toBeVisible({ timeout: 20000 });
    await expect(toggle).toHaveText('Nykyinen kirjasivu');
    await page.waitForLoadState('networkidle');
    await page.goto('/works/3984');
    await expect(page.locator('main.work-page')).toBeVisible({ timeout: 20000 });
    await page.waitForLoadState('networkidle');
    await page.goto('/bookindex');
    await expect(newPage(page)).toBeVisible({ timeout: 20000 });
    await page.keyboard.press('Shift+KeyU');
    await expect(page.getByRole('heading', { name: 'Kirjatietokanta' })).toBeVisible({ timeout: 20000 });
});

test('the page lists every work before any search, grouped by author, 200 a page by default', async ({ adminPage: page }) => {
    await openNew(page);
    await expect(page.locator('.bn-head p')).toHaveText(/^Kaikki bibliografian [\d\s]+ teosta\./);
    const n = await total(page);
    expect(n).toBeGreaterThan(1000);
    await expect(rows(page)).toHaveCount(200);
    await expect(page.locator('.bn-paging')).toContainText(`Näytetään 1–200 / ${n.toLocaleString('fi-FI').replace(/\s/g, ' ')}`);
    // The defaults (owner, 2026-11-26): grouped by author and 200 rows, neither written in the URL.
    await expect(page.getByLabel('Ryhmittele tekijöittäin')).toBeChecked();
    await expect(page.locator('.bn-group').first()).toBeVisible();
    await expect(page.getByLabel('Rivejä')).toHaveValue('200');
    expect(new URL(page.url()).search).toBe('');
});

test('text fields search on Enter, land in the URL and survive reload and back', async ({ adminPage: page }) => {
    await openNew(page);
    const all = await total(page);
    await page.getByLabel('Tekijä', { exact: true }).fill('Le Guin');
    await page.getByLabel('Tekijä', { exact: true }).press('Enter');
    await expect(page).toHaveURL(/tekija=Le\+Guin/);
    await expect(count(page)).toContainText('tekijä "Le Guin"');
    const leGuin = await total(page);
    expect(leGuin).toBeGreaterThan(20);
    expect(leGuin).toBeLessThan(all);
    const row = rows(page).filter({ has: page.getByRole('link', { name: 'Pimeyden vasen käsi', exact: true }) });
    // Author first, then the title, as on the old list; and what the old list showed under it.
    // Grouped by default: the heading names the author.
    await expect(page.locator('.bn-group').first()).toContainText('Ursula K. Le Guin');
    await expect(row.locator('.bn-orig')).toHaveText(' (The Left Hand of Darkness, 1969)');
    // Text only, as on the old list (owner, 2026-11-26): no covers in the rows.
    await expect(page.locator('.bn-rows img')).toHaveCount(0);
    await expect(row.getByRole('link', { name: 'Hain-sarja' })).toBeVisible();
    // The first printing under the title, then every other printing on its own line, as on the old list.
    await expect(row.locator('.bn-first .bn-pub')).toHaveText('Suom. Kalevi Nyytäjä. WSOY 1976. Sci-fi -sarja.');
    await expect(row.locator('.bn-first').getByRole('link', { name: 'WSOY' })).toHaveAttribute('href', /\/publishers\/\d+$/);
    await expect(row.locator('.bn-ed')).toHaveText(['2. painos: WSOY 1986. Best Seller.', '3. painos: WSOY 1992.']);
    await expect(row.locator('.bn-ed').first().getByRole('link', { name: 'Best Seller' })).toHaveAttribute('href', /\/pubseries\/\d+$/);
    // A single printing has only the first line.
    const single = rows(page).filter({ has: page.getByRole('link', { name: 'Haikaran silmä', exact: true }) });
    await expect(single.locator('.bn-first .bn-pub')).toContainText('Vaskikirjat 2015.');
    await expect(single.locator('.bn-ed')).toHaveCount(0);
    await page.reload();
    await expect(count(page)).toContainText('tekijä "Le Guin"', { timeout: 20000 });
    await expect(page.getByLabel('Tekijä', { exact: true })).toHaveValue('Le Guin');
    await page.goBack();
    await expect(count(page)).not.toContainText('Le Guin');
    await expect(page.getByLabel('Tekijä', { exact: true })).toHaveValue('');
});

test('chips, letters and selects update the results at once; a letter loads one page quickly', async ({ adminPage: page }) => {
    await openNew(page);
    const all = await total(page);
    await page.getByRole('group', { name: 'Tyyppi' }).getByRole('button', { name: 'Kokoelma' }).click();
    await expect(page).toHaveURL(/tyyppi=kokoelma/);
    await expect(page.getByRole('group', { name: 'Tyyppi' }).getByRole('button', { name: 'Kokoelma' })).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => total(page)).toBeLessThan(all);
    await page.getByRole('group', { name: 'Genre' }).getByRole('button', { name: 'Kauhu', exact: true }).click();
    await expect(page).toHaveURL(/genre=K(&|$)/);
    await expect(count(page)).toContainText('kokoelma, Kauhu');
    const response = page.waitForResponse(r => r.url().includes('/api/bookindex') && r.url().includes('initial=L'));
    const started = Date.now();
    await page.getByRole('group', { name: 'Tekijän sukunimi alkaa' }).getByRole('button', { name: 'L', exact: true }).click();
    expect((await response).status()).toBe(200);
    expect(Date.now() - started).toBeLessThan(3000);
    await expect(page).toHaveURL(/kirjain=L/);
    for (const a of await page.locator('.bn-a').allInnerTexts()) expect(a.length).toBeGreaterThan(0);
    // Nationality is a select; it updates at once too.
    await page.getByLabel('Kansallisuus').selectOption({ label: 'Yhdysvallat' });
    await expect(page).toHaveURL(/kansallisuus=\d+/);
    await expect(count(page)).toContainText('Yhdysvallat');
    await page.getByRole('button', { name: 'Tyhjennä' }).first().click();
    await expect(page).toHaveURL(/\/bookindex$/);
    await expect.poll(() => total(page)).toBe(all);
});

test('the user\'s own printings are marked: a star for owned, a bookmark for the wishlist', async ({ adminPage: page }) => {
    await page.route('**/api/bookindex?*', async route => {
        const response = await route.fetch();
        const body = await response.json();
        const w = body.works.find((x: { id: number }) => x.id === 3984);
        if (w) { w.editions[0].owned = true; w.editions[1].wishlisted = true; }
        await route.fulfill({ response, json: body });
    });
    await openNew(page, '?tekija=Le+Guin&nimi=Pimeyden');
    const row = rows(page).filter({ has: page.getByRole('link', { name: 'Pimeyden vasen käsi', exact: true }) });
    // Each mark on its own printing's line: owned the first (1976), wishlisted the 2. painos (1986).
    await expect(row.getByRole('img', { name: 'Omistat tämän painoksen' })).toHaveCount(1);
    await expect(row.locator('.bn-first').getByRole('img', { name: 'Omistat tämän painoksen' })).toHaveCount(1);
    await expect(row.getByRole('img', { name: 'Muistilistallasi' })).toHaveCount(1);
    await expect(row.locator('.bn-ed').first().getByRole('img', { name: 'Muistilistallasi' })).toHaveCount(1);
    await expect(row.locator('.bn-ed').first()).toContainText('2. painos: WSOY 1986.');
});

test('a new laitos shows its own title and translators; a reprint that differs only by number and year is left out (Stoker\'s Kammoittava kreivi)', async ({ adminPage: page }) => {
    await openNew(page, '?tekija=Stoker&nimi=Kammoittava');
    const row = rows(page).filter({ has: page.getByRole('link', { name: 'Kammoittava kreivi', exact: true }) });
    await expect(row.locator('.bn-orig')).toHaveText(' (Dracula, 1897)');
    await expect(row.locator('.bn-first')).toHaveText('Suom. Risto Kalliomaa. Nide 1952.');
    // The owner's example (2026-11-26) on the test data, whose later printings keep the Finnish title: 1992 (2. and 3. painos),
    // 2014 (as 2010) and 2024-2025 (as 2023) are left out; the 3. laitos comes last with its own translators.
    await expect(row.locator('.bn-ed')).toHaveText([
        '2. laitos: Dracula. Suom. Jarkko Laine. Otava 1977.',
        '2. laitos, 4. painos: Otava 2001. Loisto.',
        '2. laitos, 5. painos: Dracula. Otava 2007. Keskiyön kirjasto.',
        '2. laitos, 6. painos: Otava 2010. Seven.',
        '2. laitos, 7. painos: Otava 2023. Otavan klassikot.',
        '3. laitos: Suom. Johan Werkmäster, Ari Sainio. Kehitysvammaliitto 2017.',
    ]);
});

test('a left-out reprint the reader owns is shown with its mark', async ({ adminPage: page }) => {
    await page.route('**/api/bookindex?*', async route => {
        const response = await route.fetch();
        const body = await response.json();
        const w = body.works.find((x: { id: number }) => x.id === 1332);
        const reprint = w?.editions.find((e: { pubyear: number; editionnum: number }) => e.pubyear === 1992 && e.editionnum === 2);
        if (reprint) reprint.owned = true;
        await route.fulfill({ response, json: body });
    });
    await openNew(page, '?tekija=Stoker&nimi=Kammoittava');
    const row = rows(page).filter({ has: page.getByRole('link', { name: 'Kammoittava kreivi', exact: true }) });
    const owned = row.locator('.bn-ed').filter({ has: page.getByRole('img', { name: 'Omistat tämän painoksen' }) });
    await expect(owned).toHaveText('2. laitos, 2. painos: Dracula. Otava 1992.');
    await expect(row.locator('.bn-ed')).toHaveCount(7);
});

test('grouped by author the rows leave out the author; ungrouped each row starts with it', async ({ adminPage: page }) => {
    await openNew(page, '?tekija=Le+Guin');
    await expect(page.locator('.bn-group').first()).toContainText('Ursula K. Le Guin');
    await expect(rows(page).first().locator('.bn-a')).toHaveCount(0);
    await openNew(page, '?tekija=Le+Guin&ryhmittely=ei');
    await expect(page.locator('.bn-group')).toHaveCount(0);
    const row = rows(page).filter({ has: page.getByRole('link', { name: 'Pimeyden vasen käsi', exact: true }) });
    // "Author: Title" on one line, as on the old list.
    await expect(row.locator('.bn-tline')).toHaveText(/^Ursula K\. Le Guin: Pimeyden vasen käsi/);
    await expect(row.locator('.bn-a').getByRole('link', { name: 'Ursula K. Le Guin' })).toHaveAttribute('href', /\/people\/\d+$/);
});

test('typing is kept when a chip is clicked before searching', async ({ adminPage: page }) => {
    await openNew(page);
    await page.getByLabel('Nimi', { exact: true }).fill('vasen');
    await page.getByRole('group', { name: 'Tyyppi' }).getByRole('button', { name: 'Romaani' }).click();
    await expect(page).toHaveURL(/tyyppi=romaani/);
    await expect(page.getByLabel('Nimi', { exact: true })).toHaveValue('vasen');
});

test('year ranges search for the original\'s year and for any printing', async ({ adminPage: page }) => {
    await openNew(page);
    await page.getByLabel('Alkuteos julkaistu, vuodesta').fill('1960');
    await page.getByLabel('Alkuteos julkaistu, vuoteen').fill('1969');
    await page.getByRole('button', { name: 'Hae' }).click();
    await expect(page).toHaveURL(/alkuteos=1960-1969/);
    await expect(count(page)).toContainText('alkuteos 1960–1969');
    for (const y of await page.locator('.bn-y').allInnerTexts()) expect(Number(y)).toBeGreaterThanOrEqual(1960);
    for (const y of await page.locator('.bn-y').allInnerTexts()) expect(Number(y)).toBeLessThanOrEqual(1969);
    await page.getByLabel('Painettu, vuodesta').fill('2020');
    await page.getByLabel('Painettu, vuodesta').press('Enter');
    await expect(page).toHaveURL(/painettu=2020-/);
});

test('paging, rows per page, sorting and grouping; no covers view', async ({ adminPage: page }) => {
    await openNew(page);
    const firstPage = await page.locator('.bn-t').allInnerTexts();
    await page.getByRole('button', { name: 'Seuraava ›' }).click();
    await expect(page).toHaveURL(/sivu=2/);
    await expect(page.locator('.bn-paging')).toContainText('Näytetään 201–400');
    expect(await page.locator('.bn-t').allInnerTexts()).not.toEqual(firstPage);
    await page.getByLabel('Rivejä').selectOption('100');
    await expect(page).toHaveURL(/riveja=100/);
    await expect(page).not.toHaveURL(/sivu=/);
    await expect(rows(page)).toHaveCount(100);
    const sorted = page.waitForResponse(r => r.url().includes('/api/bookindex') && r.url().includes('sort=newest'));
    await page.getByLabel('Järjestys').selectOption({ label: 'Uusin ensin' });
    await expect(page).toHaveURL(/jarjestys=uusin/);
    await sorted;
    await expect(count(page)).not.toContainText('Haetaan');
    const years = (await page.locator('.bn-y').allInnerTexts()).map(Number);
    expect(years).toEqual([...years].sort((a, b) => b - a));
    await page.getByLabel('Järjestys').selectOption({ label: 'Tekijä ja nimi' });
    // The box follows the URL, which React Router updates in a transition, so it changes a moment after the click.
    await expect(page.locator('.bn-group').first()).toBeVisible();
    await page.getByLabel('Ryhmittele tekijöittäin').click();
    await expect(page).toHaveURL(/ryhmittely=ei/);
    await expect(page.getByLabel('Ryhmittele tekijöittäin')).not.toBeChecked();
    await expect(page.locator('.bn-group')).toHaveCount(0);
    await expect(page.getByRole('group', { name: 'Näkymä' })).toHaveCount(0);
});

test('"Tilastot tästä hausta" counts genres and tags for the whole search, follows the filters and stays in the URL', async ({ adminPage: page }) => {
    await openNew(page, '?tekija=Le+Guin');
    const link = page.getByRole('button', { name: 'Tilastot tästä hausta' });
    await expect(link).toHaveAttribute('aria-expanded', 'false');
    let response = page.waitForResponse(r => r.url().includes('/api/bookindex/stats?'));
    await link.click();
    let stats = (await (await response).json());
    // The whole search, not the page: no paging or sort sent.
    const sent = new URL((await response).url()).searchParams;
    expect(sent.get('author')).toBe('Le Guin');
    expect(sent.has('page') || sent.has('rows') || sent.has('sort')).toBe(false);
    expect(stats.total).toBe(await total(page));
    await expect(page).toHaveURL(/tilastot=1/);
    const hide = page.getByRole('button', { name: 'Piilota tilastot' });
    await expect(hide).toHaveAttribute('aria-expanded', 'true');
    const bars = page.locator('.bn-gbar');
    await expect(bars).toHaveCount(stats.genres.length);
    await expect(bars.first()).toContainText(stats.genres[0].name);
    await expect(bars.first()).toContainText(String(stats.genres[0].works));
    await expect(page.locator('.bn-tags li').first()).toContainText(stats.tags[0].name);
    await expect(page.locator('.bn-tags a').first()).toHaveAttribute('href', `/tags/${stats.tags[0].id}`);
    // A filter change recounts; the page number doesn't matter.
    response = page.waitForResponse(r => r.url().includes('/api/bookindex/stats?') && r.url().includes('genre=SF'));
    await page.getByRole('group', { name: 'Genre' }).getByRole('button', { name: 'Science Fiction', exact: true }).click();
    stats = (await (await response).json());
    await expect(bars.filter({ hasText: 'Science Fiction' })).toContainText(String(stats.total));
    // Survives reload; Tyhjennä clears the filters but keeps the statistics open.
    await page.reload();
    await expect(page.locator('.bn-stats-genres')).toBeVisible({ timeout: 20000 });
    await page.getByRole('button', { name: 'Tyhjennä' }).first().click();
    await expect(page).toHaveURL(/\/bookindex\?tilastot=1$/);
    await expect(page.locator('.bn-snote').filter({ hasText: /yleisintä [\d\s]+ asiasanasta/ })).toBeVisible({ timeout: 20000 });
    await page.getByRole('button', { name: 'Piilota tilastot' }).click();
    await expect(page.locator('.bn-stats')).toHaveCount(0);
    await expect(page).toHaveURL(/\/bookindex$/);
});

test('statistics that fail to load show an error with retry', async ({ adminPage: page }) => {
    let fail = true;
    await page.route('**/api/bookindex/stats?*', route => (fail ? route.fulfill({ status: 500, body: '{}' }) : route.fallback()));
    await openNew(page, '?tekija=Le+Guin&tilastot=1');
    await expect(page.getByRole('alert')).toContainText('Tilastoja ei saatu haettua.', { timeout: 20000 });
    fail = false;
    await page.getByRole('alert').getByRole('button', { name: 'Yritä uudelleen' }).click();
    await expect(page.locator('.bn-stats-genres')).toBeVisible({ timeout: 20000 });
});

test('a search with no results says so and offers to clear', async ({ adminPage: page }) => {
    await openNew(page, '?tekija=zzzzqqqq');
    await expect(page.locator('.bn-empty')).toContainText('Haulla ei löytynyt kirjoja.');
    await page.getByRole('button', { name: 'Tyhjennä rajaukset' }).click();
    await expect(rows(page)).toHaveCount(200);
});

test('a failed request shows an error with retry', async ({ adminPage: page }) => {
    let fail = true;
    await page.route('**/api/bookindex?*', route => (fail ? route.fulfill({ status: 500, body: '{}' }) : route.fallback()));
    await page.goto('/faq');
    await page.evaluate(() => localStorage.setItem('suomisf.bookindexPageVersion', 'uusi'));
    await page.goto('/bookindex?tekija=Le+Guin');
    await expect(page.getByRole('alert')).toContainText('Kirjoja ei saatu haettua.', { timeout: 20000 });
    fail = false;
    await page.getByRole('button', { name: 'Yritä uudelleen' }).click();
    await expect(rows(page).first()).toBeVisible({ timeout: 20000 });
});

test('on a phone the page fits, the first two fields show and "Lisää rajauksia" opens the rest', async ({ adminPage: page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openNew(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    await expect(page.getByLabel('Tekijä', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Nimi', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Alkuperäinen nimi')).toBeHidden();
    await expect(page.getByRole('group', { name: 'Genre' })).toBeHidden();
    const more = page.getByRole('button', { name: 'Lisää rajauksia' });
    await expect(more).toHaveAttribute('aria-expanded', 'false');
    await more.click();
    await expect(page.getByLabel('Alkuperäinen nimi')).toBeVisible();
    await expect(page.getByRole('group', { name: 'Genre' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});

test('the new book index has the site\'s own background and no accessibility violations', async ({ adminPage: page }) => {
    await openNew(page, '?tekija=Le+Guin');
    const [site, index] = await page.evaluate(() => [
        getComputedStyle(document.body).backgroundColor,
        getComputedStyle(document.querySelector('[data-bookindex-page="uusi"]')!).backgroundColor,
    ]);
    expect(index).toBe(site);
    await page.waitForLoadState('networkidle');
    await expectAccessible(page, { include: '[data-bookindex-page="uusi"]' });
});
