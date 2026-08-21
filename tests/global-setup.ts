import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execFileAsync = promisify(execFile);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_DIR = path.resolve(__dirname, '../../suomisf');
const GUNICORN = path.join(BACKEND_DIR, '.venv/bin/gunicorn');
const PID_FILE = '/tmp/gunicorn-e2e.pid';
const LOG_FILE = '/tmp/gunicorn-e2e.log';
const E2E_BACKEND_URL = 'http://127.0.0.1:5001';
const READY_CHECK_URL = `${E2E_BACKEND_URL}/api/countries`;

async function waitForBackend(timeoutMs = 30000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        try {
            const res = await fetch(READY_CHECK_URL);
            if (res.ok) return;
        } catch {
            // not up yet
        }
        await new Promise((r) => setTimeout(r, 500));
    }
    const log = fs.existsSync(LOG_FILE) ? fs.readFileSync(LOG_FILE, 'utf8').slice(-4000) : '(no log)';
    throw new Error(
        `E2E backend did not become ready at ${READY_CHECK_URL} within ${timeoutMs}ms.\n` +
        `--- last gunicorn-e2e.log output ---\n${log}`
    );
}

export default async function globalSetup() {
    console.log('[global-setup] cloning suomisf_test and ensuring E2E test accounts...');
    await execFileAsync('pdm', ['run', 'python', 'tests/scripts/setup_e2e_db.py'], {
        cwd: BACKEND_DIR,
        env: { ...process.env, SUOMISF_DOTENV: '.env.e2e' },
    });

    console.log('[global-setup] starting E2E backend on :5001...');
    const logFd = fs.openSync(LOG_FILE, 'w');
    const child = spawn(
        GUNICORN,
        // --workers > 1: the E2E backend takes bursty, concurrent traffic
        // from many parallel Playwright workers, unlike the normal
        // single-user dev gunicorn instance on :5000 - the default of one
        // sync worker serializes every request and causes exactly the kind
        // of timeout under load this was tuned to fix.
        ['wsgi:app', '--bind', '127.0.0.1:5001', '--workers', '4', '--pid', PID_FILE],
        {
            cwd: BACKEND_DIR,
            env: { ...process.env, SUOMISF_DOTENV: '.env.e2e' },
            detached: true,
            stdio: ['ignore', logFd, logFd],
        }
    );
    child.unref();

    await waitForBackend();
    console.log('[global-setup] E2E backend ready.');
}
