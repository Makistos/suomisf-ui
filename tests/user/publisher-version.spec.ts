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

// The count of the reader's own printings comes with the edition list, for its filters, only for a logged-in user.
test('the publisher\'s edition list gives a logged-in user their own counts', async ({ userPage: page }) => {
    const token = await page.evaluate(() => JSON.parse(localStorage.getItem('user') ?? '{}').access_token);
    const url = 'http://localhost:5001/api/publishers/387/editions?year_min=1976&year_max=1976';
    const mine = await page.request.get(url, { headers: { Authorization: `Bearer ${token}` } });
    expect((await mine.json()).own).toEqual({ editions: expect.any(Number), wishlisted: expect.any(Number) });
    expect((await (await page.request.get(url)).json()).own).toBeNull();
});
