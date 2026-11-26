import { test, expect } from '../fixtures/auth';
import { Page } from '@playwright/test';
import { expectAccessible } from '../fixtures/axe';

// The new person page (docs/ui-redesign/pages/person-identity.md) under trial:
// admins switch to it with a button or Shift+U; everyone else sees the
// current page (tests/anon/person-version.spec.ts). The expected numbers are
// the ones compared with the live site in docs/ui-redesign/pages/person.md.
const LE_GUIN = 2435;
const MAKELA = 191;
const KING = 2286;
const HUNTER = 2053;
const TAN = 8151;
const LEINONEN = 2370; // seven tabs

const newPage = (page: Page) => page.locator('[data-person-page="uusi"]');
const fact = (page: Page, label: string) => page.locator('.pn-facts dt', { hasText: label }).locator('xpath=following-sibling::dd[1]');
const tab = (page: Page, name: RegExp) => page.getByRole('tab', { name });

async function openNew(page: Page, id: number, query = '') {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('suomisf.personPageVersion', 'uusi'));
    await page.goto(`/people/${id}${query}`);
    await expect(newPage(page)).toBeVisible({ timeout: 20000 });
}

test('the switch button and Shift+U swap between the current and the new page, and the choice stays', async ({ adminPage: page }) => {
    await page.goto(`/people/${LE_GUIN}`);
    const toggle = page.getByTestId('page-version');
    await expect(toggle).toHaveText('Uusi henkilösivu', { timeout: 20000 });
    await expect(toggle).toHaveAttribute('aria-keyshortcuts', 'Shift+U');
    await expect(page.locator('main.person-page')).toBeVisible();

    await toggle.click();
    await expect(newPage(page)).toBeVisible({ timeout: 20000 });
    await expect(toggle).toHaveText('Nykyinen henkilösivu');

    // Stays on another person and after a reload.
    await page.goto(`/people/${MAKELA}`);
    await expect(newPage(page)).toBeVisible({ timeout: 20000 });
    await page.reload();
    await expect(newPage(page)).toBeVisible({ timeout: 20000 });

    // The hotkey goes back...
    await page.keyboard.press('Shift+KeyU');
    await expect(page.locator('main.person-page')).toBeVisible({ timeout: 20000 });
    await expect(newPage(page)).toHaveCount(0);
    // ...but does nothing while typing in a field (the menu's search box).
    await page.getByPlaceholder('Etsi').first().focus();
    await page.keyboard.press('Shift+KeyU');
    await expect(page.locator('main.person-page')).toBeVisible();
    await expect(newPage(page)).toHaveCount(0);
});

test('Le Guin: record, counts and roles from her own contributions', async ({ adminPage: page }) => {
    await openNew(page, LE_GUIN);
    await expect(page.getByRole('heading', { level: 1, name: 'Ursula K. Le Guin' })).toBeVisible();
    await expect(fact(page, 'Koko nimi')).toHaveText('Ursula Kroeber Le Guin');
    await expect(fact(page, 'Elinvuodet')).toHaveText('1929–2018');
    // She only appears in a non-fiction book: no "tietokirjailija".
    await expect(fact(page, 'Roolit')).toHaveText('kirjailija, kirjoittaja, novellisti');
    // Awards include those for her books and stories (2 + 19 + 14).
    await expect(fact(page, 'Tuotanto')).toHaveText('30 kirjaa, 39 painosta, 80 novellia ja artikkelia, 35 palkintoa');
    // No second name line under the heading (decided 2026-11-24).
    await expect(page.getByText('Le Guin, Ursula K., 1929–2018')).toHaveCount(0);

    const tabs = page.getByRole('tablist', { name: 'Tuotanto' }).getByRole('tab');
    await expect(tabs).toHaveText([/^Teokset\s*29$/, /^Novellit ja artikkelit\s*80$/, /^Sarjat\s*3$/, /^Palkinnot\s*35$/,
        /^Muu tuotanto\s*1$/, /^Henkilöstä\s*14$/]);
    await expect(page.locator('.pn-row')).toHaveCount(29);
    // No publication graph (owner, 2026-11-25).
    await expect(page.locator('.pn-bars, .pn-tl')).toHaveCount(0);
});

