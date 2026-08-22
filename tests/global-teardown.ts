import fs from 'fs';

const PID_FILES = ['/tmp/gunicorn-e2e.pid', '/tmp/vite-preview-e2e.pid'];

export default async function globalTeardown() {
    for (const pidFile of PID_FILES) {
        if (!fs.existsSync(pidFile)) continue;
        const pid = parseInt(fs.readFileSync(pidFile, 'utf8').trim(), 10);
        fs.rmSync(pidFile, { force: true });
        if (!pid) continue;
        try {
            process.kill(pid, 'SIGTERM');
            console.log(`[global-teardown] stopped process (pid ${pid}).`);
        } catch (err) {
            console.log(`[global-teardown] could not stop pid ${pid}: ${(err as Error).message}`);
        }
    }
}
