import { Page } from '@playwright/test';
import { test, expect } from '../fixtures/auth';

const API_URL = 'http://localhost:5001/api/';

type WorkLink = { link: string; description: string | null };

const authHeader = async (page: Page) => {
    const token = await page.evaluate(() => JSON.parse(localStorage.getItem('user') ?? '{}').access_token);
    return { Authorization: `Bearer ${token}` };
};

const getWork = async (page: Page, id: number) =>
    (await page.request.get(`${API_URL}works/${id}`)).json();

// Takes the auth header rather than the page, so it still works for the
// cleanup after a failure has closed the page.
const setLinks = async (page: Page, headers: Record<string, string>, workId: number, links: WorkLink[]) => {
    const res = await page.request.put(`${API_URL}works`, {
        headers,
        data: { data: { id: workId, links } },
    });
    expect(res.ok()).toBeTruthy();
};

const card = (page: Page, title: string) => page.locator('.p-card').filter({ hasText: title });

/** Work ids of the works listed in a search result. */
const listedWorkIds = async (page: Page, title: string) => {
    const hrefs = await card(page, title).locator('h4 a').evaluateAll(
        links => links.map(a => a.getAttribute('href') ?? ''));
    return hrefs.map(href => Number(href.replace('/works/', '')));
};

test('the admin page opens from the Ylläpito menu', async ({ adminPage }) => {
    await adminPage.goto('/');
    await adminPage.getByRole('menuitem', { name: 'Ylläpito' }).click();
    await adminPage.getByRole('menuitem', { name: 'Ylläpitotyökalut' }).click();
    await expect(adminPage).toHaveURL(/\/admin$/);
    await expect(adminPage.getByRole('heading', { name: 'Ylläpito', level: 1 })).toBeVisible();
    const titles = ['Satunnainen keskeneräinen teos', 'Kirjasampo-asiasanat tuomatta', 'Samankaltaiset asiasanat',
        'Teosten linkkien lähteet'];
    for (const title of titles) {
        await expect(card(adminPage, title)).toBeVisible();
    }
    // In this order; the link sources card is always last.
    await expect(adminPage.locator('.p-card-title')).toHaveText(titles);
});

test('random incomplete works lack the chosen data', async ({ adminPage }) => {
    await adminPage.goto('/admin');
    const search = card(adminPage, 'Satunnainen keskeneräinen teos');
    await search.getByLabel('Kuvaus').check();
    await search.getByRole('button', { name: 'Hae teoksia' }).click();
    await expect(search.getByText(/Löydetyt teokset/)).toBeVisible({ timeout: 20000 });
    await expect(search.getByText(/\(10 näytetty, [\d\s ]+ yhteensä\)/)).toBeVisible();

    const ids = await listedWorkIds(adminPage, 'Satunnainen keskeneräinen teos');
    expect(ids).toHaveLength(10);
    for (const id of ids.slice(0, 3)) {
        expect((await getWork(adminPage, id)).description ?? '').toBe('');
    }
});

test('Kirjasampo search lists linked works whose tags were never imported', async ({ adminPage }) => {
    await adminPage.goto('/admin');
    const search = card(adminPage, 'Kirjasampo-asiasanat tuomatta');
    await search.getByLabel('Lukumäärä').fill('5');
    await search.getByRole('button', { name: 'Hae teoksia' }).click();
    await expect(search.getByText(/\(5 näytetty, [\d\s ]+ yhteensä\)/)).toBeVisible({ timeout: 20000 });

    for (const id of await listedWorkIds(adminPage, 'Kirjasampo-asiasanat tuomatta')) {
        const work = await getWork(adminPage, id);
        expect(work.links.some((l: WorkLink) => l.link.includes('kirjasampo.fi'))).toBe(true);
        expect(work.kirjasampo_imported).toBeNull();
    }
});

