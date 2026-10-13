import { test, expect } from '../fixtures/guard';

test('Stats page renders every tab without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/stats');
    await expect(page.getByRole('heading', { name: 'Tilastoja' })).toBeVisible();
    // Overview: headline tiles, no chart.
    await expect(page.getByText('Teoksia', { exact: true })).toBeVisible({ timeout: 20000 });

    for (const tabName of ['Julkaisut ajallisesti', 'Sisältö', 'Henkilöt', 'Kustantajat', 'Novellit', 'Lehdet', 'Kirjat esineinä', 'Palkinnot']) {
        await page.getByRole('tab', { name: tabName }).click();
        await expect(page.locator('.p-tabview-panel canvas').first()).toBeVisible({ timeout: 20000 });
    }

    expect(errors).toEqual([]);
});

test('the open tab is kept in the URL', async ({ page }) => {
    await page.goto('/stats?tab=lehdet');
    await expect(page.getByRole('tab', { name: 'Lehdet', selected: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Lehdet vuosittain' })).toBeVisible({ timeout: 20000 });

    await page.getByRole('tab', { name: 'Kustantajat' }).click();
    await expect(page).toHaveURL(/tab=kustantajat/);
});

test('admin-only tabs are hidden from visitors', async ({ page }) => {
    await page.goto('/stats');
    await expect(page.getByRole('tab', { name: 'Yleiskatsaus' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Kävijät' })).toHaveCount(0);
    await expect(page.getByRole('tab', { name: 'Käynnit' })).toHaveCount(0);
});

test('edition and work statistics show up in their tabs', async ({ page }) => {
    await page.goto('/stats?tab=julkaisut');
    for (const heading of ['Painokset vuosittain', 'Suomennosviive', 'Suomennosviive vuosikymmenittäin', 'Kotimaisten osuus']) {
        await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible({ timeout: 20000 });
    }

    await page.goto('/stats?tab=sisalto');
    for (const heading of ['Painoksia teosta kohden', 'Eniten painetut', 'Uudelleensuomennokset', 'Uudelleen suomennetut teokset']) {
        await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible({ timeout: 20000 });
    }

    await page.goto('/stats?tab=kirjat');
    for (const heading of ['Sivumäärät', 'Korkeus', 'Sivumäärä vuosittain', 'Sidosasu', 'Paksuimmat']) {
        await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible({ timeout: 20000 });
    }
    // Decades switch the page-count card to decades.
    await page.getByRole('group', { name: 'Suodattimet' }).getByText('Vuosikymmenittäin').click();
    await expect(page.getByRole('heading', { name: 'Sivumäärä vuosikymmenittäin' })).toBeVisible();
});

test('people and content statistics show up in their tabs', async ({ page }) => {
    await page.goto('/stats?tab=henkilot');
    for (const heading of ['Kansallisuudet', 'Tuotteliaimmat henkilöt (10)', 'Kansallisuudet vuosikymmenittäin', 'Syntymävuosikymmenet', 'Kääntäjät lähdekielittäin']) {
        await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible({ timeout: 20000 });
    }

    await page.goto('/stats?tab=sisalto');
    for (const heading of ['Teostyypit', 'Genret vuosikymmenittäin', 'Yleisimmät asiasanat', 'Pisimmät kirjasarjat', 'Asiasanat vuosikymmenittäin', 'Sarjaan kuuluvien osuus']) {
        await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible({ timeout: 20000 });
    }
});

test('publisher, story, magazine and award statistics show up in their tabs', async ({ page }) => {
    const tabs: [string, string[]][] = [
        ['kustantajat', ['Aktiiviset kustantajat', 'Keskittyminen', 'Kustantajien toiminta-ajat', 'Kustantajasarjat']],
        ['novellit', ['Julkaisukanavat', 'Tekstityypit']],
        ['lehdet', ['Lehtien sisältö vuosittain', 'Lehtien ilmestymisajat', 'Tekstit lehdittäin']],
        ['palkinnot', ['Palkitut palkinnoittain', 'Palkituimmat kirjailijat', 'Palkinnosta suomennokseen', 'Viive palkinnoittain']],
    ];
    for (const [tab, headings] of tabs) {
        await page.goto(`/stats?tab=${tab}`);
        for (const heading of headings) {
            await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible({ timeout: 20000 });
        }
    }
});
