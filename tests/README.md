# E2E test suite

Playwright specs covering anonymous, logged-in-user, and admin flows against
a disposable clone of the dev database. See `../TEST_PLAN.md` for the design
rationale; this file documents what each spec actually checks.

## Running it

- `npm run test:e2e` — the normal run: chromium, then firefox, sequentially
  (see "Concurrency" below for why not in parallel).
- `npm run test:e2e:password-reset` — `tests/user/password-reset.spec.ts`
  only. It temporarily changes `Test User`'s password, which every other
  `userPage`-fixture test depends on being fixed, so it's excluded from the
  runs above and must be run alone.
- `npx playwright test tests/admin/work.spec.ts` — any single file/dir.

Each run's `globalSetup` (`tests/global-setup.ts`) clones `suomisf_test`
fresh from the dev DB, seeds `Test Admin`/`Test User`, builds the frontend,
and starts a throwaway backend (`:5001`) + frontend (`:3100`) — your normal
dev servers on `:3000`/`:5000` are never touched.

## Fixtures (`tests/fixtures/auth.ts`)

- `userPage` / `adminPage` — pre-authenticated pages (API login +
  `localStorage` injection, not the login form) for `Test User` / `Test Admin`.
- Plain `page` (from `@playwright/test` directly) — anonymous, or used by
  the two specs that need to drive the real login form.

## `tests/anon/` — anonymous, read-only

| Spec | Route | Checks |
|---|---|---|
| `example.spec.ts` | `/` | Homepage loads, title is set. |
| `people.spec.ts` | `/people` | Table loads, columns present, total count sane, a known row's exact cell contents. |
| `award.spec.ts` | `/awards/27` | Apollo award page: exact historical winner list (11 rows). |
| `awards.spec.ts` | `/awards` | List page loads. |
| `bookseries.spec.ts` | `/bookseries/:id` | Series page loads with data. |
| `pubseries.spec.ts` | `/pubseries/:id` | Series page loads with data. |
| `publishers.spec.ts` | `/publishers` | List page loads with data. |
| `magazine.spec.ts` | `/magazines/6` | Alienisti: header fields, cover count / issue-link count match the page's own reported total (not hardcoded), every issue link matches `n/YYYY` format with a sane year. |
| `magazines.spec.ts` | `/magazines` | List page loads. |
| `changes.spec.ts` | `/changes` | Audit log table loads and paginates. |
| `faq.spec.ts` | `/faq` | Page loads with content. |
| `tags.spec.ts` | `/tags` | All category headings present, specific tag names found within their category with a sane count. |
| `tag.spec.ts` | `/tags/521` | "dystopia" tag: description, Teokset/Novelleja/Artikkeleita headings, a known linked work's author heading (large tag, 300+ works — rendering-scale check). |
| `work.spec.ts` | `/works/63` | Title/author headings, genres/tags sections, and the "Myös teoksessa" omnibus relation (exercises the `part_of` sort fixed earlier this project). |
| `edition.spec.ts` | `/editions/1731` | `/editions/:id` shares `WorkPage` with `/works/:id` but loads via the parent work and highlights the requested edition — checks exactly one `.highlighted-edition`. |
| `short.spec.ts` | `/shorts/4985` | Title/author, and a short with 20 translators all rendered (exercises `remove-duplicate-contributions.ts`). |
| `nonfiction.spec.ts` | `/nonfiction` | List view loads; switching to "Kannet" lazy-loads cover images (`cover-image-list.tsx`). |
| `stats.spec.ts` | `/stats` | Every tab renders a chart `<canvas>`, no console errors. |
| `latest.spec.ts` | `/latest` | Page loads with entries — deliberately doesn't assert specific titles, since "latest" is inherently a moving target. |
| `bookindex.spec.ts` | `/bookindex` | Page loads, an alphabet-letter filter (A–Ö buttons) returns matching results. |
| `shortstoryindex.spec.ts` | `/shortstoryindex` | Page loads, a real author-name search returns results. |

## `tests/user/` — logged-in regular user (`Test User`)

