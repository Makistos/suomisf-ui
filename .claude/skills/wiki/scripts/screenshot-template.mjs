// Wiki screenshot template. Copy to the scratchpad, fill in main(), run
// with `node <file>` while the E2E stack (backend :5001, frontend :3100) runs.
import { createRequire } from 'module';
const require = createRequire('/home/mep/src/suomisf-ui/package.json');
const { chromium } = require('@playwright/test');

const BASE = 'http://localhost:3100';
const API = 'http://127.0.0.1:5001/api/';
const WIKI = '/home/mep/src/suomisf-ui.wiki/images';

const login = async (username = 'Test Admin', password = 'testadminpass123') => {
    const r = await fetch(API + 'login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    if (!r.ok) throw new Error(`login failed ${r.status}: re-seed the E2E DB`);
    return r.json();
};

// API call as the given user (for temporary test records).
const api = (user) => async (method, path, body) => {
    const r = await fetch(API + path, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + user.access_token },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!r.ok) throw new Error(`${method} ${path} ${r.status} ${await r.text()}`);
    return r.json().catch(() => null);
};

// A temporary work; delete it with call('DELETE', 'works/' + id).
const createWork = async (call, data = {}) => {
    const res = await call('POST', 'works', { data: {
        title: 'Tähtien tuolla puolen', pubyear: 1990, work_type: { id: 1 },
        contributions: [{ person: { id: 1 }, role: { id: 1 } }], genres: [], links: [], ...data,
    } });
    return typeof res === 'object' ? (res.id ?? res.response) : res;
};

// user = null for a logged-out page.
const newPage = async (browser, user) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 1100 }, colorScheme: 'light' });
    await ctx.addInitScript(() => document.addEventListener('DOMContentLoaded', () => {
        const s = document.createElement('style');
        s.textContent = '.tsqd-parent-container{display:none!important}';
        document.head.appendChild(s);
    }));
    const page = await ctx.newPage();
    if (user) {
        await page.goto(BASE + '/');
        await page.evaluate(u => localStorage.setItem('user', JSON.stringify(u)), user);
    }
    return page;
};

const main = async (browser) => {
    const admin = await login();
    const call = api(admin);
    const page = await newPage(browser, admin);

    // Example: a dialog on a temporary work.
    // const id = await createWork(call);
    // try {
    //     await page.goto(`${BASE}/works/${id}`);
    //     await page.waitForLoadState('networkidle');
    //     await page.getByRole('tab', { name: 'Muutoshistoria' }).click();
    //     await page.getByRole('button', { name: 'Avaa muutoshistoria' }).click();
    //     await page.locator('.p-dialog').waitFor();
    //     await page.waitForTimeout(500);
    //     await page.locator('.p-dialog').screenshot({ path: `${WIKI}/ohje/muutoshistoria.png` });
    // } finally {
    //     await call('DELETE', 'works/' + id);
    // }
};

const browser = await chromium.launch();
try { await main(browser); } finally { await browser.close(); }
