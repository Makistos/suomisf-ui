import { Page } from '@playwright/test';
import { test, expect } from '../fixtures/guard';

// The "Bibliografiasta löytyy" covers on the front page (ImageAccordion):
// hovering or keyboard-focusing a cover opens a panel with the work's
// description; on touch screens the first tap opens it.

const section = (page: Page) => page.locator('section', { has: page.locator('#random-heading') });
const covers = (page: Page) => section(page).locator('.image-accordion-item');
const panel = (page: Page) => section(page).locator('.image-accordion-overlay');

async function openFrontPage(page: Page) {
    await page.goto('/');
    await expect(covers(page).first()).toBeVisible({ timeout: 20000 });
    await covers(page).first().scrollIntoViewIfNeeded();
}

test.describe('on a touch screen', () => {
    test.use({ hasTouch: true, viewport: { width: 400, height: 800 } });

    test('the first tap opens the panel, a tap on its cover opens the edition', async ({ page }) => {
        await openFrontPage(page);
        await covers(page).nth(1).tap();
        await expect(panel(page)).toBeVisible();
        await expect(page).toHaveURL(/\/$/);

        await panel(page).locator('.image-accordion-cover-link').tap();
        await expect(page).toHaveURL(/\/editions\/\d+$/);
    });

    test('a tap outside the panel closes it', async ({ page }) => {
        await openFrontPage(page);
        await covers(page).first().tap();
        await expect(panel(page)).toBeVisible();
        await page.locator('#random-heading').tap();
        await expect(panel(page)).toHaveCount(0);
        await expect(page).toHaveURL(/\/$/);
    });
});

test('hovering a cover opens its panel, leaving closes it', async ({ page }) => {
    await openFrontPage(page);
    await covers(page).nth(1).hover();
    await expect(panel(page)).toBeVisible();
    await panel(page).locator('.image-accordion-details').hover();
    await expect(panel(page)).toBeVisible();
    await page.locator('#random-heading').hover();
    await expect(panel(page)).toHaveCount(0);
});

test('Tab moves from cover to cover with each panel open, Enter opens the edition', async ({ page }) => {
    await openFrontPage(page);
    const count = await covers(page).count();
    const coverLink = (i: number) => covers(page).nth(i).locator('.image-accordion-cover-link');

    await coverLink(0).focus();
    // Programmatic focus isn't :focus-visible; a Tab from the previous element is.
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    for (let i = 0; i < count; i++) {
        await expect(coverLink(i)).toBeFocused();
        await expect(panel(page)).toBeVisible();
        if (i < count - 1) await page.keyboard.press('Tab');
    }
    const href = await coverLink(count - 1).getAttribute('href');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`${href}$`));
});
