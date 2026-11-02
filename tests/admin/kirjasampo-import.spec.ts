import { test, expect } from '../fixtures/auth';

// "Luolien suojatit", which links to Kirjasampo.
const WORK_ID = 5;

// Fetching the tags scrapes kirjasampo.fi, so that call is answered here;
// the stored mappings and the import itself go to the backend.
test('admin imports Kirjasampo tags, skipping one', async ({ adminPage, page }) => {
    const stamp = Date.now();
    const added = `E2E_TEST_tag_${stamp}`;
    const skipped = `E2E_TEST_skip_${stamp}`;
    await adminPage.route('**/api/kirjasampo/tags?**', route => route.fulfill({
        json: {
            Asiasanat: ['avaruus', `${added} (luokka)`, skipped],
            // Not tags: the author section is left out ...
            Tekijä: ['Auel, Jean M.'],
            // ... and a film list becomes the single tag "elokuva".
            Elokuvat: ['Luolakarhun klaani (1986)'],
        },
    }));

    await adminPage.goto(`/works/${WORK_ID}`);
    await adminPage.getByRole('button', { name: 'Tuo Kirjasampo-asiasanat' }).click();
    const dialog = adminPage.getByRole('dialog').filter({ hasText: 'Kirjasampo-asiasanat' });
    await dialog.getByRole('button', { name: 'Hae asiasanat' }).click();

    const row = (name: string) => dialog.locator('div.grid', { hasText: name }).last();
    for (const name of ['avaruus', added, skipped, 'elokuva']) {
        await expect(row(name)).toBeVisible({ timeout: 20000 });
    }
    await expect(dialog.getByText('Auel, Jean M.')).toHaveCount(0);
    // The "(luokka)" qualifier is stripped from the suggested name.
    await expect(row(added).locator('input.p-autocomplete-input')).toHaveValue(added);

    await row(skipped).locator('.p-inputswitch').click();
    await dialog.getByRole('button', { name: 'Tallenna' }).click();
    await expect(adminPage.getByText('Asiasanat tuotu')).toBeVisible({ timeout: 20000 });
    await expect(dialog).not.toBeVisible();

    // The work shows five tags and hides the rest behind "+ n".
    await adminPage.getByRole('button', { name: /^\+ \d+$/ }).click();
    await expect(adminPage.getByRole('link', { name: added })).toBeVisible({ timeout: 20000 });
    await expect(adminPage.getByRole('link', { name: skipped })).toHaveCount(0);

    // Saving records the import date, which admins (only) see under the tags.
    const work = await (await adminPage.request.get(`http://localhost:5001/api/works/${WORK_ID}`)).json();
    expect(work.kirjasampo_imported).not.toBeNull();
    const today = new Date().toLocaleDateString('fi-FI');
    await expect(adminPage.getByText(`Tuotu Kirjasammosta ${today}`)).toBeVisible();

    await page.goto(`/works/${WORK_ID}`);
    await expect(page.getByRole('heading', { name: 'Asiasanat' })).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Tuotu Kirjasammosta')).toHaveCount(0);
});
