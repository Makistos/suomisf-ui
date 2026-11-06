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
    // copied similarity job results; "jännitys" had none.
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

    // A tag without similar tags has no such section. Checked against the
    // API, since a rerun of the job can give any tag suggestions.
    const none: unknown[] = await (await page.request.get('http://localhost:5001/api/tags/445/similar')).json();
    await page.goto('/tags/445');
    await expect(page.getByRole('heading', { name: 'jännitys' })).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('heading', { name: 'Samankaltaiset asiasanat' })).toHaveCount(none.length ? 1 : 0);
    // Nor the option to list similar tags' works.
    await expect(page.getByLabel('Näytä myös samankaltaisten asiasanojen teokset')).toHaveCount(none.length ? 1 : 0);
});

test('Tag page can list the similar tags\' works too, each once, with the tags they match', async ({ page }) => {
    await page.goto('/tags/937');
    const works = page.getByRole('tabpanel').locator('a[href^="/works/"]:not(.p-tag)');
    await expect(works.first()).toBeVisible({ timeout: 20000 });
    const own = new Set(await works.evaluateAll(as => as.map(a => a.getAttribute('href'))));

    await page.getByLabel('Näytä myös samankaltaisten asiasanojen teokset').check();
    // Each work lists the tags it matched, "eurooppa" first if it has it.
    const matched = page.getByRole('tabpanel').locator('a[href^="/tags/"]');
    await expect(matched.first()).toBeVisible({ timeout: 20000 });
    const hrefs = await works.evaluateAll(as => as.map(a => a.getAttribute('href')));
    const listed = new Set(hrefs);
    expect(listed.size).toBeGreaterThan(own.size);
    for (const href of own) expect(listed.has(href)).toBe(true);
    // A work is listed once (its title link, plus edition links of the same work).
    const titles = await page.getByRole('tabpanel').locator('.work-oneliner a[href^="/works/"]')
        .evaluateAll(as => as.map(a => a.getAttribute('href')));
    expect(new Set(titles).size).toBe(titles.length);
    await expect(page.getByRole('tabpanel').getByRole('link', { name: 'eurooppa' }).first()).toBeVisible();
});
