# Frontend performance test set

A repeatable regression + performance harness for the frontend
performance-fix pass (see the analysis in the session that produced this).
Covers every issue area identified: code splitting, in-place-mutating
`.sort()` calls on cached/prop data, unpaginated tables, and non-lazy
images.

## What it measures

For each route in `routes.json`, in a fresh browser context (no shared
cache across routes, so numbers are comparable run to run):

- Console errors / page errors (regression signal — a route "fails" if
  it throws, or errors it didn't already have in the `baseline` run)
- Navigation timing (wall-clock load time, `domContentLoadedEventEnd`)
- Total response bytes transferred
- DOM node count (proxy for render cost on list-heavy pages)

External-CDN 404s (primereact/primeicons fonts loaded from
`cdnjs.cloudflare.com` in `index.html`) are excluded from the regression
gate — known, pre-existing, unrelated to app code.

Production bundle size (`npm run build` chunk sizes, the metric for the
code-splitting issue) is tracked separately via `record-build.cjs`.

## Usage

After each fix, from the `suomisf-ui` repo root, with the dev server
running on `localhost:3000`:

```bash
# 1. Regression + per-route timing/bytes/DOM
NODE_PATH=./node_modules node perf-tests/measure.cjs <label> "what changed"

# 2. Production bundle size (only meaningful after a real build, not the
#    dev server — run this whenever the fix could affect bundle size,
#    e.g. the code-splitting work). Must run AFTER step 1 for the same
#    label, since measure.cjs regenerates RESULTS.md from scratch and
#    would wipe the build section otherwise.
npm run build > perf-tests/build-<label>.txt 2>&1
node perf-tests/record-build.cjs <label> perf-tests/build-<label>.txt
```

`measure.cjs` exits non-zero if any route shows a *new* problem (nav
error, or a console error not already present in the `baseline` run) —
usable as a CI-style gate, not just a report.

Results accumulate in `results.json` (raw data) and get rendered to
`RESULTS.md` (human-readable, with deltas against `baseline`) after every
`measure.cjs` run.

## Routes

See `routes.json` — each entry names the specific pre-existing issue it
exercises (e.g. `/magazines/43` has 177 issues, to stress
`magazine-page.tsx`'s `data.issues.sort(...)` in-place mutation).
