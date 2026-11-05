import { test, expect } from '../fixtures/guard';

test('Tag page loads with description and linked works', async ({ page }) => {
    await page.goto('/tags/521');

    await expect(page.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });

    await expect(page.getByRole('heading', { name: 'dystopia' })).toBeVisible();
    await expect(page.getByText('Alagenre')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Teoksia' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Novelleja' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Artikkeleita' })).toBeVisible();

    // A large tag (300+ works) - regression coverage for rendering many rows
    await expect(page.getByRole('heading', { name: 'Stephen King' })).toBeVisible();
});

test('Tag page lists the suggested similar tags, the rest behind a button', async ({ page }) => {
    // "eurooppa" has many place suggestions (the countries in it) in the
    // copied similarity job results; "dystopia" has none.
    await page.goto('/tags/937');
    const similar = page.locator('div').filter({
        has: page.getByRole('heading', { name: 'Samankaltaiset asiasanat' }),
    }).last();
    await expect(similar).toBeVisible({ timeout: 20000 });
    const links = similar.locator('a[href^="/tags/"]');
    await expect(links).toHaveCount(12);
    await similar.getByRole('button', { name: /^\+/ }).click();
    expect(await links.count()).toBeGreaterThan(12);
    await links.first().click();
    await expect(page).toHaveURL(/\/tags\/\d+$/);

    await page.goto('/tags/521');
    await expect(page.getByRole('heading', { name: 'dystopia' })).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('heading', { name: 'Samankaltaiset asiasanat' })).toHaveCount(0);
});
