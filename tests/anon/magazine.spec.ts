import { test, expect } from '@playwright/test';

test('Alienisti magazine page displays correct content', async ({ page }) => {
    // Navigate to specific magazine page
    await page.goto('/magazines/6');

    // Check that the page headings exist
    await expect(page.getByRole('heading', { name: 'Alienisti' }))
        .toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('heading', { name: 'Jyväskylän Science Fiction Seura 42 ry' }))
        .toBeVisible();

    // Wait for loading to complete
    await expect(page.getByRole('progressbar')).not.toBeVisible({ timeout: 60000 });

    // Check specific text content
    await expect(page.getByText('Fanzine')).toBeVisible();
    await expect(page.getByText('ISSN 1236-0449')).toBeVisible();
    await expect(page.getByText('42 numeroa')).toBeVisible();

    // Check Covers tab content
    await page.getByRole('tab', { name: 'Kannet' }).click();
    const images = page.locator('img');
    await expect(images).toHaveCount(42);

    // Check Issues tab content
    await page.getByRole('tab', { name: 'Lehdet' }).click();
    const issueLinks = page.locator('a[href*="/issues/"]');
    const linkCount = await issueLinks.count();
    expect(linkCount).toBeGreaterThan(41);

    // Verify each issue line format
    for (const row of await page.getByRole('row').all()) {
        const text = await row.textContent();
        // Check that line starts with a year between 1990-2020
        expect(text).toMatch(/^(199\d|20[0-1]\d)/);
        // Verify link exists in the row
        await expect(row.getByRole('link')).toBeVisible();
    }
});
