# Security debt

Tracks dependency vulnerabilities that were investigated but deliberately
*not* fixed yet, and why. See `npm audit` for the live list; this file is
about the ones that need a real decision, not just a version bump.

Last reviewed: 2026-08-19.

## Needs a major-version migration

- **react-router-dom v7** — one moderate CVE (GHSA-337j-9hxr-rhxg, arbitrary
  constructor injection via `deserializeErrors()` in SSR hydration) is only
  fixed in react-router 7.18.0+. We're on 6.30.6 (latest 6.x), which closes
  the other two flagged CVEs. v7 has real API changes (data router patterns,
  route config); needs its own migration pass and testing, not a drive-by
  bump.
- **vite 8** — esbuild's dev-server CVE (GHSA-67mh-4wv8-2f99) and some vite
  CVEs are only fixed from vite 6+ (fully from 8.2.1). We're on 5.4.21
  (latest 5.x), which closes the CVEs patched within 5.x. Vite major bumps
  tend to have real breaking changes (plugin API, config shape); needs
  testing across the whole build/dev pipeline before attempting.

## No upstream fix exists

- **quill** (GHSA-v3m3-f69x-jf25, XSS via HTML export) — we're already on
  the latest release (2.0.3); no patched version exists yet. Re-check
  periodically (`npm view quill versions`).
- **node-fetch** (via `face-api.js` → `@tensorflow/tfjs-core` → `node-fetch`)
  — `npm audit fix --force` "fixes" this by *downgrading* face-api.js to
  0.20.0, which isn't a real fix. face-api.js is actively used
  (`src/features/person/components/score-image.ts`) and its tensorflow.js
  dependency chain is old/unmaintained. Real fix would be replacing
  face-api.js with a maintained face-detection library — a separate,
  larger task, not a dependency bump.

## Backend (../suomisf, separate repo)

- **Flask 2.3.2 → 3.1.3+ / Werkzeug (pinned `<3.0.0`) → 3.1.6+** — all 6
  open Werkzeug/Flask CVEs (mostly `safe_join()` Windows device-name issues,
  plus one Werkzeug debugger RCE) only have fixes in the 3.x line. This is a
  major-version bump touching every request the backend handles; needs its
  own testing pass across the API before attempting. Explicitly deferred —
  see `pyproject.toml`'s `Flask==2.3.2` / `werkzeug<3.0.0` pins.

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
