import { test, expect } from '../fixtures/auth';
import { Page } from '@playwright/test';
import { expectAccessible } from '../fixtures/axe';

// The new tag page (docs/ui-redesign/pages/tags.md, identity style) under trial. Its works are the book index's rows and paging
// (GET /api/bookindex?tag=…); everyone else gets the current page (tests/anon|user/tags-version.spec.ts).
const KYBERPUNK = 303;
const STEAMPUNK = 305;
const newPage = (page: Page) => page.locator('[data-tag-page="uusi"]');
const rows = (page: Page) => page.locator('.bn-row');
const tab = (page: Page, name: string) => page.getByRole('tab', { name: new RegExp(`^${name}`) });

async function openNew(page: Page, id = KYBERPUNK, query = '') {
    await page.goto('/faq');
    await page.evaluate(() => localStorage.setItem('suomisf.tagPageVersion', 'uusi'));
    await page.goto(`/tags/${id}${query}`);
    await expect(newPage(page).locator('h1')).toBeVisible({ timeout: 20000 });
}
const tagData = (page: Page, id = KYBERPUNK) =>
    page.waitForResponse(r => new URL(r.url()).pathname.endsWith(`/api/tags/${id}`)).then(r => r.json());

test('the switch button and Shift+U swap the tag page, apart from the list\'s choice', async ({ adminPage: page }) => {
    await page.goto(`/tags/${KYBERPUNK}`);
    const toggle = page.getByTestId('page-version');
    await expect(toggle).toHaveText('Uusi asiasanan sivu', { timeout: 20000 });
    await toggle.click();
    await expect(newPage(page)).toBeVisible({ timeout: 20000 });
    await expect(toggle).toHaveText('Nykyinen asiasanan sivu');
    await page.waitForLoadState('networkidle');
    await page.goto('/tags');
    await expect(page.locator('h1.maintitle', { hasText: 'Asiasanat' })).toBeVisible({ timeout: 20000 });
    await page.waitForLoadState('networkidle');
    await page.goto(`/tags/${KYBERPUNK}`);
    await expect(newPage(page)).toBeVisible({ timeout: 20000 });
    await page.keyboard.press('Shift+KeyU');
    await expect(page.locator('main.sftag-page h1')).toBeVisible({ timeout: 20000 });
});

test('kyberpunk: name, type, counts as on the current page, tabs with counts, its group in the crumbs', async ({ adminPage: page }) => {
    const response = tagData(page);
    await openNew(page);
    const tag = await response;
    const articles = tag.stories.filter((s: { type: { id: number } }) => [7, 8, 9].includes(s.type.id)).length;
    const stories = tag.stories.length - articles;
    await expect(newPage(page).locator('h1')).toHaveText('kyberpunk');
    await expect(page.locator('.tg-type')).toHaveText('Alalaji');
    await expect(page.locator('.tg-facts')).toHaveText(`${tag.works.length} teosta, ${stories} novellia, ${articles} artikkelia`);
    await expect(tab(page, 'Teokset').locator('small')).toHaveText(String(tag.works.length));
    await expect(tab(page, 'Novellit').locator('small')).toHaveText(String(stories));
    await expect(tab(page, 'Artikkelit').locator('small')).toHaveText(String(articles));
    await expect(page.getByRole('navigation', { name: 'Murupolku' }).getByRole('link', { name: 'Alalajit' })).toHaveAttribute('href', '/tags');
    await expect(page.locator('#bn-count b')).toHaveText(`${tag.works.length} teosta`, { timeout: 20000 });
    await expect(rows(page)).toHaveCount(tag.works.length);
});

test('a long description is clamped and opens with "Näytä koko kuvaus"', async ({ adminPage: page }) => {
    await openNew(page, STEAMPUNK);
    const desc = page.locator('#tg-desc');
    const more = page.getByRole('button', { name: 'Näytä koko kuvaus' });
    await expect(more).toHaveAttribute('aria-expanded', 'false');
    const closed = await desc.evaluate(el => el.clientHeight);
    await more.click();
    await expect(page.getByRole('button', { name: 'Näytä vähemmän' })).toHaveAttribute('aria-expanded', 'true');
    expect(await desc.evaluate(el => el.clientHeight)).toBeGreaterThan(closed);
});

