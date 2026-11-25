import { test, expect } from '../fixtures/auth';
import { Page } from '@playwright/test';
import { expectAccessible } from '../fixtures/axe';

// The new short story page (docs/ui-redesign/pages/short.md, in the identity style of the work and person pages)
// under trial: admins switch with the button or Shift+U; everyone else gets the current page (tests/anon|user/short-version.spec.ts).
const POE = 714;      // Kielivä sydän: three books, four printings, four translations, original years 1843 and 1850
const OMELAS = 1028;  // Jotka Omelasista poistuvat: one book, one magazine, a Hugo
const newPage = (page: Page) => page.locator('[data-short-page="uusi"]');

async function openNew(page: Page, id: number) {
    await page.goto('/faq');
    await page.evaluate(() => localStorage.setItem('suomisf.shortPageVersion', 'uusi'));
    await page.goto(`/shorts/${id}`);
    await expect(newPage(page)).toBeVisible({ timeout: 20000 });
}

test('the switch button and Shift+U swap the short story page, apart from the other pages\' choices', async ({ adminPage: page }) => {
    await page.goto(`/shorts/${POE}`);
    const toggle = page.getByTestId('page-version');
    await expect(toggle).toHaveText('Uusi novellisivu', { timeout: 20000 });
    await toggle.click();
    await expect(newPage(page)).toBeVisible({ timeout: 20000 });
    await expect(toggle).toHaveText('Nykyinen novellisivu');
    // Each page finishes loading before the next: Firefox reports requests cut off by navigation as uncaught errors.
    await page.waitForLoadState('networkidle');
    await page.goto('/works/3984');
    await expect(page.locator('main.work-page')).toBeVisible({ timeout: 20000 });
    await page.waitForLoadState('networkidle');
    await page.goto(`/shorts/${OMELAS}`);
    await expect(newPage(page)).toBeVisible({ timeout: 20000 });
    await page.keyboard.press('Shift+KeyU');
    await expect(page.getByRole('tab', { name: 'Julkaisut' })).toBeVisible({ timeout: 20000 });
    await expect(newPage(page)).toHaveCount(0);
});

test('Poe: the record, and one row per book with its printing years', async ({ adminPage: page }) => {
    await openNew(page, POE);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kielivä sydän');
    await expect(page.locator('.sn-byline').getByRole('link', { name: 'Edgar Allan Poe' })).toHaveAttribute('href', '/people/1531');
    await expect(page.locator('.sn-orig')).toHaveText('The Tell-Tale Heartenglanti, 1850');
    const facts = page.locator('.sn-facts');
    await expect(facts).toContainText('TyyppiNovelli');
    await expect(facts).toContainText('GenreKauhu');
    await expect(facts.getByRole('link', { name: 'Paavo Lehtonen' })).toBeVisible();
    await expect(page.locator('#sn-pub-h')).toHaveText('Julkaistu3 kirjaa, 4 painosta');
    const rows = page.locator('.sn-row');
    await expect(rows.locator('.sn-row-t')).toHaveText(['Rue Morguen murhat ja muita kertomuksia', 'Kauhutarinoita', 'Majatalo ja muita kauhutarinoita']);
    const rue = rows.first();
    await expect(rue.locator('.sn-row-s')).toHaveText('Edgar Allan Poe · WSOY 1975, 2000 (2. p.)');
    await expect(rue.getByRole('link', { name: '1975' })).toHaveAttribute('href', '/editions/2606');
    await expect(rue.getByRole('link', { name: '2000' })).toHaveAttribute('href', '/editions/7419');
    await expect(rue.locator('.sn-row-k')).toHaveText('Kokoelma');
    await expect(rows.nth(2).locator('.sn-row-s')).toContainText('Anne Helttunen & Tuula Uusi-Hallila (toim.)');
});

