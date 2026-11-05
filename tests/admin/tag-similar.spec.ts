import { Page } from '@playwright/test';
import { test, expect } from '../fixtures/auth';

const API_URL = 'http://localhost:5001/api/';

const authHeader = async (page: Page) => {
    const token = await page.evaluate(() => JSON.parse(localStorage.getItem('user') ?? '{}').access_token);
    return { Authorization: `Bearer ${token}` };
};

test('admin links a tag as similar in the edit dialog and removes it', async ({ adminPage, browserName }) => {
    test.setTimeout(90000);
    // So a step that can't be done fails at that step.
    adminPage.setDefaultTimeout(20000);
    await adminPage.goto('/');
    const headers = await authHeader(adminPage);
    // Two tags of our own, deleted afterwards.
    const stamp = `${browserName}${Date.now()}`;
    const names = [`e2esimilar${stamp}a`, `e2esimilar${stamp}b`];
    const ids: number[] = [];
    try {
        for (const name of names) {
            const res = await adminPage.request.post(`${API_URL}tags`, { headers, data: { data: { name } } });
            expect(res.status()).toBe(201);
            ids.push((await res.json()).id);
        }

        await adminPage.goto(`/tags/${ids[0]}`);
        await expect(adminPage.getByRole('heading', { name: names[0] })).toBeVisible({ timeout: 20000 });
        await expect(adminPage.getByRole('heading', { name: 'Samankaltaiset asiasanat' })).toHaveCount(0);

        await adminPage.locator('.fixed-dial .p-speeddial-button').click();
        await adminPage.locator('a.p-speeddial-action[aria-label="Muokkaa"]').click();
        const dialog = adminPage.getByRole('dialog').filter({ hasText: 'Muokkaa' });
        const editor = dialog.locator('section', { hasText: 'Samankaltaiset asiasanat' });
        await expect(editor.getByText('Ei samankaltaisia asiasanoja.')).toBeVisible({ timeout: 20000 });

        const input = editor.getByLabel('Lisää asiasana');
        await input.click();
        await input.pressSequentially(names[1], { delay: 20 });
        await adminPage.locator('.p-autocomplete-item', { hasText: names[1] }).click({ timeout: 20000 });
        await editor.getByRole('button', { name: 'Lisää' }).click();
        await expect(editor.locator('li', { hasText: names[1] })).toContainText('Liittyvä, lisätty käsin',
            { timeout: 20000 });

        // The page itself lists it too.
        await adminPage.keyboard.press('Escape');
        await expect(dialog).toHaveCount(0);
        const pageList = adminPage.locator('div').filter({
            has: adminPage.getByRole('heading', { name: 'Samankaltaiset asiasanat' }),
        }).last();
        await expect(pageList.getByRole('link', { name: names[1] })).toBeVisible({ timeout: 20000 });

        await adminPage.locator('.fixed-dial .p-speeddial-button').click();
        await adminPage.locator('a.p-speeddial-action[aria-label="Muokkaa"]').click();
        await editor.getByRole('button', { name: `Poista ${names[1]}` }).click();
        await expect(editor.getByText('Ei samankaltaisia asiasanoja.')).toBeVisible({ timeout: 20000 });
        const similar = await (await adminPage.request.get(`${API_URL}tags/${ids[0]}/similar`)).json();
        expect(similar).toEqual([]);
    } finally {
        for (const id of ids) await adminPage.request.delete(`${API_URL}tags/${id}`, { headers });
    }
});
