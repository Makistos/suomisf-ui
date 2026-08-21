# Frontend E2E test suite — plan

Status: planning only, no test code written yet. This document is the spec for
building out `tests/` into a suite that covers anonymous, logged-in-user, and
admin operations, running against a disposable clone of the dev database so
the real dataset is never touched.

## 1. Current state

- Playwright is already installed and configured (`playwright.config.ts`,
  scripts `test:e2e` / `test:e2e:ui` / `test:e2e:debug`). `webServer` boots
  `npm run dev` against `localhost:3000` automatically if not already running.
- `tests/` has 12 spec files (~435 lines total), all **anonymous, read-only,
  single-page smoke checks**: they load a page, assert a heading/table is
  visible, and in several cases assert exact row content or a total-count
  range against the live dev database (e.g. `people.spec.ts` asserts
  "Henkilöitä yhteensä" is between 6500 and 10000, and asserts exact cell text
  for the row "Aalto, Amanda"). `tests/font-page.ts` is a stray duplicate of
  `example.spec.ts` (no `.spec.` in the name, so Playwright doesn't even pick
  it up — dead file).
- No coverage exists for: authentication, logged-in user actions (marking
  books owned/read, profile/stats, suggestions), or any admin create/edit/
  delete flow. No coverage for search. No fixtures, no test-data lifecycle.
- `perf-tests/` (built earlier this project) is a separate, purpose-built
  Playwright harness for load-time/regression-count metrics, not functional
  correctness. This plan doesn't touch it — the two suites serve different
  purposes, though `perf-tests/routes.json` is a useful reference for which
  routes are worth covering.
- **The backend already has a mature, working test-database mechanism** —
  found while researching this plan, in `../suomisf/tests/conftest.py`. This
  changes the design significantly from the first draft of this plan (see
  §2). It:
  - Maintains a real, separate Postgres database `suomisf_test` (already
    exists on this machine, alongside `suomisf`).
  - `clone_test_database()`: drops the `suomisf` schema in `suomisf_test`,
    then pipes `pg_dump -n suomisf suomisf | psql suomisf_test` to clone it
    fresh from the current dev DB, then re-applies ~13 migration SQL files
    that predate/postdate that dump baseline.
  - `create_test_users()`: idempotently creates two accounts directly via
    the `User` SQLAlchemy model — `Test Admin` / `testadminpass123`
    (`is_admin=True`) and `Test User` / `testpassword123`
    (`is_admin=False`).
  - Both are driven by pytest fixtures (`setup_test_database`, session-scoped
    autouse; `--skip-db-setup` to skip when iterating).
  - This is exactly the "database snapshot" mechanism you mentioned. Rather
    than inventing a parallel one for the frontend suite, this plan reuses
    it directly.

## 2. Revised approach: reuse the backend's existing clone + test users

Drop the earlier idea of a bespoke `e2e_admin_<runid>` seeding script with a
fresh random suffix per run. Instead:

- **Database**: reuse `suomisf_test`, recloned from `suomisf` at the start
  of every E2E run via the existing `clone_test_database()` /
  `create_test_users()` functions. A thin wrapper script,
  `../suomisf/tests/scripts/setup_e2e_db.py`, imports and calls both (they're
  plain top-level functions in `conftest.py`, importable despite the
  filename). No changes needed to the existing pytest suite.