test('the description is closed behind "Näytä kuvaus"', async ({ adminPage: page }) => {
    await openNew(page, LE_GUIN);
    const show = page.getByRole('button', { name: 'Näytä kuvaus' });
    await expect(show).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('.pn-bio .html-content')).toHaveCount(0);
    await show.click();
    const hide = page.getByRole('button', { name: 'Piilota kuvaus' });
    await expect(hide).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.pn-bio .html-content')).toContainText('Ursula K. Le Guin oli yhdysvaltalainen kirjailija');
    await expect(page.locator('.pn-bio .pn-src')).toHaveText('Lähde: ChatGPT');
    await hide.press('Enter');
    await expect(page.locator('.pn-bio .html-content')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Näytä kuvaus' })).toBeFocused();
});

test('every tab is visible when there are many, without scrolling the tab bar', async ({ adminPage: page }) => {
    await openNew(page, LEINONEN);
    const bar = page.getByRole('tablist', { name: 'Tuotanto' });
    await expect(bar.getByRole('tab')).toHaveCount(7);
    expect(await bar.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0);
    const box = (await bar.boundingBox())!;
    for (const tab of await bar.getByRole('tab').all()) {
        const t = (await tab.boundingBox())!;
        expect(t.x + t.width).toBeLessThanOrEqual(box.x + box.width + 0.5);
    }
    await bar.getByRole('tab', { name: /^Henkilöstä/ }).click();
    await expect(page).toHaveURL(/osio=henkilosta/);
});

