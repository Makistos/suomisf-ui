import { test, expect } from '../fixtures/auth';
import { Page } from '@playwright/test';
import { expectAccessible } from '../fixtures/axe';

// The new work page (docs/ui-redesign/pages/work-identity.md, behaviour from
// work.md) under trial: admins switch to it with a button or Shift+U;
// everyone else sees the current page (tests/anon/work-version.spec.ts,
// tests/user/work-version.spec.ts). The numbers are the ones compared with
// the live site in work.md: Le Guin 3 printings, Hugo and Nebula, 4/9 in
// Hain-sarja; Tolkien 20 printings in three laitos.
const LE_GUIN = 3984;
const TOLKIEN = 1514;
const COLLECTION = 3973; // Maailman syntymäpäivä ja muita tarinoita
const TUULEN = 185; // Tuulen tavoittelua: four printings, one cover
const MATKA = 552; // Matka alkaa: one printing with two covers, used only by the cover picker test
const TOLKIEN_2ND = 1752; // 2. painos 1985: two covers
const ATUAN = 3964; // Atuanin holvihaudat: one laitos row, three printings, two covers
const SPARSE = 3407; // Satujen maan taistelu: one printing, no cover
const TOLKIEN_4TH = 10208; // 4. painos 1988

const newPage = (page: Page) => page.locator('[data-work-page="uusi"]');
const fact = (page: Page, label: string) => page.locator('.wn-facts dt', { hasText: label }).locator('xpath=following-sibling::dd[1]');

// The subject headings and the description are closed behind one button (owner, 2026-11-25).
const openAbout = (page: Page) => page.getByRole('button', { name: 'Asiasanat ja kuvaus' }).click();

async function openNew(page: Page, path: string) {
    await page.goto('/');
    await page.evaluate(() => {
        localStorage.setItem('suomisf.workPageVersion', 'uusi');
        localStorage.removeItem('suomisf.work.ryhmittely');
        localStorage.removeItem('suomisf.work.nakyma');
    });
    await page.goto(path);
    await expect(newPage(page)).toBeVisible({ timeout: 20000 });
}

test('the switch button and Shift+U swap the work page, apart from the person page choice', async ({ adminPage: page }) => {
    await page.goto(`/works/${LE_GUIN}`);
    const toggle = page.getByTestId('page-version');
    await expect(toggle).toHaveText('Uusi teossivu', { timeout: 20000 });
    await expect(toggle).toHaveAttribute('aria-keyshortcuts', 'Shift+U');
    await toggle.click();
    await expect(newPage(page)).toBeVisible({ timeout: 20000 });
    await expect(toggle).toHaveText('Nykyinen teossivu');
    await page.reload();
    await expect(newPage(page)).toBeVisible({ timeout: 20000 });

    // The person page keeps its own choice.
    await page.goto('/people/2435');
    await expect(page.locator('main.person-page')).toBeVisible({ timeout: 20000 });

    await page.goto(`/works/${LE_GUIN}`);
    await expect(newPage(page)).toBeVisible({ timeout: 20000 });
    await page.keyboard.press('Shift+KeyU');
    await expect(page.locator('main.work-page')).toBeVisible({ timeout: 20000 });
    await expect(newPage(page)).toHaveCount(0);
});

