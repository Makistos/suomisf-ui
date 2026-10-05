import { test, expect } from '../fixtures/guard';
import { Page } from '@playwright/test';

// Links in the tab panel that is showing (inactive panels stay in the DOM).
const visibleLinks = (page: Page, href: string) =>
    page.locator(`.p-tabview-panels a[href^="${href}"]:visible`);

// Johanna Sinisalo: author and editor, with short stories, series,
// magazine contributions and awards, so most tabs of the person page show.
test('person page tabs list edited books, stories, series, magazines and awards', async ({ page }) => {
    await page.goto('/people/368');
    await expect(page.getByRole('heading', { name: /Johanna Sinisalo/ }).first()).toBeVisible({ timeout: 20000 });

    // Books she edited (the edition list also serves translations, covers
    // and illustrations).
    const edited = page.getByRole('tab', { name: /^Toimittanut \(\d+\)/ });
    await edited.click();
    await expect(edited).toHaveAttribute('aria-selected', 'true');
    await expect(visibleLinks(page, '/editions/').first()).toBeVisible();

    await page.getByRole('tab', { name: 'Novellit ja artikkelit' }).click();
    await expect(visibleLinks(page, '/shorts/').first()).toBeVisible({ timeout: 20000 });

    await page.getByRole('tab', { name: 'Sarjat' }).click();
    await expect(visibleLinks(page, '/bookseries/').first()).toBeVisible({ timeout: 20000 });

    await page.getByRole('tab', { name: 'Lehdet' }).click();
    await expect(visibleLinks(page, '/issues/').first()).toBeVisible({ timeout: 20000 });

    await page.getByRole('tab', { name: 'Palkinnot' }).click();
    await expect(visibleLinks(page, '/awards/').first()).toBeVisible({ timeout: 20000 });
});
