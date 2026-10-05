import { test, expect } from '../fixtures/auth';
import { Page } from '@playwright/test';
import { selectOption } from '../fixtures/dropdown';

const API_URL = 'http://localhost:5001/api/';
// "Vihreä matka": one edition, so the page has a single price button.
const WORK_ID = 10;

const dialAction = (page: Page, label: string) =>
    page.locator(`a.p-speeddial-action[aria-label="${label}"]`);

type Edition = { id: number; pubyear: number; editionnum: number | null; version: number | null };

async function getEdition(): Promise<Edition> {
    const work = await (await fetch(`${API_URL}works/${WORK_ID}`)).json();
    return work.editions[0];
}

async function openWork(page: Page) {
    await page.goto(`/works/${WORK_ID}`);
    await expect(page.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });
}

// The shop search and the price fetch would reach the shops' sites, so
// those two calls are answered here; linking the product and saving the
// fetched price go to the backend as usual.
test('admin links a shop product, fetches its price and saves it', async ({ adminPage }) => {
    const edition = await getEdition();
    const stamp = Date.now();
    const productId = `e2e-product-${stamp}`;
    const productUrl = `https://example.invalid/tuotteet/${productId}`;
    const seller = `E2E_TEST_seller_${stamp}`;

    await adminPage.route('**/api/antikvaari/search?**', route => route.fulfill({
        json: [{
            product_id: productId, title: 'Vihreä matka', author: 'E2E', year: String(edition.pubyear),
            binding: 'Sidottu', url: productUrl, available_count: 1, price: 12.5,
        }],
    }));
    await adminPage.route(`**/api/work/${WORK_ID}/antikvaari/fetch`, route => route.fulfill({
        json: [{
            edition_id: edition.id, edition_pubyear: edition.pubyear,
            edition_version: edition.version, edition_match_level: 'same',
            antikvaari_book_id: `e2e-book-${stamp}`, antikvaari_product_id: productId,
            antikvaari_product_page_url: productUrl, antikvaari_product_url: productUrl,
            antikvaari_product_year: edition.pubyear, antikvaari_product_binding: null,
            antikvaari_product_version: edition.editionnum ?? 1,
            antikvaari_product_laitos: edition.version ?? 1,
            book_title: 'Vihreä matka', book_author: 'E2E', book_language: 'suomi',
            seller, seller_url: null, date_listed: null, last_updated: null,
            condition: 'K3', is_library_discard: false, has_markings: false,
            missing_dust_cover: false, price: 12.5, match_quality: 'Perfect', user_excluded: false,
        }],
    }));

    await openWork(adminPage);
    await adminPage.locator('.fixed-dial .p-speeddial-button').click();
    await dialAction(adminPage, 'Hinnat').click();
    const dialog = adminPage.getByRole('dialog').filter({ hasText: 'Linkitetyt tuotteet' });

    // The dialog searches with the work's author and title as it opens.
    await dialog.getByRole('button', { name: 'Lisää', exact: true }).click();
    await expect(adminPage.getByText('Tuote linkitetty')).toBeVisible({ timeout: 20000 });
    await expect(dialog.getByRole('button', { name: 'Lisätty' })).toBeVisible();

    await dialog.getByRole('button', { name: 'Hae hinnat' }).click();
    await expect(dialog.getByText('Haetut hinnat (1 kpl)')).toBeVisible({ timeout: 20000 });
    await dialog.getByRole('button', { name: /^Tallenna/ }).click();
    await expect(adminPage.getByText('Tallennettu 1 riviä')).toBeVisible({ timeout: 20000 });
    await adminPage.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();

    // The saved price is listed under the edition.
    await adminPage.locator('button:has(.pi-euro)').click();
    const prices = adminPage.getByRole('dialog').filter({ hasText: 'Lisää hinta' });
    await expect(prices.getByRole('row').filter({ hasText: seller })).toBeVisible({ timeout: 20000 });
});

test('admin adds a price by hand in the edition prices dialog', async ({ adminPage }) => {
    const bookId = `e2e-manual-${Date.now()}`;
    await openWork(adminPage);
    await adminPage.locator('button:has(.pi-euro)').click();
    const prices = adminPage.getByRole('dialog').filter({ hasText: 'Lisää hinta' });
    await prices.getByRole('button', { name: 'Lisää hinta' }).click();

    await selectOption(adminPage, prices.locator('.p-dropdown', { hasText: 'Valitse lähde' }), 'Antikvaari', { exact: true });
    await prices.getByPlaceholder('esim. 640332182').fill(bookId);
    await selectOption(adminPage, prices.locator('.p-dropdown', { hasText: 'Valitse kunto' }), 'K4', { exact: true });
    // InputNumber updates its value from keystrokes, not from fill().
    await prices.locator('.p-inputnumber input').pressSequentially('7');
    await prices.getByRole('button', { name: 'Tallenna' }).click();

    await expect(adminPage.getByText('Hinta tallennettu')).toBeVisible({ timeout: 20000 });
    await expect(prices.getByRole('row').filter({ hasText: /K4\s*7\.00/ }).first()).toBeVisible({ timeout: 20000 });
});