test('Le Guin: the catalogue record, awards, series order and subject headings', async ({ adminPage: page }) => {
    await openNew(page, `/works/${LE_GUIN}`);
    await expect(page.getByRole('heading', { level: 1, name: 'Pimeyden vasen käsi' })).toBeVisible();
    await expect(page.locator('.wn-orig')).toHaveText('The Left Hand of Darkness');
    // The record in the owner's order: original's language and year, type, genre, then the subgenre next to the genre.
    await expect(page.locator('.wn-facts dt')).toHaveText(['Alkuteos', 'Tyyppi', 'Genre', 'Alalaji', 'Palkinnot', 'Sarja']);
    await expect(fact(page, 'Alkuteos')).toHaveText('englanti, 1969');
    await expect(fact(page, 'Tyyppi')).toHaveText('Romaani');
    await expect(fact(page, 'Genre')).toHaveText('Science Fiction');
    await expect(fact(page, 'Alalaji')).toHaveText('yhteiskunnallinen scifi, antropologinen scifi');
    await expect(fact(page, 'Palkinnot').locator('.wn-award')).toHaveText(['Hugo 1970, paras romaani', 'Nebula 1970, paras romaani']);
    const series = fact(page, 'Sarja');
    await expect(series).toContainText('Hain-sarja');
    await expect(series).toContainText('4/9 alkuteosten ilmestymisjärjestyksessä');
    await expect(series.getByRole('link', { name: '‹ Harhakaupunki' })).toHaveAttribute('href', '/works/3966');
    await expect(series.getByRole('link', { name: 'Maailma, vihreä metsä ›' })).toHaveAttribute('href', '/works/3972');
    // The other subject headings are behind "Asiasanat ja kuvaus", above the description.
    await openAbout(page);
    await expect(page.locator('.wn-subjects dt')).toHaveText(['Tyyli', 'Aiheet', 'Hahmot ja olennot', 'Paikat', 'Aika', 'Listat ja sovitukset']);
    expect(await page.locator('.wn-subjects').evaluate(el => !!(el.compareDocumentPosition(document.querySelector('.wn-desc')!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
    await expect(page.locator('.wn-p-head p')).toHaveText('3 painosta vuosina 1976–1992, WSOY. Suomentanut Kalevi Nyytäjä.');
});

test('a single cover is large enough and opens at full size when clicked', async ({ adminPage: page }) => {
    await openNew(page, `/works/${TUULEN}`);
    const thumb = page.locator('table.wn-et td.c-th img').first();
    expect((await thumb.boundingBox())!.width).toBeGreaterThanOrEqual(44);

    // The table shows the small copy; its "Suurenna kuva" button opens the original file.
    await expect(thumb).toHaveAttribute('src', /\/thumbs\//);
    const cell = page.locator('table.wn-et td.c-th').first();
    await cell.evaluate(el => el.scrollIntoView({ block: 'center' }));
    await cell.getByRole('button', { name: 'Suurenna kuva' }).click();
    const full = page.locator('.p-image-preview');
    await expect(full).toBeVisible();
    await expect(full).toHaveAttribute('src', /\/static\/images\/books\/[^/]+\.(jpe?g|png|webp)$/i);
    await expect(full).not.toHaveAttribute('src', /\/thumbs\//);
    await page.keyboard.press('Escape');
    await expect(full).toHaveCount(0);

    await page.locator('.wn-cover').evaluate(el => el.scrollIntoView({ block: 'center' }));
    await page.locator('.wn-cover').getByRole('button', { name: 'Suurenna kuva' }).click();
    await expect(page.locator('.p-image-preview')).toBeVisible();
    // One cover: no gallery and nothing to choose.
    await expect(page.getByRole('button', { name: /^Näytä kaikki kannet/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Vaihda pääkuva' })).toHaveCount(0);
});

// PrimeReact keeps an empty overlay layer in the page (no content, pointer-events none); an open gallery has its content in it.
const gallery = (page: Page) => page.locator('.p-galleria-mask .p-galleria');

test('several covers: the header cover opens a gallery of all of them, each with its printing', async ({ adminPage: page }) => {
    await openNew(page, `/works/${LE_GUIN}`);
    await expect(page.locator('.wn-cover-note')).toHaveText('Kansi 1976 · 2 kantta');
    await page.getByRole('button', { name: 'Näytä kaikki kannet (2), alkaen: 1. painos 1976, WSOY' }).click();
    await expect(gallery(page)).toBeVisible();
    await expect(gallery(page).locator('.wn-gallery-cap')).toHaveText('1. painos 1976, WSOY');
    // The original file, not the small copy.
    const img = gallery(page).locator('img.wn-gallery-img');
    await expect(img).toHaveAttribute('src', /\/static\/images\/books\/[^/]+\.(jpe?g|png|webp)$/i);
    await expect(gallery(page).locator('img.wn-gallery-thumb')).toHaveCount(2);
    await gallery(page).locator('.p-galleria-item-next').click();
    await expect(gallery(page).locator('.wn-gallery-cap')).toHaveText('2. painos 1986, WSOY');
    await gallery(page).locator('.p-galleria-close').click();
    await expect(gallery(page)).toHaveCount(0);
    // The "2 kantta" link opens it too.
    await page.locator('.wn-cover-note').getByRole('button', { name: '2 kantta' }).click();
    await expect(gallery(page)).toBeVisible();
});

test('a table row with several covers opens a gallery of the row\'s covers', async ({ adminPage: page }) => {
    await openNew(page, `/works/${TOLKIEN}?ryhmittely=kaikki`);
    // One printing with two covers.
    const row = page.locator(`#painos-${TOLKIEN_2ND}`);
    await row.locator('td.c-th').evaluate(el => el.scrollIntoView({ block: 'center' }));
    await row.getByRole('button', { name: /^Näytä rivin kannet \(2\)/ }).click();
    await expect(gallery(page).locator('img.wn-gallery-thumb')).toHaveCount(2);
    await expect(gallery(page).locator('.wn-gallery-cap')).toHaveText('2. painos 1985, WSOY');
    await gallery(page).locator('.p-galleria-close').click();
    await expect(gallery(page)).toHaveCount(0);

    // A row holding many printings (the first laitos, 17 printings): every cover of every printing in it,
    // more than the printings since some have several.
    await openNew(page, `/works/${TOLKIEN}`);
    const first = page.locator('table.wn-et tbody tr').first();
    await first.locator('td.c-th').evaluate(el => el.scrollIntoView({ block: 'center' }));
    const button = first.getByRole('button', { name: /^Näytä rivin kannet \(\d+\): 1\.–36\. painos$/ });
    const n = Number((await button.getAttribute('aria-label'))!.match(/\((\d+)\)/)![1]);
    expect(n).toBeGreaterThan(17);
    await expect(first.locator('.wn-th-n')).toHaveText(String(n));
    await button.click();
    await expect(gallery(page).locator('img.wn-gallery-thumb')).toHaveCount(n);
    await gallery(page).locator('.p-galleria-close').click();
    // A row with one cover keeps the plain full-size view.
    const last = page.locator('table.wn-et tbody tr').last();
    await expect(last.getByRole('button', { name: /^Näytä rivin kannet/ })).toHaveCount(0);
    await last.locator('td.c-th').evaluate(el => el.scrollIntoView({ block: 'center' }));
    await last.getByRole('button', { name: 'Suurenna kuva' }).click();
    await expect(page.locator('.p-image-preview')).toBeVisible();
});

test('each gallery opens over a dark overlay with working arrows and close, whichever opens first', async ({ adminPage: page }) => {
    // The owner's report: a row's gallery opened without its overlay, white controls on the white page, the next arrow
    // under the admin SpeedDial, and no way to close it.
    for (const order of [['row', 'header'], ['header', 'row']]) {
        await openNew(page, `/works/${ATUAN}`);
        for (const which of order) {
            const opener = which === 'row'
                ? page.getByRole('button', { name: /^Näytä rivin kannet \(2\)/ })
                : page.getByRole('button', { name: /^Näytä kaikki kannet \(2\)/ });
            await opener.scrollIntoViewIfNeeded();
            await opener.click();
            await expect(page.locator('.p-galleria-mask.p-component-overlay')).toHaveCount(1);
            expect(Number(await page.locator('.p-galleria-mask.p-component-overlay').evaluate(el => getComputedStyle(el).zIndex))).toBeGreaterThan(1000);
            await expect(gallery(page).locator('.wn-gallery-cap')).toHaveText('1. painos 1977, WSOY');
            await gallery(page).locator('.p-galleria-item-next').click();
            await expect(gallery(page).locator('.wn-gallery-cap')).toHaveText('3. painos 1990, WSOY');
            await gallery(page).locator('.p-galleria-close').click();
            await expect(gallery(page)).toHaveCount(0);
        }
    }
});

test('an admin picks the cover the work page shows, and can return to the default', async ({ adminPage: page }) => {
    await openNew(page, `/works/${MATKA}`);
    const header = page.locator('.wn-cover img');
    const first = await header.getAttribute('src');
    await page.getByRole('button', { name: 'Vaihda pääkuva' }).click();
    const dialog = page.getByRole('dialog', { name: 'Teossivun pääkuva' });
    const choices = dialog.getByRole('group', { name: 'Pääkuva' }).getByRole('button');
    await expect(choices).toHaveCount(3);
    await expect(choices.first()).toHaveAttribute('aria-pressed', 'true');
    const saved = page.waitForResponse(r => r.url().includes(`/works/${MATKA}/cover`) && r.request().method() === 'PUT');
    await choices.nth(2).click();
    expect((await saved).status()).toBe(200);
    await expect(dialog).toHaveCount(0);
    await expect(header).not.toHaveAttribute('src', first!);
    const second = await header.getAttribute('src');
    // Everyone sees it: it is stored, not only in this browser.
    await page.reload();
    await expect(page.locator('.wn-cover img')).toHaveAttribute('src', second!, { timeout: 20000 });

    await page.getByRole('button', { name: 'Vaihda pääkuva' }).click();
    await expect(choices.nth(2)).toHaveAttribute('aria-pressed', 'true');
    await choices.first().click();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('.wn-cover img')).toHaveAttribute('src', first!);
});

test('a failed cover choice says so and leaves the cover as it was', async ({ adminPage: page }) => {
    await page.route(`**/api/works/${LE_GUIN}/cover`, route => route.fulfill({ status: 500, body: '{}' }));
    await openNew(page, `/works/${LE_GUIN}`);
    const before = await page.locator('.wn-cover img').getAttribute('src');
    await page.getByRole('button', { name: 'Vaihda pääkuva' }).click();
    const dialog = page.getByRole('dialog', { name: 'Teossivun pääkuva' });
    await dialog.getByRole('button', { name: 'Pääkuvaksi: 2. painos 1986, WSOY' }).click();
    await expect(dialog.getByRole('alert')).toHaveText('Pääkuvan tallentaminen ei onnistunut.');
    await expect(page.locator('.wn-cover img')).toHaveAttribute('src', before!);
});

test('a title with a long word stays in its column, on desktop and on a phone', async ({ adminPage: page }) => {
    for (const id of [3699, 1758]) { // Tapahtumapaikkana Duma Key; Houkutus: kymmenvuotisjuhlakirja …
        await page.setViewportSize({ width: 1400, height: 1000 });
        await openNew(page, `/works/${id}`);
        const title = (await page.locator('h1.wn-title').boundingBox())!;
        const words = await page.locator('h1.wn-title').evaluate(el => {
            const range = document.createRange();
            range.selectNodeContents(el.firstChild!);
            return Math.max(...[...range.getClientRects()].map(r => r.right));
        });
        const side = (await page.getByRole('complementary', { name: 'Lisätiedot' }).boundingBox())!;
        expect(words).toBeLessThanOrEqual(side.x);
        expect(title.x + title.width).toBeLessThanOrEqual(side.x);
        await page.setViewportSize({ width: 390, height: 844 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    }
});

test('the subject headings and the description are closed behind one button, there is no shelf, and the printings start on the first screen', async ({ adminPage: page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    for (const id of [LE_GUIN, TOLKIEN]) {
        await openNew(page, `/works/${id}`);
        const top = await page.locator('#wn-printings-h').evaluate(el => el.getBoundingClientRect().top + window.scrollY);
        expect(top).toBeLessThan(900);
        // The shelf is gone (owner, 2026-11-25).
        await expect(page.locator('.wn-spine')).toHaveCount(0);
        await expect(page.getByRole('button', { name: /kirjahylly/ })).toHaveCount(0);
    }
    // Tolkien's note is a fact row, not prose.
    await expect(fact(page, 'Lisätietoja')).toContainText('Kokoomateos, suomennos vuoden 1966 korjatusta laitoksesta.');
    const about = page.getByRole('button', { name: 'Asiasanat ja kuvaus' });
    await expect(about).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('.wn-desc')).toHaveCount(0);
    await expect(page.locator('.wn-subjects')).toHaveCount(0);
    await about.click();
    await expect(about).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.wn-subjects dt')).toHaveText(['Aiheet', 'Hahmot ja olennot', 'Listat ja sovitukset']);
    await expect(page.locator('.wn-desc')).toContainText('Taru Sormusten herrasta on kaikenikäisten fantasiaklassikko');
    // The opened region is the one the button names.
    expect(await page.locator('.wn-desc').evaluate(el => el.parentElement!.id)).toBe(await about.getAttribute('aria-controls'));
    await about.press('Enter');
    await expect(page.locator('.wn-desc')).toHaveCount(0);
    await expect(about).toBeFocused();
    await expect(about).toHaveAttribute('aria-expanded', 'false');
});

test('printings are grouped by laitos by default, and the URL stays clean', async ({ adminPage: page }) => {
    await openNew(page, `/works/${TOLKIEN}`);
    await expect(page.getByRole('group', { name: 'Ryhmittely' }).getByRole('button', { name: 'Laitoksittain' })).toHaveAttribute('aria-pressed', 'true');
    expect(new URL(page.url()).searchParams.get('ryhmittely')).toBeNull();
    await expect(page.locator('.wn-version h3')).toHaveText(['1. laitos', '2. laitos', '3. laitos']);
    // "Samanlaiset yhdessä" is now a choice of its own in the URL.
    await page.getByRole('group', { name: 'Ryhmittely' }).getByRole('button', { name: 'Samanlaiset yhdessä' }).click();
    await expect(page).toHaveURL(/ryhmittely=samanlaiset/);
});

test('a merged row opens into its printings, each with its own controls and one ownership request', async ({ adminPage: page }) => {
    const perPrinting: string[] = [];
    const perWork: string[] = [];
    page.on('request', r => {
        if (/\/api\/editions\/\d+\/owner\/\d+$/.test(r.url())) perPrinting.push(r.url());
        if (/\/api\/user\/\d+\/work\/\d+\/ownership$/.test(r.url())) perWork.push(r.url());
    });
    await openNew(page, `/works/${TOLKIEN}`);
    const first = page.locator('.wn-version').first();
    await expect(first.locator('tbody tr')).toHaveCount(1);
    await expect(first.locator('.wn-ownsum')).toHaveText('Et omista');
    await first.getByRole('button', { name: '1.–36. painos', exact: true }).click();
    await expect(first.locator('tr.wn-sub')).toHaveCount(17);
    await expect(first.locator('tr.wn-sub .p-rating')).toHaveCount(17);
    await expect(first.locator('tr.wn-sub').first().getByRole('link', { name: '1. painos' })).toHaveAttribute('href', /\/editions\/\d+/);
    // Each opened printing shows its own cover; the merged row keeps the gallery of all 17 (owner, 2026-11-26).
    const subs = first.locator('tr.wn-sub');
    for (let i = 0; i < 17; i++) await expect(subs.nth(i).locator('td.c-th img')).toHaveCount(1);
    // its own printing's file: the 17 share four covers (1p, 3p, 10p, 22p in the data)
    for (const [label, file] of [['1. painos', '_1p'], ['3. painos', '_3p'], ['6. painos', '_10p'], ['22. painos', '_22p']]) {
        const sub = subs.filter({ has: page.getByRole('link', { name: label, exact: true }) });
        await expect(sub.locator('td.c-th img')).toHaveAttribute('src', new RegExp(`${file}\\.`));
    }
    // the merged row's gallery holds every printing's covers: one each, or the count on a printing with several
    const coverCounts = await subs.locator('td.c-th').evaluateAll(cells => cells.map(c => Number(c.querySelector('.wn-th-n')?.textContent ?? 1)));
    await expect(first.locator('tbody tr:not(.wn-sub) td.c-th .wn-th-n')).toHaveText(String(coverCounts.reduce((a, b) => a + b, 0)));
    // Cover artists and illustrators are links, as on the old rows.
    // The 2. laitos is a merged row, which names only translators; its printings' rows name the cover artist.
    const v2 = page.locator('.wn-version').nth(1);
    await expect(v2.locator('tbody tr:not(.wn-sub) td.c-pub')).not.toContainText('Sami Saramäki');
    await v2.locator('button.wn-exp').click();
    await expect(v2.locator('tr.wn-sub .wn-note').getByRole('link', { name: 'Sami Saramäki' }).first()).toHaveAttribute('href', /\/people\/5457$/);
    const v3 = page.locator('.wn-version').nth(2);
    await expect(v3.locator('.wn-note').getByRole('link', { name: 'J. R. R. Tolkien' })).toHaveAttribute('href', /\/people\/1011$/);
    await page.waitForLoadState('networkidle');
    expect(perWork).toHaveLength(1);
    expect(perPrinting).toHaveLength(0);
});

test('a merged row says only what its printings share: other title in bold, publisher, translators, binding and jackets (Hobitti)', async ({ adminPage: page }) => {
    await openNew(page, '/works/1505');
    const merged = page.locator('.wn-version').nth(1).locator('tbody tr:not(.wn-sub)').first();
    await expect(merged.locator('td.c-ed')).toContainText('1.–24. painos');
    const pub = merged.locator('td.c-pub');
    await expect(pub.locator('b.wn-etitle')).toHaveText('Hobitti eli sinne ja takaisin');
    await expect(pub).not.toContainText('Nimellä');
    // the printings' notes, printing places and other credits stay on their own rows (owner, 2026-11-26)
    await expect(pub).not.toContainText('Kuvitettu');
    await expect(pub).not.toContainText(/Kansi |Kuvitus /);
    await expect(pub).not.toContainText('(');
    await expect(pub.locator('.wn-tr-in')).toHaveText('Suom. Kersti Juva');
    await expect(merged.locator('td.c-book')).toHaveText(/^[^\d]*Kansipaperi, Ylivetokannet/);
    await expect(merged.locator('td.c-book')).not.toContainText(/ s\.| cm/);
    await expect(merged.locator('td.c-pages')).toHaveText('');
    // its first printing's row still has them all
    await merged.getByRole('button', { name: '1.–24. painos', exact: true }).click();
    const firstPrinting = page.locator('.wn-version').nth(1).locator('tr.wn-sub').first();
    // a printing's row in the owner's order (2026-11-26): other title in bold, publisher, translators, other credits, notes
    await expect(firstPrinting.locator('td.c-pub b.wn-etitle')).toHaveText('Hobitti eli sinne ja takaisin');
    await expect(firstPrinting.locator('td.c-pub')).not.toContainText('Nimellä');
    const order = await firstPrinting.locator('td.c-pub > *').evaluateAll(els => els.map(el => el.textContent ?? ''));
    expect(order.map(t => t.startsWith('Hobitti') ? 'title' : t.startsWith('WSOY') ? 'publisher' : t.startsWith('Suom.') ? 'translators'
        : /^(Kansi|Kuvitus) /.test(t) ? 'credits' : 'notes')).toEqual(['title', 'publisher', 'translators', 'credits', 'notes']);
    expect(order[4]).toContain('Kuvitettu');
    await expect(firstPrinting.locator('td.c-pub').getByRole('link', { name: 'J. R. R. Tolkien' }).first()).toHaveAttribute('href', /\/people\/1011$/);
    await expect(firstPrinting.locator('td.c-pub')).toContainText('Kuvitettu');
    // Kansipaperi goes with the binding on a printing's row too, not in its notes
    await expect(firstPrinting.locator('td.c-book')).toContainText('Kansipaperi');
    await expect(firstPrinting.locator('td.c-bind')).toContainText('Kansipaperi');
    await expect(firstPrinting.locator('td.c-pub')).not.toContainText('Kansipaperi');
    // a merged row names its publisher once, then the series under it: "WSOY", "Bon", not "WSOY, Bon"
    const v4 = page.locator('.wn-version').filter({ has: page.getByRole('heading', { name: '4. laitos' }) });
    const v4pub = v4.locator('tbody tr:not(.wn-sub)').first().locator('td.c-pub > div');
    await expect(v4pub).toHaveText(['WSOY', 'Bon']);
});

test('grouping lives in the URL, survives reload and back, and the next work opens with it', async ({ adminPage: page }) => {
    await openNew(page, `/works/${TOLKIEN}`);
    await page.getByRole('group', { name: 'Ryhmittely' }).getByRole('button', { name: 'Kaikki' }).click();
    await expect(page).toHaveURL(/ryhmittely=kaikki/);
    await expect(page.locator('.wn-version tbody tr')).toHaveCount(20);
    await page.reload();
    await expect(page.locator('.wn-version tbody tr')).toHaveCount(20, { timeout: 20000 });
    // Away and back: the URL brings the grouping with it.
    await page.goto(`/works/${LE_GUIN}?ryhmittely=samanlaiset`);
    await expect(newPage(page)).toBeVisible({ timeout: 20000 });
    await page.goBack();
    await expect(page).toHaveURL(/ryhmittely=kaikki/);
    await expect(page.locator('.wn-version tbody tr')).toHaveCount(20, { timeout: 20000 });
    await page.getByRole('group', { name: 'Ryhmittely' }).getByRole('button', { name: 'Laitoksittain' }).click();
    // Another work without the parameter: the last choice on this device.
    await page.goto(`/works/${LE_GUIN}`);
    await expect(newPage(page)).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('group', { name: 'Ryhmittely' }).getByRole('button', { name: 'Laitoksittain' })).toHaveAttribute('aria-pressed', 'true');
});

test('/editions/:id opens the new page with that printing picked and its cover in the header', async ({ adminPage: page }) => {
    await openNew(page, `/editions/${TOLKIEN_4TH}`);
    await expect(page.locator('.wn-cover-note')).toHaveText(/^4\. painoksen kansi, 1988 · \d+ kantta$/);
    const row = page.locator(`#painos-${TOLKIEN_4TH}`);
    await expect(row).toHaveClass(/wn-hl/);
    await expect(row).toBeInViewport();
});

test('in the site\'s content column an admin gets the Kirja column and the ⋯ menu; a collection\'s menu has its stories', async ({ adminPage: page }) => {
    await openNew(page, `/works/${COLLECTION}`);
    await expect(page.getByRole('heading', { name: 'Sisältö' })).toBeVisible();
    const table = page.locator('table.wn-et').first();
    await expect(table.getByRole('columnheader', { name: 'Kirja' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'ISBN' })).toBeHidden();
    await table.getByRole('button', { name: /^Ylläpitotoiminnot/ }).first().click();
    const menu = page.locator('.p-menu-overlay');
    await expect(menu.getByText('Novellit ja artikkelit')).toBeVisible();
    await expect(menu.getByText('Kopioi painos')).toBeVisible();
});

test('a work with little data: no button, no grouping, no laitos heading', async ({ adminPage: page }) => {
    await openNew(page, `/works/${SPARSE}`);
    await expect(page.locator('.wn-orig')).toHaveCount(0);
    await expect(fact(page, 'Julkaistu')).toHaveText(/^\d{4}$/);
    // Nothing to open: no buttons and no empty subject section.
    await expect(page.getByRole('button', { name: 'Asiasanat ja kuvaus' })).toHaveCount(0);
    await expect(page.locator('.wn-cover')).toHaveCount(0);
    await expect(page.getByRole('group', { name: 'Painokset hyllyssä' })).toHaveCount(0);
    await expect(page.getByRole('group', { name: 'Ryhmittely' })).toHaveCount(0);
    await expect(page.locator('.wn-v-head')).toHaveCount(0);
    await expect(page.locator('table.wn-et tbody tr')).toHaveCount(1);
});

test('admin tools: the history opens in a dialog and the Kirjasampo box is in the sidebar', async ({ adminPage: page }) => {
    await openNew(page, `/works/${LE_GUIN}`);
    await expect(page.getByRole('complementary', { name: 'Lisätiedot' }).getByRole('heading', { name: 'Ylläpitäjille' })).toBeVisible();
    await page.getByRole('complementary', { name: 'Lisätiedot' }).getByRole('button', { name: 'Muutoshistoria' }).click();
    await expect(page.getByRole('dialog', { name: 'Muutoshistoria' })).toBeVisible();
});

test('on a phone the page fits, the printings are cards and the view toggle is gone', async ({ adminPage: page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openNew(page, `/works/${TOLKIEN}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    await expect(page.locator('table.wn-et thead').first()).toBeHidden();
    await expect(page.getByRole('group', { name: 'Näkymä' })).toBeHidden();
    // The reading mark comes right after the record.
    await expect(page.locator('.wn-narrow').first().getByRole('heading', { name: 'Oma lukumerkintä' })).toBeVisible();
    // Record, the subject headings and description button, then the printings.
    const order = await page.evaluate(() => [...document.querySelectorAll('h1, .wn-disc, #wn-printings-h')]
        .filter(el => (el as HTMLElement).offsetParent !== null).map(el => el.id || el.textContent!.trim() || el.tagName));
    expect(order).toEqual(['Taru sormusten herrasta', 'Asiasanat ja kuvaus', 'wn-printings-h']);
    await openAbout(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);

    // Le Guin: a long word in the series row once widened the page, the facts were squeezed beside the cover,
    // and the translator cell kept its desktop width in the cards (one letter a line).
    await openNew(page, `/works/${LE_GUIN}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    const cover = (await page.locator('.wn-cover').boundingBox())!;
    const facts = (await page.locator('.wn-facts').boundingBox())!;
    expect(facts.y).toBeGreaterThanOrEqual(cover.y + cover.height - 1);
    expect(Math.abs(facts.x - cover.x)).toBeLessThanOrEqual(1);
    // The title follows the author closely, not spread over the cover's height.
    const byline = (await page.locator('.wn-byline').boundingBox())!;
    const title = (await page.locator('h1.wn-title').boundingBox())!;
    expect(title.y - (byline.y + byline.height)).toBeLessThan(16);
    const translator = page.locator('table.wn-et td.c-tr').first();
    expect((await translator.boundingBox())!.width).toBeGreaterThan(200);
});

test('the new work page has the site\'s own background and no accessibility violations', async ({ adminPage: page }) => {
    await openNew(page, `/works/${TOLKIEN}`);
    const [site, work] = await page.evaluate(() => [
        getComputedStyle(document.body).backgroundColor,
        getComputedStyle(document.querySelector('[data-work-page="uusi"]')!).backgroundColor,
    ]);
    expect(work).toBe(site);
    await page.waitForLoadState('networkidle');
    await expectAccessible(page, { include: '[data-work-page="uusi"]' });
    // And with the subject headings and the description open.
    await openAbout(page);
    await expectAccessible(page, { include: '[data-work-page="uusi"]' });
});
