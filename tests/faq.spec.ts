import { test, expect } from '@playwright/test';

test('FAQ page loads and has content', async ({ page }) => {
    // Navigate to FAQ page
    await page.goto('/faq');

    // Check that the page heading exists
    await expect(page.getByRole('heading', { name: /UKK/i })).toBeVisible();

    // Verify that the FAQ page has some content
    const faqContent = page.getByRole('main');
    await expect(faqContent).toBeVisible();
    await expect(faqContent).not.toBeEmpty();
});
