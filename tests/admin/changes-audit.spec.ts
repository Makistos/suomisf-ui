import { test, expect } from '../fixtures/auth';
import { Page } from '@playwright/test';

const dialAction = (page: Page, label: string) =>
    page.locator(`a.p-speeddial-action[aria-label="${label}"]`);

async function fillFirstContributor(page: Page, dialog: import('@playwright/test').Locator, personQuery: string, roleName: string) {
    await dialog.locator('input[placeholder="Henkilö"]').first().fill(personQuery);
    await expect(page.locator('.p-autocomplete-item').first()).toBeVisible({ timeout: 10000 });
    await page.locator('.p-autocomplete-item').first().click();
    await dialog.locator('.p-dropdown', { hasText: 'Rooli' }).click();
    await page.getByRole('option', { name: roleName }).click();
}

test('an admin create shows up on the /changes audit log', async ({ adminPage }) => {
    const title = `E2E_TEST_changes_audit_${Date.now()}`;

    await adminPage.goto('/works/1');
    await expect(adminPage.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });
    await adminPage.locator('.fixed-dial .p-speeddial-button').click();
    await dialAction(adminPage, 'Uusi teos').click();
    const createDialog = adminPage.getByRole('dialog').filter({ hasText: 'Uusi teos' });
    await createDialog.locator('input[name="title"]').fill(title);
    await createDialog.locator('#pubyear input').fill('2024');
    await createDialog.locator('.p-dropdown').first().click();
    await adminPage.getByRole('option', { name: 'Romaani' }).click();
    await fillFirstContributor(adminPage, createDialog, 'Verne', 'Kirjoittaja');
    await createDialog.getByRole('button', { name: 'Tallenna' }).click();
    await expect(adminPage.getByRole('heading', { name: title })).toBeVisible({ timeout: 20000 });

    // Verify via the API rather than the /changes UI's grouped/paginated
    // table, which is more robust to check directly.
    const changes = await (await adminPage.request.get('http://localhost:5001/api/changes')).json();
    const entry = changes.find((c: { object_name: string; table_name: string }) =>
        c.object_name === title && c.table_name === 'Teos');
    expect(entry).toBeTruthy();
    expect(entry.action).toBe('Uusi');
    expect(entry.user.name).toBe('Test Admin');

    // The /changes page renders straight from this same endpoint
    // (changes-page.tsx's fetchData just GETs "changes"), and its rendering
    // is already covered by tests/anon/changes.spec.ts - no need to
    // duplicate that here via its grouped/paginated table's filter UI.
});