test('similar tags in the sidebar; the switch adds their works and marks which tag each came from', async ({ adminPage: page }) => {
    const similar = page.waitForResponse(r => r.url().includes(`/api/tags/${KYBERPUNK}/similar`)).then(r => r.json());
    await openNew(page);
    const tags = await similar;
    test.skip(tags.length === 0, 'no similar tags in the test data');
    const side = page.getByRole('complementary');
    for (const t of tags) await expect(side.getByRole('link', { name: t.name, exact: true })).toHaveAttribute('href', `/tags/${t.id}`);
    await expect(page.locator('#bn-count b')).toBeVisible({ timeout: 20000 });
    const own = Number((await page.locator('#bn-count b').innerText()).replace(/\D/g, ''));
    const response = page.waitForResponse(r => r.url().includes('/api/bookindex?') && r.url().includes('tag_similar=1'));
    // the checkbox follows the URL, so it changes after the click (check() looks too soon)
    await page.getByLabel(/Myös samankaltaisten asiasanojen teokset/).click();
    const data = await (await response).json();
    await expect(page).toHaveURL(/samankaltaiset=1/);
    await expect(page.locator('#bn-count')).toContainText(`${data.total} teosta samankaltaiset asiasanat mukana`);
    expect(data.total).toBeGreaterThanOrEqual(own);
    const added = data.works.filter((w: { matched_tags: { id: number }[] }) => w.matched_tags[0].id !== KYBERPUNK);
    if (added.length > 0) {
        const via = page.locator('.tg-via').first();
        await expect(via).toContainText('Samankaltainen asiasana:');
        await expect(via.getByRole('link').first()).toHaveAttribute('href', new RegExp(`/tags/(${tags.map((t: { id: number }) => t.id).join('|')})$`));
    }
    await page.reload();
    await expect(page.getByLabel(/Myös samankaltaisten asiasanojen teokset/)).toBeChecked({ timeout: 20000 });
});

test('works: sorting, grouping, statistics for the tag', async ({ adminPage: page }) => {
    await openNew(page);
    await expect(rows(page).first()).toBeVisible({ timeout: 20000 });
    await page.getByLabel('Järjestys').selectOption({ label: 'Uusin ensin' });
    await expect(page).toHaveURL(/jarjestys=uusin/);
    await page.getByLabel('Ryhmittele tekijöittäin').click();
    await expect(page.getByLabel('Ryhmittele tekijöittäin')).not.toBeChecked();
    await expect(page.locator('.bn-group')).toHaveCount(0);
    const response = page.waitForResponse(r => r.url().includes('/api/bookindex/stats?') && r.url().includes(`tag=${KYBERPUNK}`));
    await page.getByRole('button', { name: 'Tilastot tästä hausta' }).click();
    const stats = await (await response).json();
    await expect(page.locator('.bn-gbar')).toHaveCount(stats.genres.length);
    await expect(page).toHaveURL(/tilastot=1/);
});

test('stories and articles: every writer, story, translator and place of publication is a link', async ({ adminPage: page }) => {
    const response = tagData(page);
    await openNew(page, KYBERPUNK, '?valilehti=novellit');
    const tag = await response;
    const fiction = tag.stories.filter((s: { type: { id: number } }) => ![7, 8, 9].includes(s.type.id));
    const list = page.locator('.tg-story');
    await expect(list).toHaveCount(fiction.length);
    const first = list.first();
    await expect(first.locator('a.tg-st')).toHaveAttribute('href', /\/shorts\/\d+$/);
    await expect(first.locator('.tg-sa a').first()).toHaveAttribute('href', /\/people\/\d+$/);
    await expect(first.locator('.tg-sp a[href^="/works/"], .tg-sp a[href^="/issues/"]').first()).toBeVisible();
    await tab(page, 'Artikkelit').click();
    await expect(page).toHaveURL(/valilehti=artikkelit/);
    await expect(page.locator('.tg-story .tg-stype').first()).toBeVisible();
    await tab(page, 'Teokset').click();
    await expect(page).not.toHaveURL(/valilehti/);
});

test('admin tools: the dial opens the edit form with the similar-tag editor, and the merge dialog', async ({ adminPage: page }) => {
    await openNew(page);
    const dial = page.locator('.fixed-dial');
    await dial.locator('button.p-speeddial-button').click();
    await dial.getByRole('menuitem', { name: 'Muokkaa' }).click();
    const edit = page.getByRole('dialog', { name: 'Muokkaa' });
    await expect(edit).toBeVisible();
    await expect(edit.getByText('Samankaltaiset asiasanat').first()).toBeVisible({ timeout: 20000 });
    await edit.getByRole('button', { name: /close|sulje/i }).first().click();
    await dial.locator('button.p-speeddial-button').click();
    await dial.getByRole('menuitem', { name: 'Yhdistä' }).click();
    await expect(page.getByRole('dialog', { name: 'Yhdistä asiasana' }).getByLabel('Yhdistettävä asiasana')).toBeVisible();
});

test('an unknown tag says so', async ({ adminPage: page }) => {
    await page.goto('/faq');
    await page.evaluate(() => localStorage.setItem('suomisf.tagPageVersion', 'uusi'));
    await page.goto('/tags/99999999');
    await expect(page.getByText('Asiasanaa ei löytynyt')).toBeVisible({ timeout: 20000 });
});

test('on a phone the page fits, and it has the site\'s background and no accessibility violations', async ({ adminPage: page }) => {
    await openNew(page);
    await expect(rows(page).first()).toBeVisible({ timeout: 20000 });
    const [site, own] = await page.evaluate(() => [
        getComputedStyle(document.body).backgroundColor,
        getComputedStyle(document.querySelector('[data-tag-page="uusi"]')!).backgroundColor,
    ]);
    expect(own).toBe(site);
    await page.waitForLoadState('networkidle');
    await expectAccessible(page, { include: '[data-tag-page="uusi"]' });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});
