import { expect, Locator, Page } from '@playwright/test';

/**
 * Open a PrimeReact Dropdown and pick an option.
 *
 * The dropdown panel closes when the page scrolls or resizes under it,
 * which happens while a page is still rendering (charts, late data). A
 * test that opened it at that moment then waited the full test timeout
 * for an option that was no longer visible. This reopens the panel and
 * retries until the option is clicked.
 */
export async function selectOption(page: Page, dropdown: Locator, name: string,
    { exact = false }: { exact?: boolean } = {}) {
    const option = page.getByRole('option', { name, exact });
    await expect(async () => {
        if (!(await option.isVisible())) {
            await dropdown.click();
        }
        await option.click({ timeout: 2000 });
    }).toPass({ timeout: 20000 });
}
