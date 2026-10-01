import { test, expect } from '../fixtures/auth';
import { Page } from '@playwright/test';

const dialAction = (page: Page, label: string) =>
    page.locator(`a.p-speeddial-action[aria-label="${label}"]`);

async function createMagazine(adminPage: Page, name: string) {
    await adminPage.goto('/magazines/6');
    await expect(adminPage.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });
    await adminPage.locator('.fixed-dial .p-speeddial-button').click();
    await dialAction(adminPage, 'Uusi lehti').click();
    // Header is hardcoded "Muokkaa" regardless of create/edit mode.
    const createDialog = adminPage.getByRole('dialog').filter({ hasText: 'Muokkaa' });
    await createDialog.locator('input[name="name"]').fill(name);
    await createDialog.locator('.p-dropdown').first().click();
    await adminPage.getByRole('option', { name: 'Fanzine' }).click();
    await createDialog.getByRole('button', { name: 'Tallenna' }).click();
    // A successful create navigates to /magazines/<new id>
    await expect(adminPage.getByText(name, { exact: true })).toBeVisible({ timeout: 20000 });
}

test('admin can create a magazine and add an issue to it', async ({ adminPage }) => {
    const name = `E2E_TEST_magazine_${Date.now()}`;
    await createMagazine(adminPage, name);

    await adminPage.locator('.fixed-dial .p-speeddial-button').click();
    await dialAction(adminPage, 'Uusi numero').click();
    const issueDialog = adminPage.getByRole('dialog').filter({ hasText: 'Uusi numero' });
    await issueDialog.locator('#number input').fill('1');
    await issueDialog.locator('input[name="cover_number"]').fill('1/2026');
    await issueDialog.locator('#count input').fill('1');
    await issueDialog.locator('#year input').fill('2026');
    await issueDialog.getByRole('button', { name: 'Tallenna' }).click();
    await expect(issueDialog).not.toBeVisible({ timeout: 20000 });
    await expect(adminPage.getByText('1 numeroa')).toBeVisible({ timeout: 20000 });

    // Not deleted afterward: a magazine with an issue genuinely can't be
    // deleted (Issue.magazine_id FK, no cascade) - the backend correctly
    // rejects it (500 "Tietokantavirhe"), it's just that the SpeedDial's
    // "Poista" has no disabled-when-has-issues check the way work-page.tsx's
    // equivalent does, so a real admin could hit this same confusing error.
});

test('admin can delete a magazine that has no issues', async ({ adminPage }) => {
    const name = `E2E_TEST_magazine_${Date.now()}`;
    await createMagazine(adminPage, name);

    const urlBeforeDelete = adminPage.url();
    await adminPage.locator('.fixed-dial .p-speeddial-button').click();
    await dialAction(adminPage, 'Poista').click();
    await adminPage.getByRole('button', { name: 'Kyllä' }).click();
    await expect(adminPage).not.toHaveURL(urlBeforeDelete, { timeout: 20000 });
    // Shown through the app-level toast, so it survives navigate(-1)
    await expect(adminPage.getByText('Lehti poistettu')).toBeVisible({ timeout: 20000 });
});

// Editing used to fail: the form sends publisher: null for a magazine
// without a publisher, which crashed PUT /api/magazines (fixed in the
// backend's update_magazine).
test('admin can edit a magazine without a publisher', async ({ adminPage }) => {
    const name = `E2E_TEST_magazine_edit_${Date.now()}`;
    const editedName = `${name}_edited`;

    await adminPage.goto('/magazines/6');
    await expect(adminPage.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });
    await adminPage.locator('.fixed-dial .p-speeddial-button').click();
    await dialAction(adminPage, 'Uusi lehti').click();
    const createDialog = adminPage.getByRole('dialog').filter({ hasText: 'Muokkaa' });
    await createDialog.locator('input[name="name"]').fill(name);
    await createDialog.locator('.p-dropdown').first().click();
    await adminPage.getByRole('option', { name: 'Fanzine' }).click();
    await createDialog.getByRole('button', { name: 'Tallenna' }).click();
    await expect(adminPage.getByText(name, { exact: true })).toBeVisible({ timeout: 20000 });

    await adminPage.locator('.fixed-dial .p-speeddial-button').click();
    await dialAction(adminPage, 'Muokkaa').click();
    const editDialog = adminPage.getByRole('dialog').filter({ hasText: 'Muokkaa' });
    await editDialog.locator('input[name="name"]').fill(editedName);
    await editDialog.getByRole('button', { name: 'Tallenna' }).click();
    await expect(adminPage.getByText(editedName, { exact: true })).toBeVisible({ timeout: 20000 });
});
