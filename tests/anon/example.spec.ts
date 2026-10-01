import { test, expect } from '../fixtures/guard';

test('homepage has title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/SF-Bibliografia/);
});
