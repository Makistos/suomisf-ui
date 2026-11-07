import { test, expect } from '../fixtures/auth';
import { Page } from '@playwright/test';

const dialAction = (page: Page, label: string) =>
    page.locator(`a.p-speeddial-action[aria-label="${label}"]`);

test('admin can create, edit and delete a bookseries', async ({ adminPage }) => {
    const name = `E2E_TEST_bookseries_${Date.now()}`;
    const editedName = `${name}_edited`;

    await adminPage.goto('/bookseries/1');
    await expect(adminPage.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });

    await adminPage.locator('.fixed-dial .p-speeddial-button').click();
    await dialAction(adminPage, 'Uusi kirjasarja').click();
    const createDialog = adminPage.getByRole('dialog').filter({ hasText: 'Uusi kirjasarja' });
    await createDialog.locator('input[name="name"]').fill(name);
    await createDialog.getByRole('button', { name: 'Tallenna' }).click();
    await expect(adminPage.getByRole('heading', { name })).toBeVisible({ timeout: 20000 });
    // A new series, not series 1 renamed (the form used to get the page's series).
    await expect(adminPage).not.toHaveURL(/\/bookseries\/1$/);

    // Edit
    await adminPage.locator('.fixed-dial .p-speeddial-button').click();
    await dialAction(adminPage, 'Muokkaa').click();
    const editDialog = adminPage.getByRole('dialog').filter({ hasText: 'Muokkaa kirjasarjaa' });
    await editDialog.locator('input[name="name"]').fill(editedName);
    await editDialog.getByRole('button', { name: 'Tallenna' }).click();
    await expect(adminPage.getByRole('heading', { name: editedName })).toBeVisible({ timeout: 20000 });

    // Delete - asks for confirmation, then navigate(-1) on success.
    const urlBeforeDelete = adminPage.url();
    await adminPage.locator('.fixed-dial .p-speeddial-button').click();
    await dialAction(adminPage, 'Poista').click();
    await adminPage.getByRole('button', { name: 'Kyllä' }).click();
    await expect(adminPage).not.toHaveURL(urlBeforeDelete, { timeout: 20000 });
});
