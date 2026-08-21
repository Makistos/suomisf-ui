import { test, expect } from '@playwright/test';

test('Edition page shows the parent work with that edition highlighted', async ({ page }) => {
    // /editions/:id shares WorkPage with /works/:id, but loads the parent
    // work via editions/<id>/work and highlights the requested edition.
    await page.goto('/editions/1731');

    await expect(page.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });

    await expect(page.getByRole('heading', { name: 'J. R. R. Tolkien' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Lohikäärmevuori/ })).toBeVisible();

    // Work 1505 has 37 editions - exactly the requested one should be highlighted
    await expect(page.locator('.highlighted-edition')).toHaveCount(1);
});
