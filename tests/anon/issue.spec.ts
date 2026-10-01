import { test, expect } from '../fixtures/guard';

test('issue page loads and Seuraava/Edellinen step between issues', async ({ page }) => {
    // Alienisti, the magazine magazine.spec.ts also uses
    await page.goto('/magazines/6');
    await expect(page.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });
    await page.locator('a[href^="/issues/"]').first().click();

    await expect(page).toHaveURL(/\/issues\/\d+$/);
    const heading = page.locator('h1').first();
    // Wait for the full heading (magazine + issue number), not just the name
    await expect(heading).toContainText(/Alienisti.*\d/, { timeout: 20000 });
    const firstUrl = page.url();
    const firstHeading = await heading.textContent();

    // Same IssuePage component, new id: content must follow
    await page.getByRole('button', { name: 'Seuraava' }).click();
    await expect(page).not.toHaveURL(firstUrl);
    await expect(heading).not.toHaveText(firstHeading ?? '', { timeout: 20000 });
    await expect(heading).toContainText('Alienisti');

    await page.getByRole('button', { name: 'Edellinen' }).click();
    await expect(page).toHaveURL(firstUrl);
    await expect(heading).toHaveText(firstHeading ?? '', { timeout: 20000 });
});
