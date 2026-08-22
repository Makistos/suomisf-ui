import { test, expect } from '../fixtures/auth';

test('marking an edition owned shows it under the profile owned tab', async ({ userPage }) => {
    await userPage.goto('/works/63');
    await expect(userPage.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });

    const rating = userPage.locator('.p-rating').first();
    await expect(rating).toBeVisible();

    // Click the 3rd star ("Hyvä" / good condition) - opens a dialog for details
    await rating.locator('.p-rating-item').nth(2).click();
    await userPage.getByRole('button', { name: 'Tallenna' }).click();
    await expect(userPage.getByRole('dialog')).not.toBeVisible();

    // The rating should now show at least one star selected (marked owned)
    const activeCount = await rating.locator('.p-rating-item.p-rating-item-active').count();
    expect(activeCount).toBeGreaterThan(0);

    const userId = await userPage.evaluate(() => JSON.parse(localStorage.getItem('user') || '{}').id);
    await userPage.goto(`/users/${userId}`);
    await expect(userPage.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });
    // "Omistetut" (owned) is the default view, click it anyway to be explicit
    await userPage.getByRole('button', { name: 'Omistetut' }).click();
    await expect(userPage.getByText('Etelän tähti')).toBeVisible({ timeout: 20000 });
});
