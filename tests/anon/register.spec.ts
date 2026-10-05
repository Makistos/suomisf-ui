import { test, expect } from '../fixtures/guard';
import { Page } from '@playwright/test';

async function openRegister(page: Page) {
    await page.goto('/');
    await page.getByRole('menuitem', { name: 'Käyttäjätili' }).click();
    await page.getByRole('menuitem', { name: 'Rekisteröidy' }).click();
    const dialog = page.getByRole('dialog').filter({ hasText: 'Salasana uudestaan' });
    await expect(dialog).toBeVisible();
    return dialog;
}

test('registering a new account logs it in', async ({ page }) => {
    const username = `E2E_TEST_user_${Date.now()}`;
    const password = `e2e-pass-${Date.now()}`;
    const logged: string[] = [];
    page.on('console', (msg) => logged.push(msg.text()));

    const dialog = await openRegister(page);
    await dialog.locator('#username').fill(username);
    await dialog.locator('#email').fill(`${username.toLowerCase()}@example.invalid`);
    await dialog.locator('#password').fill(password);
    await dialog.locator('#password2').fill(password);
    await dialog.getByRole('button', { name: 'Luo tunnus' }).click();

    // Registration reloads the page with the new user signed in.
    await expect(page.getByText(username)).toBeVisible({ timeout: 20000 });
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('user') ?? '{}').name)).toBe(username);
    expect(logged.filter((text) => text.includes(password) || text.includes('access_token'))).toEqual([]);
});

test('registration needs the password twice, the same', async ({ page }) => {
    let registerCalls = 0;
    page.on('request', (request) => { if (request.url().endsWith('/api/register')) registerCalls++; });

    const dialog = await openRegister(page);
    await dialog.locator('#username').fill(`E2E_TEST_mismatch_${Date.now()}`);
    await dialog.locator('#password').fill('e2e-first');
    await dialog.locator('#password2').fill('e2e-second');
    await dialog.getByRole('button', { name: 'Luo tunnus' }).click();

    await expect(dialog.locator('#password2')).toHaveClass(/p-invalid/);
    expect(registerCalls).toBe(0);
});
