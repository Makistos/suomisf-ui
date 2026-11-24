import { test, expect } from '../fixtures/guard';

// Visitors always get the current person page: the new version is an
// admin-only trial (tests/admin/person-new.spec.ts). Also checks the bugs
// fixed on the current page (docs/ui-redesign/pages/person.md, notes).
const LE_GUIN = 2435;
const MAKELA = 191;

test('a visitor sees the current page, no switch, and the hotkey does nothing', async ({ page }) => {
    await page.goto('/');
    // Even with the admin's choice left in this browser.
    await page.evaluate(() => localStorage.setItem('suomisf.personPageVersion', 'uusi'));
    await page.goto(`/people/${LE_GUIN}`);
    await expect(page.locator('main.person-page')).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('page-version')).toHaveCount(0);
    await page.keyboard.press('Shift+KeyU');
    await expect(page.locator('[data-person-page="uusi"]')).toHaveCount(0);
    await expect(page.locator('main.person-page')).toBeVisible();
});

test('the current page derives roles from the person\'s own contributions', async ({ page }) => {
    await page.goto(`/people/${LE_GUIN}`);
    // Le Guin only appears in Esko Miettinen's non-fiction book (note 1).
    await expect(page.locator('.person-page span.font-bold').first()).toHaveText('Kirjailija, Kirjoittaja, Novellisti', { timeout: 20000 });
});

test('a story the person wrote and appears in is listed under Kirjoittaja', async ({ page }) => {
    await page.goto(`/people/${MAKELA}`);
    await page.getByRole('tab', { name: 'Novellit ja artikkelit' }).click();
    await page.getByRole('tab', { name: /^Artikkeli \(\d+\)/ }).click();
    const panel = page.locator('.p-tabview-panel:visible').last();
    // Groups are headings; "Hylyntyhjentäjien laulu" credits him as Esiintyy first, Kirjoittaja second.
    const writerGroup = panel.locator('div', { has: page.getByRole('heading', { name: 'Kirjoittaja', exact: true }) }).last();
    await expect(writerGroup.getByText('Hylyntyhjentäjien laulu')).toBeVisible({ timeout: 20000 });
    const appearsGroup = panel.locator('div', { has: page.getByRole('heading', { name: 'Esiintyy', exact: true }) }).last();
    await expect(appearsGroup.getByText('Hylyntyhjentäjien laulu')).toHaveCount(0);
});

test('a link row without an address is not shown', async ({ page }) => {
    // A saved empty row (the person form used to save one) would show as a bare icon.
    await page.route(`**/api/people/${MAKELA}`, async route => {
        const response = await route.fetch();
        const person = await response.json();
        person.links = [{ id: 1, link: '', description: '' }, ...person.links];
        await route.fulfill({ response, json: person });
    });
    await page.goto(`/people/${MAKELA}`);
    await expect(page.locator('main.person-page')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('main.person-page a.no-underline').first()).toBeVisible();
    await expect(page.locator('main.person-page a[href=""]')).toHaveCount(0);
});
