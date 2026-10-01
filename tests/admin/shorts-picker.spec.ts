import { test, expect } from '../fixtures/auth';
import { Page } from '@playwright/test';

const dialAction = (page: Page, label: string) =>
    page.locator(`a.p-speeddial-action[aria-label="${label}"]`);

// Exercises the picker's chained loads (the work's current stories, then
// a person's stories once one is selected) without saving anything.
test('admin shorts picker loads stories and can add one to the list', async ({ adminPage }) => {
    // "Ihmisen paluu", a collection with 5 stories
    await adminPage.goto('/works/50');
    await expect(adminPage.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });

    await adminPage.locator('.fixed-dial .p-speeddial-button').click();
    await dialAction(adminPage, 'Muokkaa novelleja').click();
    const dialog = adminPage.getByRole('dialog').filter({ hasText: 'Novellit' });
    const items = dialog.locator('.p-orderlist-item');
    await expect(items).toHaveCount(5, { timeout: 20000 });
    await expect(dialog.getByText('Galaksin aivot')).toBeVisible();

    await dialog.locator('.p-autocomplete input').fill('Waltari');
    await adminPage.locator('.p-autocomplete-item', { hasText: 'Waltari' }).first().click();

    // Selecting a person loads their stories into the dropdown
    await dialog.locator('.p-dropdown').first().click();
    const option = adminPage.locator('.p-dropdown-item').first();
    await expect(option).toBeVisible({ timeout: 20000 });
    await option.click();
    await dialog.getByRole('button', { name: 'Lisää' }).click();
    await expect(items).toHaveCount(6);

    // Close without saving
    await adminPage.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
});
