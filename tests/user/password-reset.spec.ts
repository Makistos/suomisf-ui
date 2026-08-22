import { test, expect } from '@playwright/test';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_DIR = path.resolve(__dirname, '../../../suomisf');

async function mintResetToken(username: string): Promise<string> {
    const { stdout } = await execFileAsync(
        'pdm', ['run', 'python', 'tests/scripts/mint_reset_token.py', username],
        { cwd: BACKEND_DIR, env: { ...process.env, SUOMISF_DOTENV: '.env.e2e' } }
    );
    const lines = stdout.trim().split('\n');
    return lines[lines.length - 1].trim();
}

const ORIGINAL_PASSWORD = 'testpassword123';
const TEMP_PASSWORD = 'temp-e2e-reset-password-1';

test('password reset works end to end without email access', async ({ page }) => {
    // 1. Drive the real "forgot password" form. The backend always returns
    // 200 (no account enumeration) and logs instead of emailing by default,
    // so this is safe to submit for real.
    await page.goto('/forgot-password');
    await page.locator('#email').fill('test-user-e2e@example.invalid');
    await page.getByRole('button', { name: 'Lähetä palautuslinkki' }).click();
    await expect(page.getByText('Jos antamallasi sähköpostiosoitteella')).toBeVisible();

    // 2. Mint a token for the *current* password, then use it to set a new one.
    const tokenForOriginal = await mintResetToken('Test User');
    await page.goto(`/reset-password?token=${tokenForOriginal}`);
    await page.locator('#password').fill(TEMP_PASSWORD);
    await page.locator('#password2').fill(TEMP_PASSWORD);
    await page.getByRole('button', { name: 'Vaihda salasana' }).click();
    await expect(page.getByText('Salasanasi on vaihdettu')).toBeVisible();

    // 3. Prove the new password actually works by logging in with it.
    await page.goto('/login');
    await page.locator('#username').fill('Test User');
    await page.locator('#password').fill(TEMP_PASSWORD);
    await page.getByRole('button', { name: 'Kirjaudu' }).click();
    await expect(page.getByText('Test User')).toBeVisible({ timeout: 10000 });

    // 4. Restore the original password so other specs' userPage fixture
    // (which logs in with ORIGINAL_PASSWORD) keeps working. The reset token
    // embeds a fingerprint of the *current* password hash, so a fresh token
    // is needed here - the one from step 2 is now stale.
    const tokenForTemp = await mintResetToken('Test User');
    await page.goto(`/reset-password?token=${tokenForTemp}`);
    await page.locator('#password').fill(ORIGINAL_PASSWORD);
    await page.locator('#password2').fill(ORIGINAL_PASSWORD);
    await page.getByRole('button', { name: 'Vaihda salasana' }).click();
    await expect(page.getByText('Salasanasi on vaihdettu')).toBeVisible();
});
