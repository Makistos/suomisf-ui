import { test, expect } from '../fixtures/auth';
import { Page } from '@playwright/test';

const dialAction = (page: Page, label: string) =>
    page.locator(`a.p-speeddial-action[aria-label="${label}"]`);

// There's no "create new publisher" UI anywhere in the app (checked: no
// dial item, no route, no form invoked with a null publisher) - the
// SpeedDial only offers Muokkaa/Poista for the current one. So the test
// creates a publisher through the API (which nothing references yet, so it
// can be deleted) and covers edit + delete in the UI. A fixed existing
// publisher can't be used: every one in the data now has editions,
// magazines or series (the one picked before, 52, has been removed).
test('admin can edit and delete a publisher with no linked content', async ({ adminPage }) => {
    const stamp = Date.now();
    const editedName = `E2E_TEST_publisher_${stamp}`;

    const token = await adminPage.evaluate(() => JSON.parse(localStorage.getItem('user') ?? '{}').access_token);
    const created = await adminPage.request.post('http://localhost:5001/api/publishers', {
        headers: { Authorization: `Bearer ${token}` },
        data: { data: { name: `E2E_TEST_new_${stamp}`, fullname: `E2E_TEST_new_${stamp} Oy` } },
    });
    expect(created.status()).toBe(201);
    const id = Number(await created.json());

    await adminPage.goto(`/publishers/${id}`);
    await expect(adminPage.getByRole('heading', { name: `E2E_TEST_new_${stamp}` })).toBeVisible({ timeout: 20000 });

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
    await expect(adminPage).not.toHaveURL(new RegExp(`/publishers/${id}$`), { timeout: 20000 });
    const gone = await adminPage.request.get(`http://localhost:5001/api/publishers/${id}`);
    expect(await gone.text()).toContain('ei ole olemassa');
});
