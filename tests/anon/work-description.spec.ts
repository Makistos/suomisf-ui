import { test, expect } from '../fixtures/guard';

// Long work descriptions are clipped (CollapsibleHtml) and open by clicking.

test('a long description is clipped and opens and closes by clicking', async ({ page }) => {
    // "Tieteiskirjallisuuden käsikirja", the longest description.
    await page.goto('/works/6790');
    const text = page.locator('.html-content').first();
    const more = page.getByRole('button', { name: 'Näytä koko kuvaus' });
    await expect(more).toBeVisible({ timeout: 20000 });
    await expect(more).toHaveAttribute('aria-expanded', 'false');
    const clipped = (await text.boundingBox())!.height;

    await text.click({ position: { x: 40, y: 20 } });
    await expect(page.getByRole('button', { name: 'Näytä vähemmän' })).toHaveAttribute('aria-expanded', 'true');
    expect((await text.boundingBox())!.height).toBeGreaterThan(clipped * 2);

    await page.getByRole('button', { name: 'Näytä vähemmän' }).click();
    await expect(more).toBeVisible();
    expect((await text.boundingBox())!.height).toBe(clipped);
});

test('a short description is shown in full, without the button', async ({ page }) => {
    await page.goto('/works/53');
    await expect(page.locator('.html-content').first()).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('button', { name: 'Näytä koko kuvaus' })).toHaveCount(0);
});
