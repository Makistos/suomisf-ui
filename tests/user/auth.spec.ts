import { test as base, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth';

base('wrong password shows an inline error, no crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/login');
    await page.locator('#username').fill('Test User');
    await page.locator('#password').fill('not-the-real-password');
    await page.getByRole('button', { name: 'Kirjaudu' }).click();

    await expect(page.getByRole('alert')).toContainText('Väärä salasana');
    expect(errors).toEqual([]);
});

base('correct credentials log the user in', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#username').fill('Test User');
    await page.locator('#password').fill('testpassword123');
    await page.getByRole('button', { name: 'Kirjaudu' }).click();

    await expect(page.getByText('Test User')).toBeVisible({ timeout: 10000 });
});

authTest('logout clears the session', async ({ userPage }) => {
    await expect(userPage.getByText('Test User')).toBeVisible();

    // "Test User" is the Menubar root item for the account menu - click to
    // reveal its submenu, then the logout entry inside it.
    await userPage.getByText('Test User').click();
    await userPage.getByText('Kirjaudu ulos').click();

    await expect(userPage.getByText('Test User')).not.toBeVisible({ timeout: 10000 });
    const user = await userPage.evaluate(() => localStorage.getItem('user'));
    expect(user).toBeNull();
});