test('Poe: every translation side by side, oldest first, with the admin\'s original-year note', async ({ adminPage: page }) => {
    await openNew(page, POE);
    const table = page.locator('table.sn-tr');
    await expect(page.locator('#sn-tr-h')).toHaveText('Suomennokset4', { timeout: 20000 });
    const rows = table.locator('tbody tr');
    await expect(rows.locator('td:nth-child(2)')).toHaveText(['Aulis Nopsanen', 'Paavo Lehtonen', 'Mika Kivimäki', 'Jaana Kapari-Jatta']);
    await expect(rows.locator('td:nth-child(3)')).toHaveText(['1954', '1975', '2006', '2006']);
    await expect(rows.nth(1)).toHaveAttribute('aria-current', 'page');
    await expect(rows.nth(1)).toContainText('tämä suomennos');
    await expect(rows.nth(1).getByRole('link', { name: 'Kielivä sydän' })).toHaveCount(0);
    await expect(rows.nth(0).getByRole('link', { name: 'Kielivä sydän' })).toHaveAttribute('href', '/shorts/14398');
    await expect(rows.nth(2)).toContainText('Haamutarinoita (2 julkaisua)');
    await expect(page.getByRole('note')).toContainText('Suomennoksilla on eri alkuteoksen vuosi: 1843 (Paljastava sydän); 1850 (Kielivä sydän)');
    await rows.nth(2).getByRole('link', { name: 'Paljastava sydän' }).click();
    await expect(page).toHaveURL(/\/shorts\/7850$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Paljastava sydän');
});

test('Le Guin: a book and a magazine in one list, the Hugo in the record, no translations table', async ({ adminPage: page }) => {
    await openNew(page, OMELAS);
    await expect(page.locator('#sn-pub-h')).toHaveText('Julkaistu1 kirja, 1 lehti');
    const rows = page.locator('.sn-row');
    await expect(rows.locator('.sn-row-t')).toHaveText(['Aikakone Vol.2 No.1', 'Pimeälipas']);
    await expect(rows.first().getByRole('link', { name: 'Aikakone Vol.2 No.1' })).toHaveAttribute('href', '/issues/5');
    await expect(rows.first().locator('.sn-row-k')).toHaveText('Lehti');
    const award = page.locator('.sn-award');
    await expect(award).toHaveText('Hugo 1974, paras novelli');
    await expect(award.getByRole('link', { name: 'Hugo' })).toHaveAttribute('href', '/awards/2');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table.sn-tr')).toHaveCount(0);
    await expect(page.getByRole('note')).toHaveCount(0);
});

test('a printing the user owns is marked before its year', async ({ adminPage: page }) => {
    const me = await page.evaluate(() => JSON.parse(localStorage.getItem('user') ?? '{}').id);
    await page.route(`**/api/shorts/${POE}`, async route => {
        const response = await route.fetch();
        const short = await response.json();
        short.editions.find((e: { id: number }) => e.id === 2606).owners = [{ id: me, name: 'Test Admin' }];
        await route.fulfill({ response, json: short });
    });
    await openNew(page, POE);
    const rue = page.locator('.sn-row').first();
    const mark = rue.getByRole('img', { name: 'Omistat tämän painoksen' });
    await expect(mark).toHaveCount(1);
    expect(await mark.evaluate(el => el.nextElementSibling?.textContent)).toBe('1975');
});

test('books and magazines without a cover, or whose cover fails to load, show a cloth binding', async ({ adminPage: page }) => {
    await page.route(/\.(jpe?g|png|webp|gif)(\?.*)?$/i, route => route.fulfill({ status: 404, body: '' }));
    await openNew(page, OMELAS);
    await expect(page.locator('.sn-row')).toHaveCount(2);
    await expect(page.locator('.sn-row .sn-cloth')).toHaveCount(2);
    await expect(page.locator('.sn-row img')).toHaveCount(0);
});

test('the admin tools: SpeedDial with Muokkaa, Palkinnot and Poista', async ({ adminPage: page }) => {
    await openNew(page, OMELAS);
    const dial = page.locator('.fixed-dial');
    // In the bottom right corner as on every other page, not in the page flow.
    const box = await dial.evaluate(el => ({ position: getComputedStyle(el).position, right: window.innerWidth - el.getBoundingClientRect().right }));
    expect(box.position).toBe('fixed');
    expect(box.right).toBeLessThan(80);
    await dial.locator('button.p-speeddial-button').click();
    await dial.locator('.p-speeddial-action').nth(0).click();
    const edit = page.getByRole('dialog', { name: 'Muokkaa' });
    await expect(edit).toBeVisible();
    await edit.locator('.p-dialog-header-close').click();
    await expect(edit).toHaveCount(0);
    await dial.locator('button.p-speeddial-button').click();
    await dial.locator('.p-speeddial-action').nth(1).click();
    const awards = page.getByRole('dialog', { name: 'Palkinnot' });
    await expect(awards).toBeVisible();
    await awards.locator('.p-dialog-header-close').click();
    await dial.locator('button.p-speeddial-button').click();
    await dial.locator('.p-speeddial-action').nth(2).click();
    await expect(page.getByText('Haluatko varmasti poistaa novellin?')).toBeVisible();
    await page.locator('.p-confirm-dialog-reject').click();
    await expect(page.getByText('Novellia ei poistettu')).toBeVisible();
    await expect(newPage(page)).toBeVisible();
});

test('on a phone the page fits the screen and translations become cards', async ({ adminPage: page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openNew(page, POE);
    await expect(page.locator('table.sn-tr tbody tr')).toHaveCount(4, { timeout: 20000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    await expect(page.locator('table.sn-tr thead')).toBeHidden();
});

test('the new short story page has the site\'s own background and no accessibility violations', async ({ adminPage: page }) => {
    await openNew(page, POE);
    await expect(page.locator('table.sn-tr')).toBeVisible({ timeout: 20000 });
    const [site, short] = await page.evaluate(() => [
        getComputedStyle(document.body).backgroundColor,
        getComputedStyle(document.querySelector('[data-short-page="uusi"]')!).backgroundColor,
    ]);
    expect(short).toBe(site);
    await page.waitForLoadState('networkidle');
    await expectAccessible(page, { include: '[data-short-page="uusi"]' });
});
