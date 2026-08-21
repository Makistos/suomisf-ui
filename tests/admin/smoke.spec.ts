import { test, expect } from '../fixtures/auth';

test('Test Admin is logged in and sees the admin menu', async ({ adminPage }) => {
    await expect(adminPage.getByText('Test Admin')).toBeVisible();
    await expect(adminPage.getByText('Ylläpito')).toBeVisible();
});
