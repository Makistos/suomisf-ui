import { test, expect } from '../fixtures/auth';
import { Page } from '@playwright/test';

const dialAction = (page: Page, label: string) =>
    page.locator(`a.p-speeddial-action[aria-label="${label}"]`);

test('admin can create a new short story via the work shorts picker', async ({ adminPage }) => {
    const title = `E2E_TEST_short_${Date.now()}`;

    await adminPage.goto('/works/2');
    await expect(adminPage.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });

    await adminPage.locator('.fixed-dial .p-speeddial-button').click();
    await dialAction(adminPage, 'Muokkaa novelleja').click();

    const pickerDialog = adminPage.getByRole('dialog').filter({ hasText: 'Novellit' });
    await pickerDialog.getByRole('button', { name: 'Uusi' }).click();

    // No header text to filter on (Dialog has no header prop) - it's the
    // second dialog now open, nested alongside the picker.
    const shortDialog = adminPage.getByRole('dialog').nth(1);
    await shortDialog.locator('input[name="title"]').fill(title);
    // FormDropdown renders an empty label - this is the first .p-dropdown
    // in the form (type/"Tyyppi"), before the contributor role dropdown.
    await shortDialog.locator('.p-dropdown').first().click();
    await adminPage.getByRole('option', { name: 'Novelli', exact: true }).click();

    // Contributor - same requirement as work creation (backend rejects an
    // empty contributor list).
    const personInput = shortDialog.locator('input[placeholder="Henkilö"]').first();
    await personInput.click();
    await personInput.type('Verne', { delay: 100 });
    await expect(adminPage.locator('.p-autocomplete-item').first()).toBeVisible({ timeout: 10000 });
    await adminPage.locator('.p-autocomplete-item').first().click();
    await shortDialog.locator('.p-dropdown', { hasText: 'Rooli' }).click();
    await adminPage.getByRole('option', { name: 'Kirjoittaja' }).click();

    await shortDialog.getByRole('button', { name: 'Tallenna' }).click();
    await expect(shortDialog).not.toBeVisible({ timeout: 20000 });

    // Back in the picker, the new short should now be in the working list -
    // save the picker to attach it to the work.
    await expect(pickerDialog.getByText(title)).toBeVisible({ timeout: 10000 });
    await pickerDialog.getByRole('button', { name: 'Tallenna' }).click();
    await expect(pickerDialog).not.toBeVisible({ timeout: 20000 });

    const work = await (await adminPage.request.get('http://localhost:5001/api/works/2')).json();
    const created = work.stories?.find((s: { title: string }) => s.title === title);
    expect(created).toBeTruthy();
});
