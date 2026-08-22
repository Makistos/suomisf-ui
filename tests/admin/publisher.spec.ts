import { test, expect } from '../fixtures/auth';
import { Page } from '@playwright/test';

const dialAction = (page: Page, label: string) =>
    page.locator(`a.p-speeddial-action[aria-label="${label}"]`);

// There's no "create new publisher" UI anywhere in the app (checked: no
// dial item, no route, no form invoked with a null publisher) - the
// SpeedDial only offers Muokkaa/Poista for the current one. So this covers
// edit + delete on an existing, safely-deletable publisher rather than the
// usual create-first cycle. Publisher 52 ("Egmont Kustannus / Kirjalito")
// was picked by querying Postgres directly for zero edition/magazine/
// pubseries rows referencing it - the publisher API response's own
// `magazines`/`series` fields aren't reliable for this (found one, id 6,
// where the API said magazines: [] but a real FK-referencing row existed,
// which made the delete fail server-side despite the frontend's identical
// "no linked content" check saying it should be safe).
test('admin can edit and delete a publisher with no linked content', async ({ adminPage }) => {
    const editedName = `E2E_TEST_publisher_${Date.now()}`;

    await adminPage.goto('/publishers/52');
    await expect(adminPage.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });

    // Edit
    await adminPage.locator('.fixed-dial .p-speeddial-button').click();
    await dialAction(adminPage, 'Muokkaa').click();
    const editDialog = adminPage.getByRole('dialog').filter({ hasText: 'Kustantajan muokkaus' });
    await editDialog.locator('input[name="name"]').fill(editedName);
    await editDialog.getByRole('button', { name: 'Tallenna' }).click();
    await expect(adminPage.getByRole('heading', { name: editedName })).toBeVisible({ timeout: 20000 });

    // Delete
    await adminPage.locator('.fixed-dial .p-speeddial-button').click();
    await dialAction(adminPage, 'Poista').click();
    await adminPage.getByRole('button', { name: 'Kyllä' }).click();
    // navigate(-1) on success - too racy to assert the toast reliably.
    await expect(adminPage).not.toHaveURL(/\/publishers\/52$/, { timeout: 20000 });
});
