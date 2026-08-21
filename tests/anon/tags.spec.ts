import { test, expect } from '@playwright/test';

test('Tags page loads and displays categories with tags', async ({ page }) => {
    // Navigate to tags page
    await page.goto('/tags');

    // Check that the page heading exists
    await expect(page.getByRole('heading', { name: /Asiasanat/i })).toBeVisible();

    // Check all category headers exist
    const categories = ['Alagenret', 'Tyylit', 'Paikat', 'Toimijat', 'Tapahtuma-aika', 'Aihe'];
    for (const category of categories) {
        await expect(page.getByRole('heading', { name: category })).toBeVisible();
    }

    // Check specific tags exist with counts
    const tagChecks = [
        // Alagenret
        { text: 'dystopia', section: 'Alagenret' },
        { text: 'kyberpunk', section: 'Alagenret' },
        { text: 'uuskumma', section: 'Alagenret' },
        // Tyylit
        { text: 'huumori', section: 'Tyylit' },
        { text: 'mysteeri', section: 'Tyylit' },
        { text: 'uusi aalto', section: 'Tyylit' },
        // Paikat
        { text: 'atlantis', section: 'Paikat' },
        { text: 'lontoo', section: 'Paikat' },
        { text: 'turku', section: 'Paikat' },
        // Toimijat
        { text: 'huijarit', section: 'Toimijat' },
        { text: 'naiskirjailijat', section: 'Toimijat' },
        { text: 'yli-ihmiset', section: 'Toimijat' },
        // Tapahtuma-aika
        { text: '1940-luku', section: 'Tapahtuma-aika' },
        { text: 'joulu', section: 'Tapahtuma-aika' },
        { text: 'tulevaisuus', section: 'Tapahtuma-aika' },
        // Aihe
        { text: 'aikakone', section: 'Aihe' },
        { text: 'klassikot', section: 'Aihe' },
        { text: 'sivilisaatio', section: 'Aihe' }
    ];

    // Debug: Log all sections first
    const allSections = await page.locator('.tag-section').all();
    // console.log('Found sections:', await Promise.all(allSections.map(async s => {
    //     const heading = await s.locator('h2').textContent();
    //     return heading;
    // })));

    // Debug: Print DOM structure around headers
    // console.log('DOM structure:', await page.locator('main').innerHTML());

    for (const tag of tagChecks) {
        // console.log(`Searching for tag: ${tag.text} in section: ${tag.section}`);

        // Try different ways to find the section content
        const headerElement = page.getByRole('heading', { name: tag.section });
        await expect(headerElement).toBeVisible();

        // Get parent div or section containing both header and content
        const sectionContent = await page.evaluate((sectionName) => {
            const header = Array.from(document.querySelectorAll('h2')).find(h => h.textContent?.includes(sectionName));
            if (!header) return null;
            // Try to get next sibling first (likely contains the content)
            const nextSibling = header.nextElementSibling;
            if (nextSibling) return nextSibling.textContent;
            // Fallback to parent if no sibling found
            const parent = header.parentElement;
            return parent ? parent.textContent : null;
        }, tag.section) || '';

        // console.log(`Content found for section ${tag.section}:`, sectionContent || 'No content found');

        expect(sectionContent, `No content found for section ${tag.section}`).toBeTruthy();

        // Find tag in content
        const pattern = new RegExp(`\\b${tag.text}\\s*\\((\\d+)\\)`, 'i');
        const match = sectionContent.match(pattern);

        expect(match, `Tag ${tag.text} not found in section ${tag.section}`).toBeTruthy();

        if (match) {
            const count = parseInt(match[1]);
            expect(count).toBeGreaterThan(0);
            expect(count).toBeLessThan(1000);
        }
    }
});
