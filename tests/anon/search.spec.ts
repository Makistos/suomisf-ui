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

test('Enter opens a results page with every hit, grouped by type', async ({ page }) => {
    await page.goto('/');
    const search = page.getByPlaceholder('Etsi');
    // Enter right after typing, before the suggestions have even been fetched.
    await search.fill('maailma');
    await search.press('Enter');
    await expect(page).toHaveURL(/\/search\?q=maailma&titles=1$/);
    await expect(page.getByRole('heading', { name: 'Haku: maailma', level: 1 })).toBeVisible();

    // More than the menu's 50 suggestions, in groups with jump links.
    const works = page.getByRole('region', { name: /^Teokset/ });
    await expect(works.getByRole('listitem').first()).toBeVisible({ timeout: 20000 });
    const total = Number((await page.getByText(/^\d[\d\s ]* tulosta/).innerText()).replace(/\D/g, ''));
    expect(total).toBeGreaterThan(50);
    expect(await page.getByRole('listitem').count()).toBe(total);
    await expect(page.getByRole('navigation', { name: 'Tulosryhmät' }).getByRole('link', { name: /^Teokset \(\d+\)$/ })).toBeVisible();

    // The suggestions for the submitted term don't pop up over the page.
    await page.waitForTimeout(1500);
    await expect(page.locator('.p-autocomplete-panel')).toHaveCount(0);
    await expect(search).toHaveValue('');

    await works.getByRole('link').first().click();
    await expect(page).toHaveURL(/\/works\/\d+$/);
});

test('the results page toggles "Vain nimet"', async ({ page }) => {
    await page.goto('/search?q=Vihre%C3%A4%20matka&titles=1');
    const items = page.getByRole('listitem');
    await expect(items).toHaveCount(1, { timeout: 20000 });
    // The checkbox follows the URL, so it changes only after the navigation.
    const toggle = page.locator('#searchPageTitlesOnly');
    await toggle.click();
    await expect(toggle).not.toBeChecked();
    await expect(page).toHaveURL(/\/search\?q=Vihre/);
    await expect(page).not.toHaveURL(/titles=1/);
    await expect(async () => expect(await items.count()).toBeGreaterThan(1)).toPass({ timeout: 20000 });
});

test('Enter on a too short term or on a highlighted suggestion does not open the results page', async ({ page }) => {
    await page.goto('/');
    const search = page.getByPlaceholder('Etsi');
    await search.fill('ma');
    await search.press('Enter');
    await expect(page).not.toHaveURL(/\/search/);

    await search.fill('Vihreä matka');
    await expect(page.locator('.p-autocomplete-item')).toHaveCount(1, { timeout: 20000 });
    await search.press('ArrowDown');
    await search.press('Enter');
    await expect(page).toHaveURL(/\/works\/10$/);
});
