import { test, expect } from '../fixtures/auth';

// A logged-in user who isn't an admin gets the current publisher page and no switch.
test('a regular user sees the current publisher page without the switch', async ({ userPage: page }) => {
    await page.evaluate(() => localStorage.setItem('suomisf.publisherPageVersion', 'uusi'));
    await page.goto('/publishers/387');
    await expect(page.locator('main.publisher-page')).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('page-version')).toHaveCount(0);
    await page.keyboard.press('Shift+KeyU');
    await expect(page.locator('[data-publisher-page="uusi"]')).toHaveCount(0);
});

// The count of the reader's own printings comes from the summary only for a logged-in user (GET /api/publishers/:id/summary).
test('the publisher summary gives a logged-in user their own counts', async ({ userPage: page }) => {
    const token = await page.evaluate(() => JSON.parse(localStorage.getItem('user') ?? '{}').access_token);
    const mine = await page.request.get('http://localhost:5001/api/publishers/387/summary', { headers: { Authorization: `Bearer ${token}` } });
    expect((await mine.json()).own).toEqual({ editions: expect.any(Number), wishlisted: expect.any(Number) });
    const visitor = await page.request.get('http://localhost:5001/api/publishers/387/summary');
    expect((await visitor.json()).own).toBeNull();
});
