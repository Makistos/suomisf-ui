import { test, expect } from '../fixtures/auth';
import { expectAccessible } from '../fixtures/axe';

test('logged-in work page and profile have no accessibility violations', async ({ userPage }) => {
    await userPage.goto('/works/63');
    await expect(userPage.locator('.work-read-select')).toBeVisible({ timeout: 20000 });
    await userPage.waitForLoadState('networkidle');
    await expectAccessible(userPage);

    const userId = await userPage.evaluate(() => JSON.parse(localStorage.getItem('user') || '{}').id);
    await userPage.goto(`/users/${userId}`);
    await expect(userPage.getByRole('progressbar')).toHaveCount(0, { timeout: 20000 });
    await userPage.waitForLoadState('networkidle');
    await expectAccessible(userPage);
});
