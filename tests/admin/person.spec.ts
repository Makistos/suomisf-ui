import { test, expect } from '../fixtures/auth';
import { Page } from '@playwright/test';

const dialAction = (page: Page, label: string) =>
    page.locator(`a.p-speeddial-action[aria-label="${label}"]`);

test('admin can create, edit and delete a person', async ({ adminPage }) => {
    const name = `E2E_TEST_person_${Date.now()}`;
    const editedName = `${name}_edited`;

    await adminPage.goto('/people/1');
    await expect(adminPage.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });

    await adminPage.locator('.fixed-dial .p-speeddial-button').click();
    await dialAction(adminPage, 'Uusi henkilö').click();

    const createDialog = adminPage.getByRole('dialog').filter({ hasText: 'Henkilön tietojen muokkaus' });
    await createDialog.locator('input[name="name"]').fill(name);
    await createDialog.locator('input[name="alt_name"]').fill(name);
    await createDialog.getByRole('button', { name: 'Tallenna' }).click();

    // A successful create navigates to /people/<new id>
    await expect(adminPage.getByRole('heading', { name })).toBeVisible({ timeout: 20000 });

    // Edit
    await adminPage.locator('.fixed-dial .p-speeddial-button').click();
    await dialAction(adminPage, 'Muokkaa').click();
    const editDialog = adminPage.getByRole('dialog').filter({ hasText: 'Henkilön tietojen muokkaus' });
    await editDialog.locator('input[name="name"]').fill(editedName);
    await editDialog.locator('input[name="alt_name"]').fill(editedName);
    await editDialog.getByRole('button', { name: 'Tallenna' }).click();
    await expect(adminPage.getByRole('heading', { name: editedName })).toBeVisible({ timeout: 20000 });

    // Delete - this person has no linked works, so "Poista" isn't disabled;
    // uses explicit acceptLabel/rejectLabel, not the default Kyllä/Ei.
    await adminPage.locator('.fixed-dial .p-speeddial-button').click();
    await dialAction(adminPage, 'Poista').click();
    await adminPage.getByRole('button', { name: 'Poista', exact: true }).click();
    // The success toast is shown on the person page itself, which navigates
    // away to /people in the same tick - too racy to assert on reliably.
    await expect(adminPage).toHaveURL(/\/people$/, { timeout: 20000 });
});
