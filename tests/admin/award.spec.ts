import { test, expect } from '../fixtures/auth';
import { Page } from '@playwright/test';

const dialAction = (page: Page, label: string) =>
    page.locator(`a.p-speeddial-action[aria-label="${label}"]`);

// There's no "create new award" UI (award-page.tsx only has Muokkaa/Tuo
// voittajat, awards-page.tsx list has no admin controls at all). What *is*
// creatable through the UI is an award-winner entry: a work receiving an
// existing award, via the work page's "Palkinnot" SpeedDial item.
test('admin can add and remove an award-winner entry on a work', async ({ adminPage }) => {
    await adminPage.goto('/works/3');
    await expect(adminPage.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });

    await adminPage.locator('.fixed-dial .p-speeddial-button').click();
    await dialAction(adminPage, 'Palkinnot').click();

    const dialog = adminPage.getByRole('dialog').filter({ hasText: 'Palkinnot' });
    await dialog.getByRole('button', { name: 'Lisää palkinto' }).click();

    // .fill() doesn't register on this InputNumber (controlled directly by
    // TanStack Form, not the FormInputNumber wrapper other forms use).
    const yearInput = dialog.locator('input[name="year"]');
    await yearInput.click();
    await yearInput.type('2020', { delay: 50 });

    const awardInput = dialog.locator('input[placeholder="Palkinto"]');
    await awardInput.click();
    await awardInput.type('Hugo', { delay: 100 });
    await expect(adminPage.locator('.p-autocomplete-item').first()).toBeVisible({ timeout: 10000 });
    await adminPage.locator('.p-autocomplete-item').first().click();

    // category is required server-side (FK NOT NULL) despite looking optional
    await dialog.locator('.p-dropdown', { hasText: 'Kategoria' }).click();
    await adminPage.locator('.p-dropdown-item').first().click();

    await dialog.getByRole('button', { name: 'Tallenna' }).click();

    const workAfterAdd = await (await adminPage.request.get('http://localhost:5001/api/works/3')).json();
    const added = workAfterAdd.awards.find((a: { year: number; award: { name: string } }) =>
        a.year === 2020 && a.award.name === 'Hugo');
    expect(added).toBeTruthy();

    // Remove it again
    await adminPage.locator('.fixed-dial .p-speeddial-button').click();
    await dialAction(adminPage, 'Palkinnot').click();
    const dialog2 = adminPage.getByRole('dialog').filter({ hasText: 'Palkinnot' });
    await dialog2.locator('.pi-trash').last().click();
    await dialog2.getByRole('button', { name: 'Tallenna' }).click();

    const workAfterRemove = await (await adminPage.request.get('http://localhost:5001/api/works/3')).json();
    const stillThere = workAfterRemove.awards.find((a: { year: number; award: { name: string } }) =>
        a.year === 2020 && a.award.name === 'Hugo');
    expect(stillThere).toBeFalsy();
});
