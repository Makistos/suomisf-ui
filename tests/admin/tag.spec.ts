import { test, expect } from '../fixtures/auth';
import { Page } from '@playwright/test';

const dialAction = (page: Page, label: string) =>
    page.locator(`a.p-speeddial-action[aria-label="${label}"]`);

// There's no "create new tag" UI (only Muokkaa/Yhdistä/Poista on the dial) -
// tags are created implicitly elsewhere (e.g. free text in a work's tag
// field) rather than through a dedicated form. This covers rename + delete
// on an existing, safely-deletable tag (id 542 "solarpunk", verified via
// direct DB query to have zero work/story/article links).
test('admin can rename and delete a tag with no linked content', async ({ adminPage }) => {
    const editedName = `E2E_TEST_tag_${Date.now()}`;

    await adminPage.goto('/tags/542');
    await expect(adminPage.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });

    // Rename
    await adminPage.locator('.fixed-dial .p-speeddial-button').click();
    await dialAction(adminPage, 'Muokkaa').click();
    const editDialog = adminPage.getByRole('dialog').filter({ hasText: 'Muokkaa' });
    await editDialog.locator('input[name="name"]').fill(editedName);
    // Submit button here is labeled "Vaihda", not "Tallenna" like every
    // other form in the app.
    await editDialog.getByRole('button', { name: 'Vaihda' }).click();
    await expect(adminPage.getByRole('heading', { name: editedName })).toBeVisible({ timeout: 20000 });

    // Delete - no confirmation dialog since this tag has no linked content;
    // navigate(-1) on success, no toast.
    const urlBeforeDelete = adminPage.url();
    await adminPage.locator('.fixed-dial .p-speeddial-button').click();
    await dialAction(adminPage, 'Poista').click();
    await expect(adminPage).not.toHaveURL(urlBeforeDelete, { timeout: 20000 });
});