test('a mistyped link source is combined into the right one and then deleted', async ({ adminPage, browserName }) => {
    test.setTimeout(90000);
    // Works 21 and 22 aren't used by other specs; a work per browser, since
    // setting links replaces all of them. The work's own links are put back
    // afterwards.
    const WORK_ID = browserName === 'firefox' ? 22 : 21;
    const WORK_TITLE = browserName === 'firefox' ? 'Mykkä jumala' : 'Luutarha';
    const headers = await authHeader(adminPage);
    const source = `E2E_TEST_lähde_${browserName}_${Date.now()}`;
    const typo = `${source}_typo`;
    const original: WorkLink[] = (await getWork(adminPage, WORK_ID)).links
        .map((l: WorkLink) => ({ link: l.link, description: l.description }));
    const testLinks = [
        { link: `https://example.invalid/${source}/1`, description: source },
        { link: `https://example.invalid/${source}/2`, description: typo },
    ];
    await setLinks(adminPage, headers, WORK_ID, [...original, ...testLinks]);

    try {
        await adminPage.goto('/admin');
        const sources = card(adminPage, 'Teosten linkkien lähteet');
        await sources.getByPlaceholder('Hae lähdettä...').fill(source);
        const row = (name: string) => sources.locator('tbody tr').filter({
            has: adminPage.getByRole('cell', { name, exact: true }),
        });
        await expect(row(source)).toContainText('1', { timeout: 20000 });
        await expect(row(typo)).toBeVisible();

        // Expanding a row shows its links with their work.
        await row(typo).locator('.p-row-toggler').click();
        await expect(sources.getByRole('link', { name: testLinks[1].link })).toBeVisible({ timeout: 20000 });
        await expect(sources.getByRole('link', { name: WORK_TITLE })).toBeVisible();

        await row(source).locator('input[type=checkbox]').check();
        await row(typo).locator('input[type=checkbox]').check();
        await sources.getByRole('button', { name: 'Yhdistä valitut (2)' }).click();
        const dialog = adminPage.getByRole('dialog').filter({ hasText: 'Yhdistä lähteet' });
        // Both have one link, so either may be suggested: choose the right one.
        await dialog.locator('#merge-target').fill(source);
        await dialog.getByRole('button', { name: 'Yhdistä' }).click();
        await expect(adminPage.getByText('Lähteet yhdistetty')).toBeVisible({ timeout: 20000 });
        await expect(row(typo)).toHaveCount(0);
        await expect(row(source).locator('td').nth(3)).toHaveText('2');

        let links: WorkLink[] = (await getWork(adminPage, WORK_ID)).links;
        expect(links.filter(l => l.link.includes(source)).map(l => l.description)).toEqual([source, source]);

        // The change is on the work's history.
        const history = await (await adminPage.request.get(`${API_URL}changes?table=Teos&id=${WORK_ID}`)).json();
        expect(JSON.stringify(history)).toContain(typo);

        await row(source).getByRole('button', { name: `Poista lähde ${source}` }).click();
        const confirm = adminPage.getByRole('dialog').filter({ hasText: 'Vahvista poisto' });
        await expect(confirm).toContainText(`Poistetaanko lähde "${source}" ja sen 2 linkkiä 1 teoksesta?`);
        await confirm.getByRole('button', { name: 'Poista' }).click();
        await expect(adminPage.getByText('Lähde poistettu')).toBeVisible({ timeout: 20000 });
        await expect(sources.getByText('Ei lähteitä.')).toBeVisible();

        links = (await getWork(adminPage, WORK_ID)).links;
        expect(links.filter(l => l.link.includes(source))).toEqual([]);
        // The work's other links are untouched.
        expect(links.map(l => l.link).sort()).toEqual(original.map(l => l.link).sort());
    } finally {
        await setLinks(adminPage, headers, WORK_ID, original);
    }
});

test('a suggested duplicate tag pair is dismissed and restored', async ({ adminPage, browserName }) => {
    test.setTimeout(90000);
    await adminPage.goto('/admin');
    const similar = card(adminPage, 'Samankaltaiset asiasanat');
    await expect(similar.getByText(/Päivitetty/)).toBeVisible({ timeout: 20000 });
    // Each view button shows its count.
    for (const view of ['Kaksoiskappaleet', 'Liittyvät', 'Hylätyt']) {
        await expect(similar.locator('.p-selectbutton .p-button', { hasText: view }))
            .toHaveText(new RegExp(`^${view} \\(\\d+\\)$`));
    }

    // Whichever pair the copied job results list first (second in Firefox,
    // so parallel runs don't race on one pair).
    const first = similar.locator('tbody tr').nth(browserName === 'firefox' ? 1 : 0);
    const [nameA, nameB] = await first.locator('td .p-tag').allTextContents();
    expect(nameA && nameB).toBeTruthy();
    const pairRow = similar.locator('tbody tr')
        .filter({ hasText: nameA }).filter({ hasText: nameB });

    await similar.getByPlaceholder('Hae asiasanaa...').fill(nameA);
    await pairRow.getByRole('button', { name: 'Eri asiasanat' }).click();
    await expect(adminPage.getByText('Merkitty eri asiasanoiksi')).toBeVisible({ timeout: 20000 });
    await expect(pairRow).toHaveCount(0);

    await similar.locator('.p-selectbutton .p-button', { hasText: 'Hylätyt' }).click();
    await expect(pairRow).toContainText('Test Admin', { timeout: 20000 });
    await pairRow.getByRole('button', { name: 'Palauta' }).click();
    await expect(adminPage.getByText('Palautettu')).toBeVisible({ timeout: 20000 });
    await expect(pairRow).toHaveCount(0);

    await similar.locator('.p-selectbutton .p-button', { hasText: 'Kaksoiskappaleet' }).click();
    await expect(pairRow).toBeVisible({ timeout: 20000 });
});

