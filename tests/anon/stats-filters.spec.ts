import { test, expect, Page } from '../fixtures/guard';
import { selectOption } from '../fixtures/dropdown';

// Changing a chart's filter must refetch and re-render with the new
// selection: catches memos/effects that keep showing the old data.
async function changePeopleRole(page: Page, roleLabel: string) {
    const card = page.locator('.p-card', { hasText: 'Tuotteliaimmat henkilöt' });
    const table = card.locator('table');
    await expect(table.locator('tbody tr').first()).toBeVisible({ timeout: 20000 });
    const firstBefore = await table.locator('tbody tr').first().textContent();

    const refetch = page.waitForRequest(req => req.url().includes('stats/topcontributors') && /role=2/.test(req.url()));
    const roleFilter = page.locator('.stats-filter-bar .p-dropdown', { has: page.locator('#people-role') });
    await selectOption(page, roleFilter, roleLabel, { exact: true });
    await refetch;

    await expect(table.locator('thead')).toContainText(roleLabel, { timeout: 20000 });
    await expect(table.locator('tbody tr').first()).not.toHaveText(firstBefore ?? '', { timeout: 20000 });
    // Translators exist for both books and stories, so the table has people.
    await expect(table.locator('tbody tr a').first()).toBeVisible();
}

test('people tab top-people table follows the role filter for books', async ({ page }) => {
    await page.goto('/stats?tab=henkilot');
    await changePeopleRole(page, 'Kääntäjä');
});

test('people tab top-people table follows the role filter for stories', async ({ page }) => {
    await page.goto('/stats?tab=henkilot');
    await page.getByRole('radio', { name: 'Novellit' }).or(page.getByRole('button', { name: 'Novellit' })).first().click();
    await changePeopleRole(page, 'Kääntäjä');
});

test('people tab can count books and stories together', async ({ page }) => {
    await page.goto('/stats?tab=henkilot');
    const card = page.locator('.p-card', { hasText: 'Tuotteliaimmat henkilöt' });
    await expect(card.locator('tbody tr').first()).toBeVisible({ timeout: 20000 });
    const refetch = page.waitForRequest(req => req.url().includes('stats/topcontributors') && /material=all/.test(req.url()));
    await page.getByRole('group', { name: 'Suodattimet' }).getByText('Kaikki', { exact: true }).click();
    await refetch;
    await expect(card.locator('thead')).toContainText('Teoksia ja novelleja', { timeout: 20000 });
});

test('first editions can be grouped by genre', async ({ page }) => {
    await page.goto('/stats?tab=julkaisut');
    const card = page.locator('.p-card', { hasText: 'Ensipainokset vuosittain' });
    await expect(card.locator('canvas')).toBeVisible({ timeout: 20000 });
    await card.getByText('Genret', { exact: true }).click();
    await expect(card.getByText(/Teoksia genreryhmän/)).toBeVisible();
    await expect(card.locator('canvas')).toBeVisible();
});

test('first editions can be grouped by publisher', async ({ page }) => {
    await page.goto('/stats?tab=julkaisut');
    const card = page.locator('.p-card', { hasText: 'Ensipainokset vuosittain' });
    await expect(card.locator('canvas')).toBeVisible({ timeout: 20000 });
    await card.getByText('Kustantajat', { exact: true }).click();
    await expect(card.getByText(/Teos lasketaan kerran kullekin kustantajalle/)).toBeVisible();
    await expect(card.locator('canvas')).toBeVisible();
});

test('a publisher heatmap cell lists that publisher\'s works', async ({ page }) => {
    await page.goto('/stats?tab=julkaisut');
    const card = page.locator('.p-card', { hasText: 'Kustantajat vuosikymmenittäin' });
    // The first non-empty cell of the biggest publisher.
    const cell = card.locator('button.heatmap-clickable').first();
    await expect(cell).toBeVisible({ timeout: 20000 });
    const label = await cell.getAttribute('aria-label');
    const count = Number((label ?? '').match(/: ([\d\s ]+) teosta/)?.[1].replace(/\s/g, ''));
    await cell.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('kustantajan ensimmäiset painokset');
    await expect(dialog.locator('.p-dialog-content a[href^="/works/"]').first()).toBeVisible({ timeout: 20000 });
    expect(count).toBeGreaterThan(0);
});
