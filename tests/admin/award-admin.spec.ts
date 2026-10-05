import { test, expect } from '../fixtures/auth';
import { Page } from '@playwright/test';

const dialAction = (page: Page, label: string) =>
    page.locator(`a.p-speeddial-action[aria-label="${label}"]`);

test('admin creates a domestic award and renames it', async ({ adminPage }) => {
    const name = `E2E_TEST_award_${Date.now()}`;
    await adminPage.goto('/awards');
    await adminPage.getByRole('button', { name: 'Lisää palkinto' }).click();
    const dialog = adminPage.getByRole('dialog').filter({ hasText: 'Lisää palkinto' });
    await dialog.locator('input[name="name"]').fill(name);
    // The "Kotimainen" label floats over the box; click the box itself.
    await dialog.locator('.p-checkbox').first().click();
    await expect(dialog.locator('#domestic')).toBeChecked();
    await dialog.getByRole('button', { name: 'Tallenna' }).click();
    await expect(dialog).not.toBeVisible({ timeout: 20000 });

    // Listed among the domestic awards (they come before the foreign ones).
    const link = adminPage.getByRole('link', { name });
    await expect(link).toBeVisible({ timeout: 20000 });
    const foreign = adminPage.getByRole('heading', { name: 'Ulkomaiset palkinnot' });
    expect((await link.boundingBox())!.y).toBeLessThan((await foreign.boundingBox())!.y);

    await link.click();
    await expect(adminPage.getByRole('heading', { name })).toBeVisible({ timeout: 20000 });
    await adminPage.locator('.fixed-dial .p-speeddial-button').click();
    await dialAction(adminPage, 'Muokkaa').click();
    const edit = adminPage.getByRole('dialog').filter({ hasText: 'Muokkaa palkintoa' });
    await edit.locator('input[name="name"]').fill(`${name}_edited`);
    await edit.getByRole('button', { name: 'Tallenna' }).click();
    await expect(adminPage.getByRole('heading', { name: `${name}_edited` })).toBeVisible({ timeout: 20000 });
});

// The preview scrapes the award's source site (sfadb.com, which is down),
// so it is answered here; saving the chosen winners goes to the backend.
test('admin imports only the new winners from a preview', async ({ adminPage }) => {
    const entry = {
        isfdb_category: 'Long Form', our_category: 'Paras romaani', item_type: 1,
        match_type: 'work', category_id: 1, candidates: [],
    };
    await adminPage.route('**/api/awards/7/import/preview', route => route.fulfill({
        json: {
            award_id: 7, award_name: 'Sidewise', errors: [],
            counts: { new: 1, awarded: 1, not_found: 1, ambiguous: 0 },
            entries: [
                // "Beta" (work 12) has no Sidewise award yet.
                { ...entry, year: 2099, title: 'Beta', author: 'Vacklin', target_id: 12, target_title: 'Beta', status: 'new' },
                { ...entry, year: 2004, title: 'Already there', author: 'X', target_id: 713, target_title: 'Already there', status: 'awarded' },
                { ...entry, year: 2005, title: 'E2E unknown book', author: 'Y', match_type: null, target_id: null, target_title: null, status: 'not_found' },
            ],
        },
    }));

    // Sidewise
    await adminPage.goto('/awards/7');
    await expect(adminPage.getByRole('heading', { name: 'Sidewise' }).first()).toBeVisible({ timeout: 20000 });
    await expect(adminPage.getByRole('link', { name: 'Beta' })).toHaveCount(0);

    await adminPage.locator('.fixed-dial .p-speeddial-button').click();
    await dialAction(adminPage, 'Tuo voittajat').click();
    const dialog = adminPage.getByRole('dialog').filter({ hasText: 'Tuo voittajat' });
    await expect(dialog.locator('tbody > tr')).toHaveCount(3, { timeout: 20000 });
    await expect(dialog.getByText('Ei löydy', { exact: true })).toBeVisible();
    // Only the new entry is pre-selected.
    await dialog.getByRole('button', { name: 'Tallenna valitut (1)' }).click();

    await expect(adminPage.getByText('Lisätty 1 voittajaa')).toBeVisible({ timeout: 20000 });
    await expect(dialog).not.toBeVisible();
    await expect(adminPage.getByRole('link', { name: 'Beta' }).first()).toBeVisible({ timeout: 20000 });
});
