import { test, expect } from '../fixtures/guard';

// Following an in-app link between two items of the same type keeps the
// same page component mounted and only changes its route param. These
// catch effects/memos that don't re-run on the new id (stale data from
// the previous item) and ones that re-run endlessly (caught by the guard).

test('work page updates when following a link to another work', async ({ page }) => {
    await page.goto('/works/63');
    await expect(page.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('heading', { name: 'Etelän tähti' })).toBeVisible();

    // "Myös teoksessa:" links to the omnibus containing this work
    await page.getByRole('link', { name: /Merkilliset matkat/ }).first().click();

    await expect(page).not.toHaveURL(/\/works\/63$/);
    await expect(page.getByRole('heading', { name: /Merkilliset matkat/ }).first()).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('heading', { name: 'Etelän tähti', exact: true })).not.toBeVisible();
});

test('person page updates when following real-name and alias links', async ({ page }) => {
    // "Outsider" is a pseudonym shared by two people, so it has a page of
    // its own (a single-user pseudonym resolves to the real person instead).
    await page.goto('/people/1429');
    await expect(page.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });
    const heading = page.locator('h1').first();
    await expect(heading).toContainText(/Outsider/i, { timeout: 20000 });

    // Pseudonym -> one of the real people behind it
    await page.getByRole('link', { name: /Haapakoski/ }).first().click();
    await expect(page).toHaveURL(/\/people\/1428$/);
    await expect(heading).toContainText(/Haapakoski/i, { timeout: 20000 });

    // ...and back via the alias link
    await page.getByRole('link', { name: 'Outsider', exact: true }).first().click();
    await expect(page).toHaveURL(/\/people\/1429$/);
    await expect(heading).toContainText(/Outsider/i, { timeout: 20000 });
});
