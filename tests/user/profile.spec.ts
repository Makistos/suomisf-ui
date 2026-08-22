import { test, expect } from '../fixtures/auth';

test('profile stats and collection value load without error once a book is owned', async ({ userPage }) => {
    const errors: string[] = [];
    userPage.on('pageerror', (e) => errors.push(e.message));

    // Mark an edition owned first (a different work than ownership.spec.ts
    // uses, to avoid a parallel-run race on the same edition row)
    await userPage.goto('/works/1');
    await expect(userPage.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });
    const rating = userPage.locator('.p-rating').first();
    await rating.locator('.p-rating-item').nth(2).click();
    await userPage.getByRole('button', { name: 'Tallenna' }).click();
    await expect(userPage.getByRole('dialog')).not.toBeVisible();

    const userId = await userPage.evaluate(() => JSON.parse(localStorage.getItem('user') || '{}').id);
    await userPage.goto(`/users/${userId}`);
    await expect(userPage.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });

    await userPage.getByRole('button', { name: 'Tilastoja' }).click();
    await expect(userPage.getByRole('tab', { name: 'Omistetut teokset' })).toBeVisible({ timeout: 20000 });
    await expect(userPage.locator('canvas').first()).toBeVisible();

    await userPage.getByRole('button', { name: 'Kokoelman arvo' }).click();
    await expect(userPage.getByRole('dialog').getByText('Kokoelman arvo')).toBeVisible({ timeout: 20000 });

    expect(errors).toEqual([]);
});
