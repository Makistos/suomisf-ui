import { test, expect } from '../fixtures/auth';
import { Page } from '@playwright/test';

// The admin SpeedDial on every new identity page looks and sits as on the current page:
// fixed in the bottom right corner, white icons on its buttons, the same size.
const PAGES = [
    { name: 'person', key: 'suomisf.personPageVersion', url: '/people/2435' },
    { name: 'work', key: 'suomisf.workPageVersion', url: '/works/3984' },
    { name: 'short story', key: 'suomisf.shortPageVersion', url: '/shorts/1028' },
    { name: 'publisher', key: 'suomisf.publisherPageVersion', url: '/publishers/387' },
    { name: 'tag', key: 'suomisf.tagPageVersion', url: '/tags/303' },
];
// Every new page with an admin SpeedDial goes here (2026-11-27: the publisher page's icons came out link-blue again).
// src/components/identity-css.test.ts checks the stylesheets of all identity pages for the same mistake.

async function dialStyle(page: Page, key: string, url: string, version: 'vanha' | 'uusi') {
    await page.goto('/faq');
    await page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, version]);
    await page.goto(url);
    const dial = page.locator('.fixed-dial');
    await expect(dial.locator('button.p-speeddial-button')).toBeVisible({ timeout: 20000 });
    await page.waitForLoadState('networkidle');
    await dial.locator('button.p-speeddial-button').click();
    const action = dial.locator('.p-speeddial-action').first();
    await expect(action).toBeVisible();
    return page.evaluate(() => {
        const d = document.querySelector('.fixed-dial')!;
        const button = d.querySelector('button.p-speeddial-button')!.getBoundingClientRect();
        const a = d.querySelector('.p-speeddial-action')!;
        return {
            position: getComputedStyle(d).position,
            right: Math.round(window.innerWidth - d.getBoundingClientRect().right),
            bottom: Math.round(window.innerHeight - button.bottom),
            button: [Math.round(button.width), Math.round(button.height)],
            action: [getComputedStyle(a).backgroundColor, getComputedStyle(a).color, getComputedStyle(a.querySelector('.p-speeddial-action-icon')!).color],
        };
    });
}

for (const p of PAGES) {
    test(`the new ${p.name} page's admin button matches the current page's`, async ({ adminPage: page }) => {
        await page.setViewportSize({ width: 1400, height: 900 });
        const current = await dialStyle(page, p.key, p.url, 'vanha');
        const next = await dialStyle(page, p.key, p.url, 'uusi');
        expect(next).toEqual(current);
    });
}
