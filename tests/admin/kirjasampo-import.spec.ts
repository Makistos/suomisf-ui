import { Page, Request } from '@playwright/test';
import { test, expect } from '../fixtures/auth';

const API_URL = 'http://localhost:5001/api/';

// Works linking to Kirjasampo: "Luolien suojatit", "Mammutin metsästäjät"
// and "Hyvästi, Robinson Crusoe", which has no tags.
const WORK_ID = 5;
const ALL_SKIPPED_WORK_ID = 6;
const EMPTY_WORK_ID = 56;
// "Rautakellojen arvoitus": skipping for this work only, adding by hand.
const SKIP_HERE_WORK_ID = 19;

type PreviewTag = { id: number; name: string; type: { id: number; name: string } | null };

const newItem = (name: string, raw_name = name) =>
    ({ name, raw_name, mapping: null, match: null, on_work: false });

// The preview scrapes kirjasampo.fi on the backend, so it is answered here;
// the import itself goes to the backend.
const mockPreview = (page: Page, groups: unknown[]) =>
    page.route('**/api/work/*/tags/import/preview', route => route.fulfill({ json: groups }));

const openDialog = async (page: Page, workId: number) => {
    await page.goto(`/works/${workId}`);
    await page.getByRole('button', { name: 'Tuo Kirjasampo-asiasanat' }).click();
    const dialog = page.getByRole('dialog').filter({ hasText: 'Kirjasampo-asiasanat' });
    await dialog.getByRole('button', { name: 'Hae asiasanat' }).click();
    return dialog;
};

const isImport = (r: Request) => r.method() === 'POST' && r.url().endsWith('/tags/import');

const importedAt = async (page: Page, workId: number): Promise<string | null> =>
    (await (await page.request.get(`${API_URL}works/${workId}`)).json()).kirjasampo_imported;

/** Saves and checks that the work's import date moved on. */
const saveAndCheckDate = async (page: Page, workId: number, button: string) => {
    const before = await importedAt(page, workId);
    const request = page.waitForRequest(isImport);
    await page.getByRole('dialog').getByRole('button', { name: button }).click();
    const body = (await request).postDataJSON();
    await expect(page.getByText('Asiasanat tuotu')).toBeVisible({ timeout: 20000 });
    const after = await importedAt(page, workId);
    expect(after).not.toBeNull();
    expect(new Date(after!).getTime()).toBeGreaterThan(before ? new Date(before).getTime() : 0);
    return body;
};

test('admin imports Kirjasampo tags, choosing a type and skipping one', async ({ adminPage, page }) => {
    const stamp = Date.now();
    const added = `e2e_test_tag_${stamp}`;
    const skipped = `e2e_test_skip_${stamp}`;
    const person = `e2e_test_person_${stamp}`;
    const types: { id: number; name: string }[] =
        await (await adminPage.request.get(`${API_URL}tags/types`)).json();
    const paikka = types.find(t => t.name === 'Paikka')!;
    const toimija = types.find(t => t.name === 'Toimija')!;
    const existing: PreviewTag = (await (await adminPage.request.get(`${API_URL}filter/tags/avaruus`)).json())
        .find((t: PreviewTag) => t.name === 'avaruus');

    await mockPreview(adminPage, [
        {
            section: 'Aiheet ja teemat',
            items: [
                newItem(added, `${added} (luokka)`),
                newItem(skipped),
                { name: 'avaruus', raw_name: 'avaruus', mapping: null, match: existing, on_work: true },
            ],
        },
        // The same name in a second section, and a new tag whose type
        // comes from the section.
        { section: 'Henkilöt, toimijat', items: [newItem(added), newItem(person)] },
    ]);

    const dialog = await openDialog(adminPage, WORK_ID);
    const rows = dialog.locator('tbody tr:not(.p-rowgroup-header):not(.p-rowgroup-footer)');
    const row = (section: number, name: string) => rows.filter({ hasText: name }).nth(section);
    await expect(dialog.locator('.p-rowgroup-header')).toHaveText(['Aiheet ja teemat', 'Henkilöt, toimijat'],
        { timeout: 20000 });
    await expect(rows).toHaveCount(5);

    // A new tag gets a type picker, an existing one shows its type.
    await expect(row(0, added).getByText('Uusi')).toBeVisible();
    await expect(row(0, added).locator('.p-dropdown')).toContainText('Aihe');
    await expect(row(0, person).locator('.p-dropdown')).toContainText('Toimija');
    await expect(row(0, 'avaruus').getByText(existing.type!.name)).toBeVisible();
    await expect(row(0, 'avaruus').getByRole('img', { name: 'Teoksella on jo tämä asiasana' })).toBeVisible();
    await expect(row(0, added).getByRole('img', { name: 'Teoksella on jo tämä asiasana' })).toHaveCount(0);
    await expect(row(0, 'avaruus').locator('input.p-autocomplete-input')).toHaveValue('avaruus');

    // Changing the type of one row changes the other row of the same name.
    await row(0, added).locator('.p-dropdown').click();
    await adminPage.getByRole('option', { name: 'Paikka' }).click();
    await expect(row(1, added).locator('.p-dropdown')).toContainText('Paikka');

    await row(0, skipped).getByRole('switch', { name: `Ohita aina ${skipped}` }).click();
    await expect(dialog.getByRole('button', { name: 'Tallenna' })).toBeVisible();

    const body = await saveAndCheckDate(adminPage, WORK_ID, 'Tallenna');
    expect(body).toEqual([
        { name: added, id: null, action: 'add', type_id: paikka.id },
        { name: skipped, id: null, action: 'omit' },
        { name: 'avaruus', id: null, action: 'add' },
        { name: person, id: null, action: 'add', type_id: toimija.id },
    ]);
    await expect(dialog).not.toBeVisible();

    const created: PreviewTag[] = await (await adminPage.request.get(`${API_URL}filter/tags/${added}`)).json();
    expect(created.map(t => [t.name, t.type?.name])).toEqual([[added, 'Paikka']]);

    // The work shows five tags and hides the rest behind "+ n".
    await adminPage.getByRole('button', { name: /^\+ \d+$/ }).click();
    await expect(adminPage.getByRole('link', { name: added })).toBeVisible({ timeout: 20000 });
    await expect(adminPage.getByRole('link', { name: skipped })).toHaveCount(0);

    // Admins (only) see the import date under the tags.
    const today = new Date().toLocaleDateString('fi-FI');
    await expect(adminPage.getByText(`Tuotu Kirjasammosta ${today}`)).toBeVisible();

    await page.goto(`/works/${WORK_ID}`);
    await expect(page.getByRole('heading', { name: 'Asiasanat' })).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Tuotu Kirjasammosta')).toHaveCount(0);
});

