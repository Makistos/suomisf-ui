import { test, expect } from '../fixtures/auth';

test('Test User is logged in and sees no admin menu', async ({ userPage }) => {
    await expect(userPage.getByText('Test User')).toBeVisible();
    await expect(userPage.getByText('Ylläpito')).not.toBeVisible();
});
