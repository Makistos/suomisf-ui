import { test, expect } from '../fixtures/auth';
import { Page } from '@playwright/test';

const dialAction = (page: Page, label: string) =>
    page.locator(`a.p-speeddial-action[aria-label="${label}"]`);

test('admin can create, edit and delete an edition, and the owners panel appears once someone else owns it', async ({ adminPage }) => {
    const marker = `E2E_TEST_edition_${Date.now()}`;

    await adminPage.goto('/works/2');
    await expect(adminPage.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });

    // Create a new edition of this work
    await adminPage.locator('.fixed-dial .p-speeddial-button').click();
    await dialAction(adminPage, 'Uusi painos').click();
    const createDialog = adminPage.getByRole('dialog').filter({ hasText: 'Uusi painos' });
    await createDialog.locator('input[name="misc"]').fill(marker);
    const personInput = createDialog.locator('input[placeholder="Henkilö"]').first();
    await personInput.click();
    await personInput.type('Verne', { delay: 100 });
    await expect(adminPage.locator('.p-autocomplete-item').first()).toBeVisible({ timeout: 10000 });
    await adminPage.locator('.p-autocomplete-item').first().click();
    await createDialog.locator('.p-dropdown', { hasText: 'Rooli' }).click();
    // Edition-level contributor roles differ from work-level ones (no
    // "Kirjoittaja"/author here - that belongs to the work, not the print run).
    await adminPage.getByRole('option', { name: 'Kääntäjä' }).click();
    await createDialog.getByRole('button', { name: 'Tallenna' }).click();
    await expect(adminPage.getByText('Tallentaminen onnistui')).toBeVisible({ timeout: 20000 });

    // The default "Lyhyt" view groups similar editions together and may not
    // show the new one as its own card - "Kaikki" lists every edition.
    await adminPage.getByRole('button', { name: 'Kaikki' }).click();

    const editionCard = adminPage.locator('.edition-list-item', { hasText: marker });
    await expect(editionCard).toBeVisible({ timeout: 20000 });

    // Have Test User mark this edition owned via the API, then reload as
    // admin - edition-owners-panel.tsx only renders once someone *other*
    // than the viewer owns the edition. The edition card has no direct link
    // to its own id (it's already the page you're on), so look it up via
    // the API by matching the marker we just saved into `misc`.
    const work = await (await adminPage.request.get('http://localhost:5001/api/works/2')).json();
    const newEdition = work.editions.find((e: { misc?: string }) => e.misc === marker);
    expect(newEdition).toBeTruthy();
    const editionId = newEdition.id;

    const userLogin = await (await adminPage.request.post('http://localhost:5001/api/login', {
        data: { username: 'Test User', password: 'testpassword123' },
    })).json();
    await adminPage.request.put('http://localhost:5001/api/editions/owner', {
        headers: { Authorization: `Bearer ${userLogin.access_token}` },
        data: {
            edition_id: Number(editionId),
            user_id: userLogin.id,
            condition: { value: 3, id: 1, name: '' },
            description: '',
        },
    });

    await adminPage.reload();
    await expect(adminPage.getByRole('progressbar')).not.toBeVisible({ timeout: 20000 });
    await adminPage.getByRole('button', { name: 'Kaikki' }).click();
    const reloadedCard = adminPage.locator('.edition-list-item', { hasText: marker });
    // EditionOwnersPanel's button is icon-only (fa-users), tooltip text
    // isn't exposed as an accessible name.
    await expect(reloadedCard.locator('.fa-users')).toBeVisible({ timeout: 20000 });

    // Edit - EditionDetails' pencil/trash buttons are icon-only too.
    await reloadedCard.locator('.pi-pencil').click();
    const editDialog = adminPage.getByRole('dialog').filter({ hasText: 'Painoksen muokkaus' });
    const editedMarker = `${marker}_edited`;
    await editDialog.locator('input[name="misc"]').fill(editedMarker);
    await editDialog.getByRole('button', { name: 'Tallenna' }).click();
    await expect(adminPage.getByText('Tallentaminen onnistui')).toBeVisible({ timeout: 20000 });
    await expect(adminPage.locator('.edition-list-item', { hasText: editedMarker })).toBeVisible({ timeout: 20000 });

    // Delete - uses a ConfirmPopup (not ConfirmDialog), same accept/reject labels
    const finalCard = adminPage.locator('.edition-list-item', { hasText: editedMarker });
    await finalCard.locator('.pi-trash').click();
    // Multiple ConfirmPopup instances can be mounted (one per trash button
    // on the page); only the one just triggered is actually visible.
    await adminPage.getByRole('button', { name: 'Kyllä' }).last().click();
    await expect(adminPage.locator('.edition-list-item', { hasText: editedMarker })).not.toBeVisible({ timeout: 20000 });
});
