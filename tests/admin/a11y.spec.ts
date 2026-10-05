import { test, expect } from '../fixtures/auth';
import { Page } from '@playwright/test';
import { expectAccessible } from '../fixtures/axe';

const dialAction = (page: Page, label: string) =>
    page.locator(`a.p-speeddial-action[aria-label="${label}"]`);

async function openFromDial(page: Page, action: string) {
    await page.locator('.fixed-dial .p-speeddial-button').click();
    await dialAction(page, action).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Tallenna' })).toBeVisible({ timeout: 20000 });
    return dialog;
}

test('admin work page and its edit dialogs have no accessibility violations', async ({ adminPage }) => {
    await adminPage.goto('/works/63');
    await expect(adminPage.locator('.fixed-dial')).toBeVisible({ timeout: 20000 });
    await adminPage.waitForLoadState('networkidle');
    await expectAccessible(adminPage);

    // Work form, then new-edition form, scanned inside their dialogs.
    for (const action of ['Muokkaa', 'Uusi painos']) {
        const dialog = await openFromDial(adminPage, action);
        await expectAccessible(adminPage, { include: '.p-dialog' });
        await adminPage.keyboard.press('Escape');
        await expect(dialog).toHaveCount(0);
    }
});

test('admin person form has no accessibility violations', async ({ adminPage }) => {
    await adminPage.goto('/people/368');
    await expect(adminPage.locator('.fixed-dial')).toBeVisible({ timeout: 20000 });
    await openFromDial(adminPage, 'Muokkaa');
    await expectAccessible(adminPage, { include: '.p-dialog' });
});
