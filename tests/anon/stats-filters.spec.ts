import { test, expect, Page } from '../fixtures/guard';
import { selectOption } from '../fixtures/dropdown';

// Changing a chart's filter must refetch and re-render with the new
// selection: catches memos/effects that keep showing the old data.
async function changeTopPeopleRole(page: Page, endpoint: string, roleLabel: string) {
    const card = page.locator('.p-card', { hasText: 'Tuotteliaimmat henkilöt' });
    const table = card.locator('table');
    await expect(table.locator('tbody tr').first()).toBeVisible({ timeout: 20000 });
    const firstBefore = await table.locator('tbody tr').first().textContent();

    const refetch = page.waitForRequest(req => req.url().includes(endpoint) && /role=2/.test(req.url()));
    await selectOption(page, card.locator('.p-dropdown').first(), roleLabel, { exact: true });
    await refetch;

    await expect(table.locator('thead')).toContainText(roleLabel, { timeout: 20000 });
    await expect(table.locator('tbody tr').first()).not.toHaveText(firstBefore ?? '', { timeout: 20000 });
}

test('people tab top-people table follows the role filter for books', async ({ page }) => {
    await page.goto('/stats?tab=henkilot');
    await changeTopPeopleRole(page, 'stats/personcounts', 'Kääntäjä');
});

test('people tab top-people table follows the role filter for stories', async ({ page }) => {
    await page.goto('/stats?tab=henkilot');
    await page.getByRole('radio', { name: 'Novellit' }).or(page.getByRole('button', { name: 'Novellit' })).first().click();
    await changeTopPeopleRole(page, 'stats/storypersoncounts', 'Kääntäjä');
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
