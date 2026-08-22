import { test, expect } from '../fixtures/auth';

test('suggestion wizard can be skipped through to results', async ({ userPage }) => {
    const errors: string[] = [];
    userPage.on('pageerror', (e) => errors.push(e.message));

    await userPage.goto('/suggestions');
    await expect(userPage.getByRole('heading', { name: 'Kirjaehdotukset' })).toBeVisible();

    // Skip through Genre / Alagenre & tyyli / Kotimaa / Julkaisuaika / Pituus
    for (let i = 0; i < 5; i++) {
        await userPage.getByRole('button', { name: 'Ohita' }).click();
    }
    // Last panel ("Tarkennukset") has its own submit button instead of Ohita/Seuraava
    await userPage.getByRole('button', { name: 'Näytä ehdotukset' }).click();

    await expect(userPage.getByRole('heading', { name: 'Ehdotukset', exact: true })).toBeVisible();
    await expect(userPage.getByText('Aloita rajaamalla')).not.toBeVisible({ timeout: 20000 });
    expect(errors).toEqual([]);
});
