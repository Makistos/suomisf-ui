import { test, expect } from '../fixtures/auth';
import { Page } from '@playwright/test';

const dialAction = (page: Page, label: string) =>
    page.locator(`a.p-speeddial-action[aria-label="${label}"]`);

async function openPicker(page: Page) {
    await page.locator('.fixed-dial .p-speeddial-button').click();
    await dialAction(page, 'Muokkaa kokoomateosta').click();
    return page.getByRole('dialog').filter({ hasText: 'Valitut teokset' });
}

test('admin adds a work to an omnibus with an explanation, then removes it', async ({ adminPage }) => {
    const explanation = `E2E_TEST_selitys_${Date.now()}`;
    // "Diminthras", which contains no other works
    await adminPage.goto('/works/11');
    await expect(adminPage.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });
    await expect(adminPage.getByText('Sisältää teokset:')).toHaveCount(0);

    let dialog = await openPicker(adminPage);
    await dialog.locator('.p-autocomplete input').fill('Waltari');
    await adminPage.locator('.p-autocomplete-item', { hasText: 'Waltari' }).first().click();

    // Picking the person loads their works into the dropdown.
    await dialog.locator('.p-dropdown').first().click();
    const option = adminPage.locator('.p-dropdown-item').first();
    await expect(option).toBeVisible({ timeout: 20000 });
    const title = ((await option.textContent()) ?? '').split(' (')[0].trim();
    await option.click();
    await dialog.getByRole('button', { name: 'Lisää', exact: true }).click();
    const items = dialog.locator('.p-orderlist-item');
    await expect(items).toHaveCount(1);
    await items.first().getByPlaceholder('Lisää selitys...').fill(explanation);
    await dialog.getByRole('button', { name: 'Tallenna' }).click();
    await expect(dialog).not.toBeVisible({ timeout: 20000 });

    const contents = adminPage.locator('li', { hasText: explanation });
    await expect(contents).toBeVisible({ timeout: 20000 });
    await expect(contents.getByRole('link')).toContainText(title);

    // The picker starts from the saved contents; emptying it removes the work.
    dialog = await openPicker(adminPage);
    await expect(items).toHaveCount(1, { timeout: 20000 });
    await items.first().getByRole('button').click();
    await expect(items).toHaveCount(0);
    await dialog.getByRole('button', { name: 'Tallenna' }).click();
    await expect(dialog).not.toBeVisible({ timeout: 20000 });
    await expect(adminPage.getByText('Sisältää teokset:')).toHaveCount(0, { timeout: 20000 });
});
