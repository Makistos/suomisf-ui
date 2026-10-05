import { test, expect } from '../fixtures/guard';

test('main search finds a work by title and opens it', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Etsi').fill('Vihreä matka');
    const items = page.locator('.p-autocomplete-item');
    // "Vain nimet" is on by default: only the title matches.
    await expect(items).toHaveCount(1, { timeout: 20000 });
    await items.filter({ hasText: 'Vihreä matka' }).click();
    await expect(page).toHaveURL(/\/works\/10$/);
    await expect(page.getByRole('heading', { name: 'Vihreä matka' }).first()).toBeVisible({ timeout: 20000 });
});

test('turning off "Vain nimet" searches all text and is remembered', async ({ page }) => {
    await page.goto('/');
    const search = page.getByPlaceholder('Etsi');
    await search.fill('Vihreä matka');
    const items = page.locator('.p-autocomplete-item');
    await expect(items).toHaveCount(1, { timeout: 20000 });

    await page.getByText('Vain nimet').click();
    expect(await page.evaluate(() => localStorage.getItem('searchTitlesOnly'))).toBe('0');
    // The same query again, now matching descriptions and other text too.
    await search.fill('');
    await search.fill('Vihreä matka');
    await expect(async () => expect(await items.count()).toBeGreaterThan(1)).toPass({ timeout: 20000 });

    await page.reload();
    await expect(page.locator('#searchTitlesOnly')).not.toBeChecked();
});

test('main search finds a person and opens their page', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Etsi').fill('Sinisalo');
    // Her works also mention her, on their author line; pick the person.
    const person = page.locator('.p-autocomplete-item').filter({
        has: page.locator('.searchItemHeader', { hasText: /^Sinisalo, Johanna$/ }),
    });
    await expect(person).toBeVisible({ timeout: 20000 });
    await person.click();
    await expect(page).toHaveURL(/\/people\/368$/);
});