| Spec | What it does |
|---|---|
| `smoke.spec.ts` | Logs in via the fixture, confirms the nav shows the username and no "Ylläpito" (admin) menu. |
| `auth.spec.ts` | Three cases: wrong password on the real `/login` form shows an inline error with no console error; correct credentials on the real form log the user in; logout (via the `userPage` fixture, then driving the nav's "Kirjaudu ulos" menu item) clears `localStorage` and the username disappears from the nav. |
| `no-admin-ui.spec.ts` | On a work page and a magazine page, confirms no `.fixed-dial` (admin SpeedDial) and no "Ylläpito" text anywhere. |
| `ownership.spec.ts` | Marks an edition owned via the `Rating` widget on `/works/63`, confirms it appears under the profile's "Omistetut" tab. |
| `read-status.spec.ts` | Marks a work read+liked via the thumbs `SelectButton` on `/works/2`, confirms it appears under "Luetut". |
| `profile.spec.ts` | After owning a book, confirms the profile's "Tilastoja" tab renders a chart and "Kokoelman arvo" dialog opens without error. |
| `suggestion.spec.ts` | Walks the `/suggestions` stepper by skipping every step, confirms it reaches results. |
| `password-reset.spec.ts` | Full forgot/reset-password cycle without email: drives `/forgot-password` for real, mints a valid reset token via the backend's `mint_reset_token.py` (the token is a deterministic signed hash, not something that needs to be emailed), resets the password, logs in with it, then resets back to the original so it doesn't break other specs. Run separately (see above) — the password change would otherwise race every other `userPage`-fixture test. |

## `tests/admin/` — logged-in admin (`Test Admin`)

Each of these creates data named `E2E_TEST_...` for debuggability. No
cleanup logic is needed — the whole `suomisf_test` clone is dropped and
rebuilt before the next run.

| Spec | What it does |
|---|---|
| `smoke.spec.ts` | Logs in as admin, confirms the "Ylläpito" menu is visible. |
| `work.spec.ts` | Full create → edit → delete cycle for a Work via the page SpeedDial, including filling a required contributor. |
| `edition.spec.ts` | Create an edition under an existing work, verify `edition-owners-panel.tsx` only appears once a *different* user (via a direct API call as `Test User`) owns it, then edit and delete. |
| `person.spec.ts` | Create → edit → delete a person. |
| `publisher.spec.ts` | No "create" UI exists for publishers — edit + delete only, on a publisher pre-verified (direct DB query) to have zero linked editions/magazines/series. |
| `pubseries.spec.ts` | Same pattern as publisher: no create UI, edit + delete on a linkage-free series. |
| `award.spec.ts` | No "create new award" UI — adds and removes an award-*winner* entry (a work receiving the Hugo) via the work page's "Palkinnot" dialog. |
| `bookseries.spec.ts` | Full create → edit → delete cycle. |
| `magazine.spec.ts` | Two tests: (1) create a magazine and add an issue to it — not deleted afterward, since a magazine with issues genuinely can't be deleted (FK constraint) and the UI doesn't disable "Poista" for that case; (2) create-then-delete a magazine that has no issues, to still cover the delete path cleanly. Edit is not covered — see the `test.fail()` entry below. |
| `short.spec.ts` | Creates a new short story via the work page's "Muokkaa novelleja" picker dialog's nested "Uusi" form, then attaches it to the work. |
| `tag.spec.ts` | No "create" UI — rename + delete on a tag pre-verified to have zero linked works/stories/articles. |
| `changes-audit.spec.ts` | Creates a work, then confirms a matching `Uusi`-action entry by `Test Admin` appears via `GET /api/changes`. |
| `magazine.spec.ts` → `test.fail(...)` | **Known, unresolved bug**, not a real test: editing a magazine fails at the network layer (`net::ERR_FAILED` on the PUT). `test.fail()` means Playwright reports this test as failing *if it ever starts passing* — that's the signal that someone fixed `magazine-form.tsx`'s edit path. |

## Coverage gaps

- `/issues/:id` has no dedicated anon spec (only reached indirectly via
  `magazine.spec.ts`'s links).
- `kirjasampo-tag-import.tsx` (importing tags from Kirjasampo) isn't
  covered — it depends on a live external service, so it was skipped
  rather than mocked.
- Award-winner *ISFDB* import has no frontend UI yet at all (still
  design-stage per project memory), so there's nothing to test.

## Concurrency

`playwright.config.ts` caps `workers` at 8 and runs chromium/firefox as two
sequential `playwright test` invocations rather than one concurrent run.
The E2E backend runs with `--workers 16` (tuned up from gunicorn's default
of 1 across this project). At these settings the suite is 43-44/44 stable
per run; the residual occasional flake is `ownership.spec.ts` or
`profile.spec.ts` timing out mid-`Rating`-widget interaction under load —
a re-run resolves it. See the git log for the tuning history if this
degrades again as more specs get added.
