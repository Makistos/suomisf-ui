import { test, expect } from '../fixtures/auth';
import { Page } from '@playwright/test';

const dialAction = (page: Page, label: string) =>
    page.locator(`a.p-speeddial-action[aria-label="${label}"]`);

// No "create new pubseries" UI exists (only Muokkaa/Poista on the dial), so
// this covers edit + delete on an existing, safely-deletable pubseries
// (id 227, verified via direct DB query to have zero editions referencing
// it) rather than the usual create-first cycle.
test('admin can edit and delete a pubseries with no linked editions', async ({ adminPage }) => {
    const editedName = `E2E_TEST_pubseries_${Date.now()}`;

    await adminPage.goto('/pubseries/227');
    await expect(adminPage.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });

    // Edit
    await adminPage.locator('.fixed-dial .p-speeddial-button').click();
    await dialAction(adminPage, 'Muokkaa').click();
    const editDialog = adminPage.getByRole('dialog').filter({ hasText: 'Sarjan muokkaus' });
    await editDialog.locator('input[name="name"]').fill(editedName);
    await editDialog.getByRole('button', { name: 'Tallenna' }).click();
    await expect(adminPage.getByRole('heading', { name: editedName })).toBeVisible({ timeout: 20000 });

    // Delete - no confirmation dialog, no toast; navigate(-1) on success.
    const urlBeforeDelete = adminPage.url();
    await adminPage.locator('.fixed-dial .p-speeddial-button').click();
    await dialAction(adminPage, 'Poista').click();
    await expect(adminPage).not.toHaveURL(urlBeforeDelete, { timeout: 20000 });
});
