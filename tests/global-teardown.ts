import fs from 'fs';

const PID_FILE = '/tmp/gunicorn-e2e.pid';

export default async function globalTeardown() {
    if (!fs.existsSync(PID_FILE)) {
        console.log('[global-teardown] no E2E backend pid file, nothing to stop.');
        return;
    }
    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim(), 10);
    if (!pid) return;
    try {
        process.kill(pid, 'SIGTERM');
        console.log(`[global-teardown] stopped E2E backend (pid ${pid}).`);
    } catch (err) {
        console.log(`[global-teardown] could not stop pid ${pid}: ${(err as Error).message}`);
    }
    fs.rmSync(PID_FILE, { force: true });
}
