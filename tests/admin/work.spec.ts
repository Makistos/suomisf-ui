import { test, expect } from '../fixtures/auth';
import { Page, Locator } from '@playwright/test';

const dialAction = (page: Page, label: string) =>
    page.locator(`a.p-speeddial-action[aria-label="${label}"]`);

// Fills the first contributor row (person + role) - the backend rejects a
// work with no contributors.
async function fillFirstContributor(page: Page, dialog: Locator, personQuery: string, roleName: string) {
    await dialog.locator('input[placeholder="Henkilö"]').first().fill(personQuery);
    await expect(page.locator('.p-autocomplete-item').first()).toBeVisible({ timeout: 10000 });
    await page.locator('.p-autocomplete-item').first().click();
    await dialog.locator('.p-dropdown', { hasText: 'Rooli' }).click();
    await page.getByRole('option', { name: roleName }).click();
}

test('admin can create, edit and delete a work', async ({ adminPage }) => {
    const title = `E2E_TEST_work_${Date.now()}`;
    const editedTitle = `${title}_edited`;

    // Any existing work page has the admin SpeedDial with "Uusi teos"
    await adminPage.goto('/works/1');
    await expect(adminPage.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });

    await adminPage.locator('.fixed-dial .p-speeddial-button').click();
    await dialAction(adminPage, 'Uusi teos').click();

    const createDialog = adminPage.getByRole('dialog').filter({ hasText: 'Uusi teos' });
    await createDialog.locator('input[name="title"]').fill(title);
    // FormInputNumber puts the id on the wrapping span, not the actual input.
    await createDialog.locator('#pubyear input').fill('2024');
    // FormDropdown renders an empty <label> (no visible/associated text), so
    // this is the first .p-dropdown in the form - work_type ("Tyyppi").
    await createDialog.locator('.p-dropdown').first().click();
    await adminPage.getByRole('option', { name: 'Romaani' }).click();
    await fillFirstContributor(adminPage, createDialog, 'Verne', 'Kirjoittaja');
    await createDialog.getByRole('button', { name: 'Tallenna' }).click();

    // A successful create navigates to /works/<new id>
    await expect(adminPage.getByRole('heading', { name: title })).toBeVisible({ timeout: 20000 });

    // Edit
    await adminPage.locator('.fixed-dial .p-speeddial-button').click();
    await dialAction(adminPage, 'Muokkaa').click();
    const editDialog = adminPage.getByRole('dialog').filter({ hasText: 'Teoksen muokkaus' });
    await editDialog.locator('input[name="title"]').fill(editedTitle);
    await editDialog.getByRole('button', { name: 'Tallenna' }).click();
    await expect(adminPage.getByRole('heading', { name: editedTitle })).toBeVisible({ timeout: 20000 });

    // Delete
    await adminPage.locator('.fixed-dial .p-speeddial-button').click();
    await dialAction(adminPage, 'Poista').click();
    await adminPage.getByRole('button', { name: 'Kyllä' }).click();
    await expect(adminPage.getByText('Teos poistettu')).toBeVisible({ timeout: 20000 });
    await expect(adminPage.getByRole('heading', { name: editedTitle })).not.toBeVisible();
});
