import { test, expect } from '../fixtures/guard';

// Stored descriptions are HTML from the admin editor; whatever is in them,
// nothing may run in a visitor's browser.
test('HTML in a description is shown without running scripts', async ({ page }) => {
    await page.route('**/api/awards/27', async (route) => {
        const response = await route.fetch();
        const award = await response.json();
        award.description = '<p><strong>Kuvaus</strong></p>'
            + '<img src="x" onerror="window.__xss = 1"><script>window.__xss = 2</script>'
            + '<a href="javascript:window.__xss = 3">linkki</a>';
        await route.fulfill({ response, json: award });
    });
    await page.goto('/awards/27');
    await expect(page.getByText('Kuvaus', { exact: true })).toBeVisible({ timeout: 20000 });
    // Sanitised to an <a> without href: clicking it does nothing.
    await page.getByText('linkki', { exact: true }).click();

    expect(await page.evaluate(() => (window as Window & { __xss?: number }).__xss)).toBeUndefined();
    await expect(page.locator('[onerror], a[href^="javascript:"]')).toHaveCount(0);
});
