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
const SPARSE = 3407; // Satujen maan taistelu: one printing, no cover
const TOLKIEN_20TH = 10197; // 20. painos 2001, inside the merged 1st laitos row
const TOLKIEN_4TH = 10208; // 4. painos 1988

const newPage = (page: Page) => page.locator('[data-work-page="uusi"]');
const fact = (page: Page, label: string) => page.locator('.wn-facts dt', { hasText: label }).locator('xpath=following-sibling::dd[1]');

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
    await expect(page.locator('.wn-orig')).toHaveText('The Left Hand of Darknessenglanti, 1969');
    await expect(fact(page, 'Tyyppi')).toHaveText('Romaani');
    await expect(fact(page, 'Genre')).toHaveText('Science Fiction');
    await expect(fact(page, 'Palkinnot').locator('.wn-award')).toHaveText(['Hugo 1970, paras romaani', 'Nebula 1970, paras romaani']);
    const series = fact(page, 'Sarja');
    await expect(series).toContainText('Hain-sarja');
    await expect(series).toContainText('4/9 alkuteosten ilmestymisjärjestyksessä');
    await expect(series.getByRole('link', { name: '‹ Harhakaupunki' })).toHaveAttribute('href', '/works/3966');
    await expect(series.getByRole('link', { name: 'Maailma, vihreä metsä ›' })).toHaveAttribute('href', '/works/3972');
    await expect(page.locator('.wn-subjects dt')).toHaveText(['Alalaji', 'Tyyli', 'Aiheet', 'Hahmot ja olennot', 'Paikat', 'Aika', 'Listat ja sovitukset']);
    await expect(page.locator('.wn-p-head p')).toHaveText('3 painosta vuosina 1976–1992, WSOY. Suomentanut Kalevi Nyytäjä.');
});

test('Tolkien: the shelf has a spine per printing, the missing sizes marked', async ({ adminPage: page }) => {
    await openNew(page, `/works/${TOLKIEN}`);
    const shelf = page.getByRole('group', { name: 'Painokset hyllyssä' });
    await expect(shelf.locator('.wn-spine')).toHaveCount(20);
    await expect(shelf.locator('.wn-spine.wn-est')).toHaveCount(4);
    await expect(shelf.locator('.wn-slabel')).toHaveText([/^1\. laitos\s*17 painosta$/, /^2\. laitos\s*2 painosta$/, /^3\. laitos\s*1 painos$/]);
    await expect(page.locator('.wn-shelf-note')).toContainText('Korkeus puuttuu; se on piirretty tämän teoksen muiden painosten mukaan.');
    await expect(page.locator('.wn-version h3')).toHaveText(['1. laitos', '2. laitos', '3. laitos']);

    // Thickness from pages at 10 pages a millimetre, on the same scale as the height: 981 pages and 23 cm stand
    // about 23:9.8. The whole shelf is scaled down evenly so all three laitos fit the page.
    const first = await shelf.locator('.wn-spine').first().boundingBox();
    expect(first!.height / first!.width).toBeCloseTo(230 / 98.1, 1);
    expect(await shelf.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
});

test('picking a spine shows its cover, opens its merged row and highlights the printing', async ({ adminPage: page }) => {
    await openNew(page, `/works/${TOLKIEN}`);
    await page.getByRole('button', { name: '20. painos 2001, WSOY, sidottu, 981 sivua, 23 cm' }).click();
    await expect(page).toHaveURL(new RegExp(`painos=${TOLKIEN_20TH}`));
    await expect(page.locator('.wn-cover-note')).toHaveText('20. painoksen kansi, 2001');
    const merged = page.getByRole('button', { name: '1.–36. painos' });
    await expect(merged).toHaveAttribute('aria-expanded', 'true');
    const row = page.locator(`#painos-${TOLKIEN_20TH}`);
    await expect(row).toHaveClass(/wn-hl/);
    await expect(row).toBeInViewport();
    // The reader can still close it.
    await merged.click();
    await expect(merged).toHaveAttribute('aria-expanded', 'false');
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
    await first.getByRole('button', { name: '1.–36. painos' }).click();
    await expect(first.locator('tr.wn-sub')).toHaveCount(17);
    await expect(first.locator('tr.wn-sub .p-rating')).toHaveCount(17);
    await expect(first.locator('tr.wn-sub').first().getByRole('link', { name: '1. painos' })).toHaveAttribute('href', /\/editions\/\d+/);
    await page.waitForLoadState('networkidle');
    expect(perWork).toHaveLength(1);
    expect(perPrinting).toHaveLength(0);
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
    await expect(page.locator('.wn-cover-note')).toHaveText('4. painoksen kansi, 1988');
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

test('a work with little data: no shelf, no grouping, no laitos heading', async ({ adminPage: page }) => {
    await openNew(page, `/works/${SPARSE}`);
    await expect(page.locator('.wn-orig')).toHaveText(/^Julkaistu \d{4}$/);
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
});
