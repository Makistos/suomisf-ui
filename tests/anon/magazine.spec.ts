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
    const numeroaText = await page.getByText(/\d+ numeroa/).textContent();
    const issueCount = parseInt(numeroaText?.match(/\d+/)?.[0] || '0');
    expect(issueCount).toBeGreaterThan(40);

    // Check Covers tab content - one image per issue that has a cover
    await page.getByRole('tab', { name: 'Kannet' }).click();
    const imageCount = await page.locator('img').count();
    expect(imageCount).toBeGreaterThan(0);
    expect(imageCount).toBeLessThanOrEqual(issueCount);

    // Check Issues tab content
    await page.getByRole('tab', { name: 'Lehdet' }).click();
    const issueLinks = page.locator('a[href*="/issues/"]');
    await expect(issueLinks).toHaveCount(issueCount);

    // Every issue link is "<number>/<year>: <title...>" with a sane year
    const currentYear = new Date().getFullYear();
    for (const link of await issueLinks.all()) {
        const text = await link.textContent();
        const match = text?.match(/^(\d+)\/(\d{4})/);
        expect(match).toBeTruthy();
        const year = parseInt(match![2]);
        expect(year).toBeGreaterThanOrEqual(1985);
        expect(year).toBeLessThanOrEqual(currentYear);
        await expect(link).toBeVisible();
    }
});