test('suggested tag pairs sort by tag name in Finnish order', async ({ adminPage }) => {
    await adminPage.goto('/admin');
    const similar = card(adminPage, 'Samankaltaiset asiasanat');
    await expect(similar.getByText(/Päivitetty/)).toBeVisible({ timeout: 20000 });
    const firstTags = () => similar.locator('tbody tr td:first-child .p-tag').first().textContent();
    await similar.getByRole('columnheader', { name: /Asiasanat/ }).click();
    const ascending = await firstTags();
    await similar.getByRole('columnheader', { name: /Asiasanat/ }).click();
    await expect(async () => {
        const descending = await firstTags();
        expect(descending).not.toBe(ascending);
        // The last name in Finnish order comes first.
        expect(new Intl.Collator('fi').compare(descending!, ascending!)).toBeGreaterThan(0);
    }).toPass({ timeout: 20000 });
});

test('a suggested duplicate is marked related and back', async ({ adminPage, browserName }) => {
    test.setTimeout(90000);
    await adminPage.goto('/admin');
    const similar = card(adminPage, 'Samankaltaiset asiasanat');
    await expect(similar.getByText(/Päivitetty/)).toBeVisible({ timeout: 20000 });
    const view = (name: string) => similar.locator('.p-selectbutton .p-button', { hasText: name });

    // Rows the dismiss test doesn't use, one per browser.
    const row = similar.locator('tbody tr').nth(browserName === 'firefox' ? 3 : 2);
    const [nameA, nameB] = await row.locator('td .p-tag').allTextContents();
    const pairRow = similar.locator('tbody tr').filter({ hasText: nameA }).filter({ hasText: nameB });
    await similar.getByPlaceholder('Hae asiasanaa...').fill(nameA);

    await pairRow.getByRole('button', { name: 'Merkitse liittyväksi' }).click();
    await expect(adminPage.getByText('Merkitty liittyväksi')).toBeVisible({ timeout: 20000 });
    await expect(pairRow).toHaveCount(0);

    await view('Liittyvät').click();
    await pairRow.getByRole('button', { name: 'Merkitse kaksoiskappaleeksi' }).click({ timeout: 20000 });
    await expect(adminPage.getByText('Merkitty kaksoiskappaleeksi')).toBeVisible({ timeout: 20000 });

    await view('Kaksoiskappaleet').click();
    await expect(pairRow).toBeVisible({ timeout: 20000 });
});

test('a suggested pair is marked checked and hidden', async ({ adminPage, browserName }) => {
    test.setTimeout(90000);
    await adminPage.goto('/admin');
    const similar = card(adminPage, 'Samankaltaiset asiasanat');
    await expect(similar.getByText(/Päivitetty/)).toBeVisible({ timeout: 20000 });

    // Rows the other tests don't use, one per browser.
    const row = similar.locator('tbody tr').nth(browserName === 'firefox' ? 5 : 4);
    const [nameA, nameB] = await row.locator('td .p-tag').allTextContents();
    const pairRow = similar.locator('tbody tr').filter({ hasText: nameA }).filter({ hasText: nameB });
    const check = pairRow.getByRole('button', { name: 'Tarkistettu' });
    await expect(check).toHaveAttribute('aria-pressed', 'false');
    await check.click();
    await expect(check).toHaveAttribute('aria-pressed', 'true', { timeout: 20000 });

    const hide = similar.getByLabel(/Piilota tarkistetut/);
    await hide.check();
    await expect(pairRow).toHaveCount(0);
    await hide.uncheck();
    await check.click();
    await expect(check).toHaveAttribute('aria-pressed', 'false', { timeout: 20000 });
});