- **Accounts**: reuse the existing `Test Admin` / `testadminpass123` and
  `Test User` / `testpassword123` rather than minting new ones. (You said a
  shared password across both would be fine — these two already have
  different ones and are proven working with the backend's own pytest suite,
  so this plan keeps them as-is rather than touching working infrastructure
  for a cosmetic match. Easy to unify later if you'd rather.)
- **Isolation / cleanup**: because the whole `suomisf_test` database is
  disposable and gets dropped-and-recloned at the start of the *next* run,
  admin CRUD tests in this suite need **no cleanup logic at all** — create,
  edit, delete, assert, walk away. This replaces the naming-convention +
  sweep-script cleanup design from the first draft entirely. (Test entities
  still get an `E2E_TEST_` prefix in their names purely so a failed run is
  easy to eyeball in the DB while debugging — not for automated cleanup.)
- **Re-cloning cost**: `pg_dump | psql` of the whole `suomisf` schema runs
  today as part of the backend's own pytest setup, so it's already a known,
  acceptable cost locally. Same trade-off applies here. `--skip-db-setup`
  equivalent (see §8) lets you skip the clone while iterating on a single
  spec.

## 3. The missing piece: routing the frontend at the test database

The backend's existing mechanism swaps `DATABASE_URL` **inside the pytest
process** (`app` fixture reassigns `flask_app.config['SQLALCHEMY_DATABASE_URI']`
and disposes/recreates the SQLAlchemy engine). That only affects Flask's
in-process test client used by `pytest` — it does nothing for the real
gunicorn process the frontend actually talks to
(`gunicorn wsgi:app --bind 127.0.0.1:5000`, currently running as PID from
`/tmp/gunicorn.pid`, bound to the real `suomisf` DB via `.env`).

For Playwright to drive real browser → real HTTP → real Flask → `suomisf_test`,
something has to serve HTTP against the test database. Running the frontend's
E2E suite must **not** touch your actual dev gunicorn/DB — you're likely
using it while tests run. Plan:

- **A second, disposable backend process**, started by Playwright's global
  setup and stopped by global teardown:
  `gunicorn wsgi:app --bind 127.0.0.1:5001 --pid /tmp/gunicorn-e2e.pid`,
  pointed at `suomisf_test`.
- `app/__init__.py` currently does `load_dotenv('.env', override=True)` —
  `override=True` means a pre-set `DATABASE_URL` environment variable would
  be **ignored** in favor of `.env`'s value, so we can't just set an env var
  before launching. **One small backend change is needed**: read the dotenv
  filename from an env var, e.g.
  `load_dotenv(os.environ.get('SUOMISF_DOTENV', '.env'), override=True)`.
  Then a new `../suomisf/.env.e2e` (identical to `.env` but
  `DATABASE_URL` pointed at `suomisf_test`) lets the E2E backend start via
  `SUOMISF_DOTENV=.env.e2e gunicorn wsgi:app --bind 127.0.0.1:5001 ...`
  without touching the real `.env` or the real running instance at all.
- Frontend side: a new Vite mode, `.env.e2e` in this repo
  (`VITE_API_URL=http://localhost:5001/api/`,
  `VITE_IMAGE_URL=http://localhost:5001/`), and a `dev:e2e` npm script
  (`vite --mode e2e`). `playwright.config.ts`'s `webServer.command` becomes
  conditional (or a second Playwright config) so E2E runs boot the frontend
  in `e2e` mode against port 5001, while your normal `npm start` /
  `test:e2e` iteration against the real dev stack keeps working unchanged if
  you ever want to point Playwright at it directly.
- Net effect: your live dev session (port 5000, real `suomisf` DB, real
  gunicorn PID you already manage) is never touched. The E2E run stands up
  and tears down its own throwaway frontend + backend + DB clone trio
  end-to-end.

This is the one part of the plan that needs a small, explicit backend code
change before implementation — flagging it up front since everything else is
additive/new files only.

## 4. Auth fixtures (Playwright side)

New `tests/fixtures/auth.ts` extending Playwright's `test`:

```
export const test = base.extend<{ adminPage: Page, userPage: Page }>({
  adminPage: async ({ browser }, use) => { ... },
  userPage: async ({ browser }, use) => { ... },
});
```

Rather than driving the login form in every test (slow, and couples every
test to the login UI), log in once per worker via a direct API call
(`POST /api/login`, same call `auth-service.ts`'s `login()` makes) against
the E2E backend (port 5001) to get a token, inject it into `localStorage` in
the same shape `login()` stores
(`{ access_token, refresh_token, name, role }`), and save it as Playwright
`storageState`. One real UI-driven login test still exists separately (§6.3)
to cover the login form itself.

## 5. Coverage plan

### 5.1 Anonymous / read-only pages — extend existing suite

Keep the 12 existing specs, but:

- Delete the dead `tests/font-page.ts`.
- Since these will now run against a **fresh clone** of the dev DB rather
  than the live one, exact-count assertions (`toBeGreaterThan(6500)` etc.)
  become stable snapshots of clone-time state rather than a moving target —
  worth keeping as real regression checks now that the data underneath them
  won't silently grow between runs. (This also resolves the brittleness
  concern from the first draft of this plan without having to soften any
  assertions.)
- Add specs for routes with no coverage yet: `/works/:id`, `/editions/:id`,
  `/shorts/:id`, `/tags`, `/tags/:id`, `/nonfiction`, `/stats`, `/latest`,
  `/faq` (exists), `/bookindex`, `/shortstoryindex`.

### 5.2 Search

- `mainmenu.tsx`'s search bar: a known-good term returns results with author
  lines; the "Vain nimet" (titles-only) checkbox toggles `?titles=1` and
  changes the result set; a nonsense term returns an empty state, not an
  error.
- One targeted case for Finnish stemming/compound-splitting (per
  `CLAUDE.md`'s voikko config), not exhaustive linguistic coverage.

### 5.3 Authenticated user operations (`Test User` account)

- Login form itself: correct credentials → redirected/reloaded as logged in;
  wrong password → inline error message, no crash. (The one spec that drives
  the real form instead of using the API-login fixture.)
- Logout clears the session (`localStorage` cleared, admin-only UI
  disappears).
- Mark an edition as owned / un-owned (`edition-ownership.tsx`), confirm it
  shows up under the user's profile "owned" tab (`owned-books.tsx`,
  `user-stats.tsx`).
- Mark a work's read status and opinion (👍/⊖/👎) via
  `work-read-control.tsx`, confirm it shows under the profile "read" tab
  (`read-books.tsx`).
- Profile page (`profile-page.tsx`) loads user stats/charts
  (`user-collection-charts.tsx`, `collection-stats-dialog.tsx`) without
  error once at least one book is owned/read.
- Suggestion wizard (`features/suggestion/routes/suggestion-page.tsx`) —
  walk the stepper to completion for at least one path.
- Forgot/reset password flow, fully exercised without needing email:
  1. Drive `/forgot-password` for `Test User`'s address through the real UI
     — hits `POST /api/password/forgot`
     (`app/impl_users.py::request_password_reset`). Safe to call for real:
     `send_email()` (`app/impl_email.py`) defaults to a `log` backend that
     writes to the app logger instead of sending, unless `MAIL_BACKEND=smtp`
     is set — the E2E backend's `.env.e2e` should explicitly not set that.
  2. The reset token is deterministic, not something a test needs to
     intercept from an inbox: it's
     `URLSafeTimedSerializer(SECRET_KEY, salt='pw-reset').dumps({'uid':
     user.id, 'fp': sha256(user.password_hash)[:16]})`
     (`app/impl_users.py::_reset_serializer` /
     `_password_fingerprint`). A small backend helper script,
     `../suomisf/tests/scripts/mint_reset_token.py <username>`, imports
     those two functions and prints a valid token for the current test run's
     `Test User`. The Playwright spec calls it (or a thin `/api`-adjacent
     test-only route, if you'd rather not shell out — worth a decision, see
     §9) to get a real token, then visits
     `/reset-password?token=<token>` and completes the flow through the
     actual UI/endpoint.
- Confirm admin-only UI (SpeedDials, edit/delete buttons) is **absent** for
  this account across a couple of representative pages.

### 5.4 Admin operations (`Test Admin` account)

One create → verify → edit → verify → delete → verify-gone cycle per entity
type, named `E2E_TEST_...` for debuggability (not cleanup — see §2). Cover,
in priority order (driven by how much surface area each SpeedDial exposes,
per the `isAdmin(user)` grep across the codebase):

1. **Work** (`work-page.tsx`) — highest priority, most central entity.
2. **Edition** (`edition-details.tsx`) — create under a test work, verify
   `edition-owners-panel.tsx` renders for it.
3. **Person** (`person-page.tsx`, `person-details.tsx`).
4. **Publisher** (`publisher-page.tsx`).
5. **Award** + **Awarded** (`award-page.tsx`, `awards-page.tsx`) — award
   winner entry.
6. **Bookseries** / **Pubseries** (`bookseries-page.tsx`,
   `pubseries-page.tsx`).
7. **Magazine** + **Issue** (`magazine-page.tsx`, `issue-page.tsx`) — this
   pair already surfaced one real bug this session (a missing `key` prop),
   so it's worth solid coverage.
8. **Short story** (`short-page.tsx`, `short-summary.tsx`).
9. **Tag** (`sftag.tsx`) — including `kirjasampo-tag-import.tsx` if it can
   be exercised without a live external dependency (otherwise mock/skip
   with a note).
10. **Entity changes / audit log**: after any one of the above create/edit/
    delete actions, verify the action shows up on `/changes`
    (`entity-changes.tsx`) — ties the admin suite back to the one table this
    project already paginated for performance.

Each of these is its own spec file, matching the existing one-file-per-area
convention.

### 5.5 Explicitly out of scope for this plan

- Visual regression / pixel diffing.
- Load/perf testing — already covered by `perf-tests/`.
- Cross-browser matrix beyond what `playwright.config.ts` already declares
  (Chromium + Firefox; WebKit is commented out).
- Award-winner ISFDB import — no frontend UI exists yet (per memory: still
  design-stage). Add a spec once it ships.

## 6. Execution model (no CI)

Confirmed: no CI pipeline exists, this is local-only. That simplifies things
— no need to solve "how does CI get a seeded backend" (the open question from
the first draft). The run sequence for `npm run test:e2e` becomes:

1. `globalSetup` (`tests/global-setup.ts`):
   a. Shell out to `pdm run python tests/scripts/setup_e2e_db.py` in
      `../suomisf` — clones `suomisf` → `suomisf_test`, applies migrations,
      creates/confirms `Test Admin` / `Test User`.
   b. Launch the E2E gunicorn instance on port 5001
      (`SUOMISF_DOTENV=.env.e2e gunicorn wsgi:app --bind 127.0.0.1:5001
      --pid /tmp/gunicorn-e2e.pid`), wait for it to respond.
2. Playwright's own `webServer` config launches the frontend in `e2e` mode
   (`vite --mode e2e`, port distinct from your normal `:3000` dev server —
   e.g. `:3100` — so both can run simultaneously without conflict).
3. Tests run against `localhost:3100` / `localhost:5001` / `suomisf_test`.
4. `globalTeardown`: stop the E2E gunicorn process (`kill $(cat
   /tmp/gunicorn-e2e.pid)`). The DB clone is left in place until the next
   run's setup step drops and reclones it (so it's inspectable after a
   failure, per §2's debuggability note).

## 7. Proposed file layout

```
tests/
  fixtures/
    auth.ts                  # adminPage / userPage fixtures, storageState-based
  global-setup.ts             # clones DB, starts E2E backend on :5001
  global-teardown.ts          # stops E2E backend
  anon/
    people.spec.ts            # existing specs, relocated
    award.spec.ts
    ...
    works.spec.ts              # new
    search.spec.ts             # new
  user/
    auth.spec.ts               # login form, logout
    ownership.spec.ts          # owned/read status
    profile.spec.ts
    suggestion.spec.ts
    password-reset.spec.ts
  admin/
    work.spec.ts
    edition.spec.ts
    person.spec.ts
    publisher.spec.ts
    award.spec.ts
    bookseries.spec.ts
    pubseries.spec.ts
    magazine.spec.ts
    short.spec.ts
    tag.spec.ts
    changes-audit.spec.ts

.env.e2e                       # VITE_API_URL=http://localhost:5001/api/ etc.

../suomisf/
  .env.e2e                     # copy of .env with DATABASE_URL -> suomisf_test
  tests/scripts/
    setup_e2e_db.py            # imports clone_test_database + create_test_users
    mint_reset_token.py        # prints a valid password-reset token for a user
```

`app/__init__.py` gains the one-line `SUOMISF_DOTENV` env-var indirection
described in §3. `playwright.config.ts` gains `globalSetup` /
`globalTeardown`; `webServer.command` switches to `vite --mode e2e` on port
3100. `testDir` stays `./tests`.

## 8. Iteration convenience

Re-cloning the whole DB on every run is fine for a full pass but slow for
iterating on one spec. Mirror the backend's own `--skip-db-setup` pattern:
an env var (`SKIP_DB_SETUP=1 npm run test:e2e`) that skips step 1a in §6 and
just reuses whatever's already in `suomisf_test` plus the already-running
E2E backend if one is still up — matches how you already iterate on the
Python side.

## 9. Phased rollout

1. **Foundation**: `setup_e2e_db.py`, `mint_reset_token.py`, the
   `SUOMISF_DOTENV` backend tweak, `.env.e2e` (both repos), `global-setup`/
   `global-teardown`, auth fixtures, one smoke spec per role (anon/user/
   admin) to prove the whole plumbing works end to end. Delete
   `font-page.ts`.
2. **Anonymous coverage**: fill the route gaps in §5.1.
3. **User operations**: §5.3.
4. **Admin CRUD**: §5.4, entity by entity in the listed priority order —
   each one is independently valuable and shippable on its own.

## 10. Decisions log

- Password-reset token minting (§5.3): **subprocess approach** — the
  Playwright spec shells out to
  `../suomisf/tests/scripts/mint_reset_token.py <username>`, matching how
  `global-setup` already talks to the backend for DB cloning. No test-only
  route added to `app/`; all test-only logic stays in `../suomisf/tests/`.
