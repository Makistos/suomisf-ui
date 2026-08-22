import { test, expect } from '../fixtures/auth';

test('marking a work as read (liked) shows it under the profile read tab', async ({ userPage }) => {
    // A different work than ownership.spec.ts/no-admin-ui.spec.ts use, so
    // concurrent runs across browser projects don't contend for the same page.
    await userPage.goto('/works/2');
    await expect(userPage.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });

    const readControl = userPage.locator('.work-read-select');
    await expect(readControl).toBeVisible();

    // Three options: thumbs-down / neutral / thumbs-up - pick "liked"
    await readControl.locator('.pi-thumbs-up').click();
    await expect(readControl.locator('.p-highlight')).toBeVisible();

    const userId = await userPage.evaluate(() => JSON.parse(localStorage.getItem('user') || '{}').id);
    await userPage.goto(`/users/${userId}`);
    await expect(userPage.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });
    await userPage.getByRole('button', { name: 'Luetut' }).click();
    await expect(userPage.getByText('Verenluovuttajan muistikirja')).toBeVisible({ timeout: 20000 });
});
