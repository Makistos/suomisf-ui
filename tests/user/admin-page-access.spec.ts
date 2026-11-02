import { test, expect } from '../fixtures/auth';

// The admin page (/admin) is only for admins; others get a notice, not the tools.
test('a regular user cannot use the admin page', async ({ userPage }) => {
    await userPage.goto('/admin');
    await expect(userPage.getByRole('heading', { name: 'Ei käyttöoikeutta' })).toBeVisible({ timeout: 20000 });
    await expect(userPage.getByText('Teosten linkkien lähteet')).toHaveCount(0);
    await expect(userPage.getByRole('button', { name: 'Hae teoksia' })).toHaveCount(0);
});

test('an anonymous visitor cannot use the admin page', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Ei käyttöoikeutta' })).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('button', { name: 'Hae teoksia' })).toHaveCount(0);
});

test('the profile page no longer has the incomplete-work search', async ({ userPage }) => {
    const id = await userPage.evaluate(() => JSON.parse(localStorage.getItem('user') ?? '{}').id);
    await userPage.goto(`/users/${id}`);
    await expect(userPage.getByRole('button', { name: 'Omistetut' })).toBeVisible({ timeout: 20000 });
    await expect(userPage.getByRole('button', { name: 'Satunnainen keskeneräinen teos' })).toHaveCount(0);
});