test('Henkilöstä lists the books and the articles about the person apart', async ({ adminPage: page }) => {
    await openNew(page, LE_GUIN);
    await tab(page, /^Henkilöstä/).click();
    await expect(page).toHaveURL(/osio=henkilosta/);
    await expect(page.locator('.pn-group-h')).toHaveText([/^Kirjat\s*1$/, /^Artikkelit\s*13$/]);
    await expect(page.getByRole('region', { name: 'Kirjat' }).getByRole('link', { name: 'Velhot, örkit, sankarit' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Artikkelit' }).getByRole('link', { name: 'Mustavalkea metsä' })).toBeVisible();
});

test('an old link with a year still filters the list, and the year can be cleared', async ({ adminPage: page }) => {
    // The timeline that set the year is gone; links made with it keep working.
    await openNew(page, LE_GUIN, '?osio=teokset&vuosi=1984');
    await expect(page.locator('.pn-result')).toContainText(/Näytetään \d+ \/ 29/);
    const shown = await page.locator('.pn-row').count();
    expect(shown).toBeGreaterThan(0);
    expect(shown).toBeLessThan(29);
    await page.getByRole('button', { name: 'Poista vuosirajaus' }).click();
    await expect(page.locator('.pn-row')).toHaveCount(29);
    await expect(page).not.toHaveURL(/vuosi=/);
});

test('type and name filters show faceted counts, live in the URL and clear together', async ({ adminPage: page }) => {
    await openNew(page, KING);
    await expect(tab(page, /^Teokset/)).toHaveText(/81/);
    const types = page.getByRole('group', { name: 'Tyyppi' });
    await types.getByRole('button', { name: /^Kokoelmat/ }).click();
    await expect(page).toHaveURL(/tyyppi=kokoelma/);
    await page.getByLabel('Suodata nimellä').fill('yö');
    await expect(page).toHaveURL(/haku=y%C3%B6/);
    await expect(page.locator('.pn-result')).toContainText('Kokoelmat ×');
    const rows = page.locator('.pn-row .pn-r-t a');
    await expect(rows.first()).toBeVisible();
    for (const title of await rows.allTextContents()) expect(title.toLowerCase()).toContain('yö');

    // Typing replaced the history entry: one back undoes the type chip, not each letter.
    await page.getByRole('button', { name: 'Tyhjennä' }).click();
    await expect(page).not.toHaveURL(/tyyppi=|haku=/);
    await expect(page.locator('.pn-row')).toHaveCount(81);
});

test('books are sorted by title by default; the sort dropdown shows its value and changes it without breaking the page', async ({ adminPage: page }) => {
    await openNew(page, KING);
    await expect(page.locator('.pn-toolbar .p-dropdown-label').first()).toHaveText('Nimi');
    // Within each author group (own name, pen name, collaborations) the titles are in order.
    const own = await page.getByRole('region', { name: 'Stephen King', exact: true }).locator('.pn-r-t a').allTextContents();
    expect(own.length).toBe(75);
    expect(own).toEqual([...own].sort((a, b) => a.localeCompare(b, 'fi')));
    await page.locator('.pn-toolbar .p-dropdown').first().click();
    await page.getByRole('option', { name: 'Alkuteoksen vuosi', exact: true }).click();
    await expect(page).toHaveURL(/jarjestys=alkuvuosi/);
    await expect(newPage(page)).toBeVisible();
    await expect(page.locator('.pn-toolbar .p-dropdown-label').first()).toHaveText('Alkuteoksen vuosi');
    await expect(page.locator('.pn-group-h').first()).toContainText('luku');
});

test('pen names: a person who used one and a pen name shared by several writers', async ({ adminPage: page }) => {
    await openNew(page, KING);
    await expect(fact(page, 'Salanimi')).toHaveText('Richard Bachman');
    await expect(fact(page, 'Salanimi').getByRole('link')).toHaveAttribute('href', '/people/2712');
    const kirous = page.locator('.pn-row', { has: page.getByRole('link', { name: 'Kirous', exact: true }) });
    await expect(kirous.locator('.pn-r-sub')).toContainText('nimellä Richard Bachman');

    await openNew(page, HUNTER);
    await expect(fact(page, 'Oikeat henkilöt').getByRole('link')).toHaveCount(8);
    await expect(page.locator('.pn-portrait')).toHaveCount(0);
});

test('the Tekijä row picks books by pen name or collaboration; King\'s Bachman books', async ({ adminPage: page }) => {
    await openNew(page, KING);
    const credits = page.getByRole('group', { name: 'Tekijä' });
    await expect(credits.getByRole('button')).toHaveText([/^Kaikki\s*81$/, /^Stephen King\s*75$/, /^Richard Bachman\s*2$/,
        /^Stephen King & Owen King\s*1$/, /^Stephen King & Peter Straub\s*2$/, /^Stephen King & Richard Chizmar\s*1$/]);
    await credits.getByRole('button', { name: /^Richard Bachman/ }).click();
    await expect(page).toHaveURL(/tekija=2712/);
    await expect(page.locator('.pn-row')).toHaveCount(2);
    for (const sub of await page.locator('.pn-row .pn-r-sub').allTextContents()) expect(sub).toContain('nimellä Richard Bachman');
    await expect(page.locator('.pn-result')).toContainText('Näytetään 2 / 81');
    await expect(page.locator('.pn-result')).toContainText('Richard Bachman ×');
    await page.getByRole('button', { name: 'Tyhjennä' }).click();
    await expect(page).not.toHaveURL(/tekija=/);
    await expect(page.locator('.pn-row')).toHaveCount(81);
});

test('collaborations are grouped and named, as on the old page (Anne Leinonen)', async ({ adminPage: page }) => {
    await openNew(page, LEINONEN);
    // Sorted by title (the default): own name first, then each collaboration.
    await expect(page.locator('.pn-group-h')).toHaveText([/^Anne Leinonen\s*14$/, /^Anne Leinonen & Eija Laitinen\s*1$/,
        /^Anne Leinonen & Eija Lappalainen\s*4$/, /^Anne Leinonen & Petri Laine\s*1$/]);
    const routasisarukset = page.locator('.pn-row', { has: page.getByRole('link', { name: 'Routasisarukset', exact: true }) });
    await expect(routasisarukset.locator('.pn-r-sub')).toContainText('yhdessä Eija Lappalainen');
    await page.getByRole('group', { name: 'Tekijä' }).getByRole('button', { name: /^Anne Leinonen & Eija Lappalainen/ }).click();
    await expect(page.locator('.pn-row')).toHaveCount(4);

    // Stories: her three pen names, and her many collaborations folded into one button.
    await page.goto(`/people/${LEINONEN}?osio=novellit`);
    const credits = page.getByRole('group', { name: 'Tekijä' });
    await expect(credits.getByRole('button')).toHaveText([/^Kaikki\s*184$/, /^Anne Leinonen\s*158$/, /^Aimo-Inari Holappa\s*1$/,
        /^Impi Kure\s*1$/, /^Kalervo Rauta-Kalske\s*1$/, /^Yhdessä muiden kanssa\s*23$/], { timeout: 20000 });
    await credits.getByRole('button', { name: /^Impi Kure/ }).click();
    await expect(page.locator('.pn-row')).toHaveCount(1);
    await expect(page.locator('.pn-row .pn-r-sub')).toContainText('nimellä Impi Kure');
    await credits.getByRole('button', { name: /^Yhdessä muiden kanssa/ }).click();
    await expect(page.locator('.pn-row')).toHaveCount(23);
});

test('a writer behind a shared pen name gets only their own books under it (Cherith Baldry, Erin Hunter)', async ({ adminPage: page }) => {
    // The old page's rule: a book under the shared name counts when its credit's real person is unset or this person.
    await openNew(page, 2054, '?tekija=' + HUNTER);
    await expect(page.getByRole('link', { name: 'Auringon polku', exact: true })).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('link', { name: 'Aamunkoi', exact: true })).toHaveCount(0); // Kate Cary's
    // 36 of the 94 Erin Hunter works are hers; the tab no longer counts the others.
    const teokset = Number((await tab(page, /^Teokset/).innerText()).replace(/\D/g, ''));
    expect(teokset).toBeLessThan(94);
});

test('an admin\'s visit looks for a picture on Wikimedia when the person has none, shows it and saves it', async ({ adminPage: page }) => {
    // As on the old page. The backend's lookup goes to Wikimedia, so the test answers for it and for the saves.
    const NO_IMAGE = 874; // James W. Kunetka: no image record of their own or through an alias, no Wikidata id
    const found = { url: 'https://upload.wikimedia.org/test/kunetka.jpg', description_url: 'https://commons.wikimedia.org/wiki/File:Kunetka.jpg',
        credit: '<a href="x">Kuvaaja</a>', license: 'CC BY-SA 4.0', score: 1 };
    const saved: { url: string; body: unknown }[] = [];
    await page.route(`**/api/person/${NO_IMAGE}/images?limit=1`, route => route.fulfill({ json: [found] }));
    await page.route(new RegExp(`/api/person/${NO_IMAGE}/(images|links)$`), route => {
        if (route.request().method() !== 'POST') return route.fallback();
        saved.push({ url: route.request().url(), body: route.request().postDataJSON() });
        return route.fulfill({ json: { response: 'ok' } });
    });
    await openNew(page, NO_IMAGE);
    await expect(page.locator('img.pn-portrait')).toHaveAttribute('src', found.url, { timeout: 20000 });
    await expect(page.locator('.pn-credit')).toHaveText('Kuva: Kuvaaja, CC BY-SA 4.0');
    await expect(page.getByText('Kuva lisätty')).toBeVisible();
    await expect.poll(() => saved.length).toBe(2);
    expect(saved.find(x => x.url.endsWith('/images'))!.body).toEqual({ src: found.url, attr: 'Kuvaaja', license: 'CC BY-SA 4.0' });
    expect(saved.find(x => x.url.endsWith('/links'))!.body).toEqual({ link: found.description_url, description: 'Wikimedia Commons' });
});

test('no Wikimedia lookup when an admin chose "Ei kuvaa", and a lookup that finds nothing says so', async ({ adminPage: page }) => {
    const lookups: string[] = [];
    page.on('request', r => { if (/\/api\/person\/\d+\/images\?limit=/.test(r.url())) lookups.push(r.url()); });
    await openNew(page, 1); // Barry Unsworth: "Ei kuvaa"
    await page.waitForLoadState('networkidle');
    expect(lookups).toEqual([]);
    await expect(page.locator('img.pn-portrait')).toHaveCount(0);

    await page.route('**/api/person/888/images?limit=1', route => route.fulfill({ json: [] }));
    await openNew(page, 888); // Eugène Sue: no image record
    await expect(page.getByText('Kuvia ei löytynyt')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('img.pn-portrait')).toHaveCount(0);
});

test('a book the user owns is marked before its title', async ({ adminPage: page }) => {
    const me = await page.evaluate(() => JSON.parse(localStorage.getItem('user') ?? '{}').id);
    await page.route(`**/api/people/${LE_GUIN}`, async route => {
        const response = await route.fetch();
        const person = await response.json();
        const work = person.works.find((w: { title: string }) => w.title === 'Pimeyden vasen käsi');
        work.editions[0].owners = [{ id: me, name: 'Test Admin' }];
        await route.fulfill({ response, json: person });
    });
    await openNew(page, LE_GUIN);
    const row = page.locator('.pn-row', { has: page.getByRole('link', { name: 'Pimeyden vasen käsi', exact: true }) });
    const title = row.locator('.pn-r-t');
    await expect(title.getByRole('img', { name: /^Omistat: \d{4}/ })).toBeVisible();
    // The mark comes before the title, and the printings list has none.
    expect(await title.evaluate(el => el.firstElementChild?.classList.contains('pn-mark'))).toBe(true);
    await expect(row.locator('.pn-r-eds .pn-mark')).toHaveCount(0);
});

test('roles get their own row only when there is more than one', async ({ adminPage: page }) => {
    await openNew(page, MAKELA);
    const roles = page.getByRole('group', { name: 'Rooli' });
    await expect(roles.getByRole('button')).toHaveText([/^Kirjoittanut\s*7$/, /^Kääntänyt\s*28$/, /^Kansikuva\s*1$/]);
    await roles.getByRole('button', { name: /^Kääntänyt/ }).click();
    await expect(page).toHaveURL(/rooli=kaantaja/);
    await expect(page.locator('.pn-row')).toHaveCount(28);

    await openNew(page, LE_GUIN);
    await expect(page.getByRole('group', { name: 'Rooli' })).toHaveCount(0);
});

test('Kannet shows the books as covers, and the choice is in the URL', async ({ adminPage: page }) => {
    await openNew(page, KING);
    await page.locator('.p-selectbutton').getByText('Kannet', { exact: true }).click();
    await expect(page).toHaveURL(/nakyma=kannet/);
    await expect(page.locator('.pn-covers a')).toHaveCount(81);
});

test('a person with one cover: a sentence, and a heading instead of tabs', async ({ adminPage: page }) => {
    await openNew(page, TAN);
    await expect(page.locator('.pn-summary')).toHaveText('Kansikuva kirjaan Siltavaltakunta (Danielle L. Jensen), Docendo 2019.');
    await expect(page.getByRole('tablist')).toHaveCount(0);
    await expect(page.locator('.pn-onegroup')).toHaveText(/Teokset\s*1/);
});

test('the admin pencil opens the work in the edit dialog', async ({ adminPage: page }) => {
    await openNew(page, LE_GUIN);
    await page.getByRole('button', { name: 'Muokkaa teosta Maameren velho' }).click();
    const dialog = page.getByRole('dialog', { name: 'Teoksen muokkaus' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Tallenna' })).toBeVisible({ timeout: 20000 });
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
});

test('on a phone the page fits the screen and the filters fold into a sheet', async ({ adminPage: page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openNew(page, KING);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    await expect(page.getByLabel('Suodata nimellä')).toBeHidden();
    await page.getByRole('button', { name: /^Suodata ja järjestä/ }).click();
    const sheet = page.locator('.p-sidebar');
    await expect(sheet.getByLabel('Suodata nimellä')).toBeVisible();
});

test('the new page has the site\'s own background, light and dark, not a grey box inside it', async ({ adminPage: page }) => {
    const backgrounds = () => page.evaluate(() => [
        getComputedStyle(document.body).backgroundColor,
        getComputedStyle(document.querySelector('[data-person-page="uusi"]')!).backgroundColor,
    ]);
    await openNew(page, LE_GUIN);
    const [site, person] = await backgrounds();
    expect(person).toBe(site);

    await page.emulateMedia({ colorScheme: 'dark' });
    await expect.poll(async () => (await backgrounds())[0]).not.toBe(site);
    const [darkSite, darkPerson] = await backgrounds();
    expect(darkPerson).toBe(darkSite);
});

test('the new person page has no accessibility violations', async ({ adminPage: page }) => {
    await openNew(page, LE_GUIN);
    await page.waitForLoadState('networkidle');
    await expectAccessible(page, { include: '[data-person-page="uusi"]' });
    // And with the description open.
    await page.getByRole('button', { name: 'Näytä kuvaus' }).click();
    await expectAccessible(page, { include: '[data-person-page="uusi"]' });
});
