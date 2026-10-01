import { test, expect } from '../fixtures/auth';

// Logged in on purpose: article-page.tsx used to refetch the article in a
// loop for logged-in users only (an unmemoized user object as an effect
// dependency; logged out it is a stable null). The guard catches a loop.
test('Article page loads without refetch loop', async ({ userPage }) => {
    await userPage.goto('/articles/1');
    await expect(userPage.getByRole('heading', { name: /Samuel R\. Delany/ })).toBeVisible({ timeout: 20000 });
    // Give a refetch loop time to show up in the guard
    await userPage.waitForTimeout(3000);
});
