import { test, expect, Page } from '../fixtures/guard';
import { selectOption } from '../fixtures/dropdown';

// Changing a chart's filter must refetch and re-render with the new
// selection: catches memos/effects that keep showing the old data.
async function changeTopPeopleRole(page: Page, tab: string, endpoint: string, roleLabel: string) {
    await page.getByRole('tab', { name: tab }).click();
    const card = page.locator('.p-card', { hasText: 'Tuotteliaimmat henkilöt' });
    const table = card.locator('table');
    await expect(table.locator('tbody tr').first()).toBeVisible({ timeout: 20000 });
    const firstBefore = await table.locator('tbody tr').first().textContent();

    const refetch = page.waitForRequest(req => req.url().includes(endpoint) && /role=/.test(req.url()));
    await selectOption(page, card.locator('.p-dropdown').first(), roleLabel, { exact: true });
    await refetch;

    await expect(table.locator('thead')).toContainText(roleLabel, { timeout: 20000 });
    await expect(table.locator('tbody tr').first()).not.toHaveText(firstBefore ?? '', { timeout: 20000 });
}

test('works tab top-people table follows the role filter', async ({ page }) => {
    await page.goto('/stats');
    await expect(page.getByRole('heading', { name: 'Tilastoja' })).toBeVisible();
    await changeTopPeopleRole(page, 'Teokset', 'stats/personcounts', 'Kääntäjä');
});

test('short stories tab top-people table follows the role filter', async ({ page }) => {
    await page.goto('/stats');
    await expect(page.getByRole('heading', { name: 'Tilastoja' })).toBeVisible();
    await changeTopPeopleRole(page, 'Novellit', 'stats/storypersoncounts', 'Kääntäjä');
});
