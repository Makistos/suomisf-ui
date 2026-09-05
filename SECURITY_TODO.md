# Security debt

Tracks dependency vulnerabilities that were investigated but deliberately
*not* fixed yet, and why. See `npm audit` for the live list; this file is
about the ones that need a real decision, not just a version bump.

Last reviewed: 2026-09-05.

## Already fixed (2026-09-05)

- **node-fetch** (via `face-api.js` → `@tensorflow/tfjs-core` →
  `node-fetch`; GHSA-r683-j2x4-v87g high + GHSA-w7rc-rwvf-8q5r low, both
  on the same package) —
  the real fix noted below as "a separate, larger task" turned out to
  be a contained one. Replaced face-api.js with
  `@mediapipe/tasks-vision` (Google's actively-maintained successor
  line — face-api.js's own author recommends it) in
  `src/features/person/components/score-image.ts`, the only
  consumer. Zero npm dependencies of its own, so no more transitive
  node-fetch at all, not just a patched version. `scoreFaces()`'s
  signature was unchanged, so its two callers
  (`person-image-picker.tsx`, `find-person-images.ts`) needed no
  edits. Model asset swapped from `public/models/tiny_face_detector_*`
  to `public/models/blaze_face_short_range.tflite` (~230KB,
  self-hosted same as before); the WASM runtime (~34MB across its
  three browser-capability variants) is loaded from jsDelivr's CDN
  rather than self-hosted, to avoid bloating the repo for a
  rarely-used admin feature. Verified: `tsc --noEmit` clean,
  production build succeeds, confirmed via direct browser evaluation
  that `scoreFaces()` correctly detects one face in a real author
  portrait (score 15) and zero faces in a landscape photo (score 0),
  the admin image-picker dialog opens without errors, full Playwright
  suite green. `npm audit`/Dependabot no longer show node-fetch at
  all.
  - Note found along the way, worth knowing for next time: this
    specific node-fetch vulnerability was never actually reachable in
    production even before the fix — `@tensorflow/tfjs-core`'s own
    `package.json` declares `"browser": {"node-fetch": false}`, which
    Vite honors, so the flagged code was already stripped from every
    real browser bundle (confirmed by grepping the built output for
    `node-fetch` — zero matches, pre-fix). Fixed anyway since it's
    real dead weight and kept re-triggering scans, not because it was
    an active exploit path.
- **fflate 0.8.2 → 0.8.3** (GHSA-px8p-9vwx-vf98, medium, DoS via
  infinite loop parsing a malformed ZIP64 archive) — pulled in
  transitively via `jspdf`. `jspdf`'s own dependency range (`^0.8.1`)
  already permitted the fix; the lockfile just hadn't picked it up.
  Straight `npm update fflate --legacy-peer-deps`, no jspdf version
  change. Verified: PDF export (profile page's owned-books export)
  still produces a valid file, full Playwright suite green.

## Already fixed (2026-08-23)

- **react-router-dom 6.30.6 → 7.18.2** — the vulnerable range for
  GHSA-337j-9hxr-rhxg (arbitrary constructor injection via
  `deserializeErrors()` in SSR hydration) grew to cover all of 6.x
  through 7.17.0, closing the "stay on 6.30.6" safe-harbor. Straight
  version bump, no code changes needed: this app only uses the stable,
  carried-over declarative API (`BrowserRouter`, `Routes`/`Route`,
  `Link`, `Outlet`, `useNavigate`, `useParams`, `useLocation`,
  `useSearchParams` — grepped every `react-router-dom` import across 65
  files to confirm), not the data-router/loader/action patterns that
  actually changed between v6 and v7. `npm audit` no longer lists
  react-router or react-router-dom. Verified: `tsc --noEmit` clean,
  production build succeeds, full Playwright suite green (chromium
  43/44 on the full parallel run, the one failure — `latest.spec.ts`,
  an anon read racing concurrently-running admin create/delete specs —
  reproduced as 3/3 passing in isolation single-worker; no route,
  param, navigate, or outlet related failures anywhere in the run).

- **vite 5.4.21 → 8.2.2** — the esbuild dev-server CVE range
  (GHSA-67mh-4wv8-2f99) grew to include all of vite's 5.x line, closing
  the "stay on 5.4.21" safe-harbor that used to hold. Bumped straight to
  8.2.2 (`@vitejs/plugin-react` → 5.2.0, not the newer 6.x line — 6.x adds
  optional peer deps on `@rolldown/plugin-babel`/`babel-plugin-react-compiler`
  that produced an npm ERESOLVE conflict with this project's own
  `@babel/core` chain; 5.2.0 supports vite 8 without pulling that in;
  `vite-tsconfig-paths` → 6.1.1). `npm audit` no longer lists vite at all.
  Verified: `tsc --noEmit` clean, production build succeeds (vite 8 uses
  rolldown as its bundler by default now — the "Module fs externalized"
  and rolldown-runtime chunk in the build output are expected, not
  errors), dev server smoke-tested (HMR/`@react-refresh` responding),
  full Playwright suite green (chromium 44/44, isolated). Three chromium
  failures on the first full-parallel run (ownership/profile/read-status
  specs) reproduced as passing 3/3 when rerun single-worker — parallel
  workers racing the same `Test User` account's rating/ownership state,
  not a vite regression; matches the same flake class already documented
  in `tests/README.md` for firefox.

## No upstream fix exists

- **quill** (GHSA-v3m3-f69x-jf25, XSS via HTML export) — we're already on
  the latest release (2.0.3); no patched version exists yet. Re-check
  periodically (`npm view quill versions`).

## Backend (../suomisf, separate repo)

Flask/Werkzeug fixed 2026-08-23 (Flask 3.1.3, Werkzeug 3.1.8) — see that
repo's own `SECURITY_TODO.md` for details. No open backend items here
currently.

## Already fixed (2026-08-19)

axios, lodash, playwright (minor/patch bumps), react-router-dom → 6.30.6,
vite → 5.4.21, jspdf 3→4 (verified via a real PDF export), postcss, rollup
(via `npm audit fix`), and removal of three unused dependencies
(`git-package-json`, `npm-lifecycle`, `package.json`) that were pulling in
the unfixable `gry`/`tmp` CVEs for no reason. Dropped from 103 open
GitHub-flagged alerts to 8 real remaining ones (see above).

Note: `package-lock.json` was gitignored until this file was added, so
GitHub's dependency graph couldn't see resolved transitive versions and its
alert count lagged badly behind reality. Now tracked in git — dependabot's
numbers should catch up over the next scan cycle.

## yarn.lock removed (2026-08-19)

`yarn.lock` was a dead leftover from the project's original create-react-app
scaffold (added 2021-11-26, the initial commit). Nothing in the project
actually used it — no `packageManager` field, all scripts call `vite`/`npm`
directly, and `yarn` isn't even installed in dev environments here. But
GitHub's dependency graph had been tracking it as a *second*, independent
manifest the whole time, with its own dependabot alerts (some dating back to
2025-02-11) separate from whatever `package.json`/`package-lock.json`
showed. The moment `package-lock.json` got tracked, every already-open
`yarn.lock` alert got a duplicate opened against the new manifest too —
that's the "two new alerts" that prompted this. Deleted `yarn.lock` entirely
so there's one lockfile and one set of alerts going forward.
