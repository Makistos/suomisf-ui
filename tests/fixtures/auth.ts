import { test as base, expect, Page } from '@playwright/test';

const API_URL = 'http://localhost:5001/api/';

type StoredUser = {
    access_token: string;
    refresh_token: string;
    id: number;
    name: string;
    role: string;
};

async function loginAs(username: string, password: string): Promise<StoredUser> {
    const res = await fetch(`${API_URL}login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
        throw new Error(`login as ${username} failed: ${res.status} ${await res.text()}`);
    }
    return (await res.json()) as StoredUser;
}

async function pageAs(browser: import('@playwright/test').Browser, user: StoredUser): Promise<Page> {
    const context = await browser.newContext();
    const page = await context.newPage();
    // localStorage is origin-scoped, so a page needs to have navigated to the
    // app's origin at least once before it can be written to.
    await page.goto('/');
    await page.evaluate((u) => localStorage.setItem('user', JSON.stringify(u)), user);
    await page.reload();
    return page;
}

export const test = base.extend<{ adminPage: Page; userPage: Page }>({
    adminPage: async ({ browser }, use) => {
        const user = await loginAs('Test Admin', 'testadminpass123');
        const page = await pageAs(browser, user);
        await use(page);
        await page.close();
    },
    userPage: async ({ browser }, use) => {
        const user = await loginAs('Test User', 'testpassword123');
        const page = await pageAs(browser, user);
        await use(page);
        await page.close();
    },
});

export { expect };
