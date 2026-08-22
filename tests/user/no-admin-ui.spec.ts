import { test, expect } from '../fixtures/auth';

test('a regular user sees no admin controls on content pages', async ({ userPage }) => {
    await userPage.goto('/works/63');
    await expect(userPage.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });
    await expect(userPage.locator('.fixed-dial')).toHaveCount(0);

    await userPage.goto('/magazines/6');
    await expect(userPage.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });
    await expect(userPage.locator('.fixed-dial')).toHaveCount(0);

    await expect(userPage.getByText('Ylläpito')).not.toBeVisible();
});
