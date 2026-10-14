import { test, expect } from '../fixtures/auth';

test('user menu opens the user list, which links to user pages', async ({ userPage }) => {
    const errors: string[] = [];
    userPage.on('pageerror', (e) => errors.push(e.message));

    await userPage.goto('/');
    await userPage.getByRole('menuitem', { name: 'Test User' }).click();
    await userPage.getByRole('menuitem', { name: 'Käyttäjät' }).click();
    await expect(userPage).toHaveURL(/\/users$/);
    await expect(userPage.getByRole('heading', { name: 'Käyttäjät' })).toBeVisible();

    for (const header of ['Nimi', 'Rooli', 'Omistaa', 'Toivelista', 'Luettu']) {
        await expect(userPage.getByRole('columnheader', { name: header })).toBeVisible();
    }

    // The test admin is marked as one; the test user is not.
    const adminRow = userPage.getByRole('row').filter({
        has: userPage.getByRole('link', { name: 'Test Admin', exact: true }) });
    await expect(adminRow.getByText('Ylläpitäjä')).toBeVisible();
    const userRow = userPage.getByRole('row').filter({
        has: userPage.getByRole('link', { name: 'Test User', exact: true }) });
    await expect(userRow.getByText('Ylläpitäjä')).toHaveCount(0);

    // The search narrows the list by name.
    await userPage.getByRole('textbox', { name: 'Hae käyttäjää nimellä' }).fill('Test Admin');
    await expect(userPage.getByRole('link', { name: 'Test User', exact: true })).toHaveCount(0);
    await userPage.getByRole('textbox', { name: 'Hae käyttäjää nimellä' }).fill('');

    const userId = await userPage.evaluate(() => JSON.parse(localStorage.getItem('user') || '{}').id);
    await userPage.getByRole('link', { name: 'Test User', exact: true }).click();
    await expect(userPage).toHaveURL(new RegExp(`/users/${userId}$`));

    expect(errors).toEqual([]);
});

test('menu dropdowns open above the user table', async ({ userPage }) => {
    await userPage.goto('/users');
    await expect(userPage.getByRole('columnheader', { name: 'Nimi' })).toBeVisible();
    // "Kustantajan sarjat" sits over the table's sticky header row; the click
    // fails if the header covers it (it used to).
    await userPage.getByRole('menuitem', { name: 'Muut' }).click();
    await userPage.getByRole('menuitem', { name: 'Kustantajan sarjat' }).click();
    await expect(userPage).toHaveURL(/\/pubseries$/);
});