test('skipping every tag still marks the work imported', async ({ adminPage }) => {
    const stamp = Date.now();
    const names = [`e2e_test_skip_a_${stamp}`, `e2e_test_skip_b_${stamp}`];
    await mockPreview(adminPage, [{ section: 'Aiheet ja teemat', items: names.map(n => newItem(n)) }]);

    const dialog = await openDialog(adminPage, ALL_SKIPPED_WORK_ID);
    for (const name of names) {
        await dialog.locator('tbody tr', { hasText: name }).getByRole('switch', { name: `Ohita aina ${name}` })
            .click();
    }
    const body = await saveAndCheckDate(adminPage, ALL_SKIPPED_WORK_ID, 'Merkitse tuoduksi');
    expect(body).toEqual(names.map(name => ({ name, id: null, action: 'omit' })));
});

test('a Kirjasampo page without tags can be marked imported', async ({ adminPage }) => {
    await mockPreview(adminPage, []);
    const dialog = await openDialog(adminPage, EMPTY_WORK_ID);
    await expect(dialog.getByText('Ei asiasanoja löydetty.')).toBeVisible({ timeout: 20000 });
    await expect(dialog.getByRole('button', { name: 'Tallenna' })).toHaveCount(0);

    const body = await saveAndCheckDate(adminPage, EMPTY_WORK_ID, 'Merkitse tuoduksi');
    expect(body).toEqual([]);

    // The work still has no tags, but the admin sees the import date.
    await expect(adminPage.getByText(/^Tuotu Kirjasammosta /)).toBeVisible({ timeout: 20000 });
});

test('a tag is skipped for this work only, and another added by hand', async ({ adminPage }) => {
    const stamp = Date.now();
    const here = `e2e_test_here_${stamp}`;
    const kept = `e2e_test_kept_${stamp}`;
    const typed = `e2e_test_typed_${stamp}`;
    await mockPreview(adminPage, [{ section: 'Aiheet ja teemat', items: [newItem(here), newItem(kept)] }]);

    const dialog = await openDialog(adminPage, SKIP_HERE_WORK_ID);
    const row = (name: string) => dialog.locator('tbody tr', { hasText: name });
    await row(here).getByRole('switch', { name: `Ohita tästä teoksesta ${here}` }).click({ timeout: 20000 });
    // Skipping for good turns the other off and can't be combined.
    await row(kept).getByRole('switch', { name: `Ohita aina ${kept}` }).click();
    await expect(row(kept).getByRole('switch', { name: `Ohita tästä teoksesta ${kept}` })).toBeDisabled();
    await row(kept).getByRole('switch', { name: `Ohita aina ${kept}` }).click();

    // An existing tag and a new one, added by hand.
    const add = dialog.getByLabel('Lisää asiasana');
    await add.pressSequentially('avaruus', { delay: 20 });
    await adminPage.locator('.p-autocomplete-item', { hasText: /^avaruus$/ }).click({ timeout: 20000 });
    await dialog.getByRole('button', { name: 'Lisää', exact: true }).click();
    await add.fill(typed);
    await dialog.getByRole('button', { name: 'Lisää', exact: true }).click();
    await expect(dialog.locator('.p-rowgroup-header')).toHaveText(['Aiheet ja teemat', 'Lisätyt']);
    await expect(row(typed).getByText('Uusi')).toBeVisible();

    const body = await saveAndCheckDate(adminPage, SKIP_HERE_WORK_ID, 'Tallenna');
    expect(body).toEqual([
        { name: kept, id: null, action: 'add', type_id: 1 },
        { name: 'avaruus', id: null, action: 'add' },
        { name: typed, id: null, action: 'add', type_id: 1 },
    ]);
    const work = await (await adminPage.request.get(`${API_URL}works/${SKIP_HERE_WORK_ID}`)).json();
    const names = work.tags.map((t: PreviewTag) => t.name);
    expect(names).toEqual(expect.arrayContaining([kept, 'avaruus', typed]));
    expect(names).not.toContain(here);
    // Nothing was stored for the tag skipped here only.
    const mapping = await (await adminPage.request.get(`${API_URL}tags/import/mappings`, {
        headers: { Authorization: `Bearer ${await adminPage.evaluate(
            () => JSON.parse(localStorage.getItem('user') ?? '{}').access_token)}` },
    })).json();
    expect(JSON.stringify(mapping)).not.toContain(here);
});
