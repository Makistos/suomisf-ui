import { test, expect } from '../fixtures/auth';

test('marking a work as read (liked) with a note shows both under the profile read tab', async ({ userPage }) => {
    // A different work than ownership.spec.ts/no-admin-ui.spec.ts use, so
    // concurrent runs across browser projects don't contend for the same page.
    await userPage.goto('/works/2');
    await expect(userPage.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });

    const readControl = userPage.locator('.work-read-select');
    await expect(readControl).toBeVisible();

    // Three icon-only options, named for screen readers; pick "liked".
    for (const name of ['En pitänyt', 'Ihan ok']) {
        await expect(readControl.getByRole('button', { name })).toBeVisible();
    }
    await readControl.getByRole('button', { name: 'Pidin' }).click();
    await expect(readControl.locator('.p-highlight')).toBeVisible();

    // Choosing an opinion asks for a note, like an owned edition's condition.
    const note = `Luettu testissä ${Date.now()}`;
    const dialog = userPage.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('Lisätietoja').fill(note);
    await dialog.getByRole('button', { name: 'Tallenna' }).click();
    await expect(dialog).not.toBeVisible();

    // The comment button shows the note and reopens the dialog to edit it.
    const noteButton = userPage.getByRole('button', { name: `Lisätietoja: ${note}` });
    await expect(noteButton).toBeVisible();
    await noteButton.click();
    await expect(dialog.getByLabel('Lisätietoja')).toHaveValue(note);
    await dialog.getByRole('button', { name: 'Tallenna' }).click();

    const userId = await userPage.evaluate(() => JSON.parse(localStorage.getItem('user') || '{}').id);
    await userPage.goto(`/users/${userId}`);
    await expect(userPage.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });
    await userPage.getByRole('button', { name: 'Luetut' }).click();
    await expect(userPage.getByText('Verenluovuttajan muistikirja')).toBeVisible({ timeout: 20000 });
    await expect(userPage.getByRole('cell', { name: note })).toBeVisible();
});
