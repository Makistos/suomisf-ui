import fs from 'fs';
import { CoverageReport } from 'monocart-coverage-reports';
import { coverageEnabled, coverageOptions } from './fixtures/coverage';

const PID_FILES = ['/tmp/gunicorn-e2e.pid', '/tmp/vite-preview-e2e.pid'];

export default async function globalTeardown() {
    if (coverageEnabled) {
        await new CoverageReport(coverageOptions).generate();
    }
    for (const pidFile of PID_FILES) {
        if (!fs.existsSync(pidFile)) continue;
        const pid = parseInt(fs.readFileSync(pidFile, 'utf8').trim(), 10);
        fs.rmSync(pidFile, { force: true });
        if (!pid) continue;
        try {
            // Both servers are started detached, as process-group leaders.
            // Signal the whole group: the frontend pid is npm's, and killing
            // only that left the vite preview server under it running (one
            // more orphan per run).
            try {
                process.kill(-pid, 'SIGTERM');
            } catch {
                process.kill(pid, 'SIGTERM');
            }
            console.log(`[global-teardown] stopped process (pid ${pid}).`);
        } catch (err) {
            console.log(`[global-teardown] could not stop pid ${pid}: ${(err as Error).message}`);
        }
    }
}
