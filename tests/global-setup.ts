import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execFileAsync = promisify(execFile);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = path.resolve(__dirname, '..');
const BACKEND_DIR = path.resolve(__dirname, '../../suomisf');
const GUNICORN = path.join(BACKEND_DIR, '.venv/bin/gunicorn');

const BACKEND_PID_FILE = '/tmp/gunicorn-e2e.pid';
const BACKEND_LOG_FILE = '/tmp/gunicorn-e2e.log';
const BACKEND_READY_URL = 'http://127.0.0.1:5001/api/countries';

const FRONTEND_PID_FILE = '/tmp/vite-preview-e2e.pid';
const FRONTEND_LOG_FILE = '/tmp/vite-preview-e2e.log';
const FRONTEND_READY_URL = 'http://localhost:3100/';

async function waitForUrl(url: string, logFile: string, timeoutMs = 30000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        try {
            const res = await fetch(url);
            if (res.ok) return;
        } catch {
            // not up yet
        }
        await new Promise((r) => setTimeout(r, 500));
    }
    const log = fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8').slice(-4000) : '(no log)';
    throw new Error(
        `Nothing answered at ${url} within ${timeoutMs}ms.\n` +
        `--- last ${path.basename(logFile)} output ---\n${log}`
    );
}

export default async function globalSetup() {
    console.log('[global-setup] cloning suomisf_test/building frontend in parallel...');
    await Promise.all([
        execFileAsync('pdm', ['run', 'python', 'tests/scripts/setup_e2e_db.py'], {
            cwd: BACKEND_DIR,
            env: { ...process.env, SUOMISF_DOTENV: '.env.e2e' },
        }),
        // A real build instead of the live dev server: navigating the dev
        // server concurrently from several Playwright workers made Vite
        // compile modules on demand under contention, which was flaky
        // (occasional crashed pages/timeouts on heavier routes). A built
        // bundle, served statically, doesn't have that problem - same fix
        // perf-tests already relies on for its own concurrent measurements.
        execFileAsync('npm', ['run', 'build:e2e'], { cwd: FRONTEND_DIR }),
    ]);

    console.log('[global-setup] starting E2E backend on :5001...');
    const backendLogFd = fs.openSync(BACKEND_LOG_FILE, 'w');
    spawn(
        GUNICORN,
        // --workers > 1: the E2E backend takes bursty, concurrent traffic
        // from many parallel Playwright workers, unlike the normal
        // single-user dev gunicorn instance on :5000 - the default of one
        // sync worker serializes every request and causes exactly the kind
        // of timeout under load this was tuned to fix.
        ['wsgi:app', '--bind', '127.0.0.1:5001', '--workers', '24', '--pid', BACKEND_PID_FILE],
        {
            cwd: BACKEND_DIR,
            env: { ...process.env, SUOMISF_DOTENV: '.env.e2e' },
            detached: true,
            stdio: ['ignore', backendLogFd, backendLogFd],
        }
    ).unref();

    console.log('[global-setup] starting E2E frontend preview server on :3100...');
    const frontendLogFd = fs.openSync(FRONTEND_LOG_FILE, 'w');
    const frontend = spawn(
        'npm', ['run', 'preview:e2e'],
        {
            cwd: FRONTEND_DIR,
            detached: true,
            stdio: ['ignore', frontendLogFd, frontendLogFd],
        }
    );
    fs.writeFileSync(FRONTEND_PID_FILE, String(frontend.pid));
    frontend.unref();

    await Promise.all([
        waitForUrl(BACKEND_READY_URL, BACKEND_LOG_FILE),
        waitForUrl(FRONTEND_READY_URL, FRONTEND_LOG_FILE),
    ]);
    console.log('[global-setup] E2E backend and frontend ready.');
}
