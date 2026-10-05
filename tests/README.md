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

## Fixtures (`tests/fixtures/`)

- `userPage` / `adminPage` (`auth.ts`) — pre-authenticated pages (API login +
  `localStorage` injection, not the login form) for `Test User` / `Test Admin`.
- Plain `page` (`guard.ts`) — anonymous, or used by the two specs that need
  to drive the real login form.
- All three are guarded by `guardPage()` (`guard.ts`): a test fails on any
  uncaught page error or unhandled rejection, React's "Maximum update depth
  exceeded", or the same API request (method + URL + body) 15 times within
  5 s — the signature of an effect re-running endlessly. Import `test` from
  `../fixtures/guard` (or `../fixtures/auth`), not `@playwright/test`, so new
  specs get it too.

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
| `stats-filters.spec.ts` | `/stats` | Changing the role filter on the Teokset and Novellit tabs' top-people tables refetches and re-renders (header and rows follow the new role). |
| `not-found.spec.ts` | missing ids, unknown route | A missing work, person or tag (the API answers 404, 400 and 200-with-`{}` respectively) and an unknown route each show their not-found heading and a link home, within 10 s (no retry delay on 4xx). |
| `issue.spec.ts` | `/issues/:id` | Opens an Alienisti issue, steps Seuraava → Edellinen; the heading follows each step. |
| `in-place-navigation.spec.ts` | `/works/63`, `/people/1429` | Following a link to another item of the same type (work → omnibus; pseudonym "Outsider" → real person → back) replaces the content — the page component stays mounted, so this catches effects that don't re-run on the new id. |
| `latest.spec.ts` | `/latest` | Page loads with entries — deliberately doesn't assert specific titles, since "latest" is inherently a moving target. |
| `bookindex.spec.ts` | `/bookindex` | Page loads, an alphabet-letter filter (A–Ö buttons) returns matching results. |
| `shortstoryindex.spec.ts` | `/shortstoryindex` | Page loads, a real author-name search returns results. |
| `search.spec.ts` | `/` | Main-menu search: a title search ("Vain nimet" on, the default) gives one hit and opens the work; turning "Vain nimet" off widens the results and is remembered across a reload; a name search opens the person. |
| `work-history.spec.ts` | `/works/3` | "Muutoshistoria" tab lists changes; an update row expands into field/old value rows; no delete column for visitors. |
| `person-tabs.spec.ts` | `/people/368` | Johanna Sinisalo's tabs: edited books (edition list), short stories, series, magazine issues, awards. |
| `register.spec.ts` | `/` | Registering through the account menu logs the new user in, and the password and tokens never reach the browser console; mismatched passwords block the request. |

## `tests/user/` — logged-in regular user (`Test User`)

| Spec | What it does |
|---|---|
| `smoke.spec.ts` | Logs in via the fixture, confirms the nav shows the username and no "Ylläpito" (admin) menu. |
| `auth.spec.ts` | Three cases: wrong password on the real `/login` form shows an inline error with no console error; correct credentials on the real form log the user in (and nothing with the password or tokens is logged to the console); logout (via the `userPage` fixture, then driving the nav's "Kirjaudu ulos" menu item) clears `localStorage` and the username disappears from the nav. |
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
| `magazine.spec.ts` | Three tests: (1) create a magazine and add an issue to it — not deleted afterward, since a magazine with issues genuinely can't be deleted (FK constraint) and the UI doesn't disable "Poista" for that case; (2) create-then-delete a magazine with no issues, checking the "Lehti poistettu" toast; (3) edit a magazine that has no publisher (used to crash the backend: the form sends `publisher: null`). |
| `short.spec.ts` | Creates a new short story via the work page's "Muokkaa novelleja" picker dialog's nested "Uusi" form, then attaches it to the work. |
| `tag.spec.ts` | No "create" UI — rename + delete on a tag pre-verified to have zero linked works/stories/articles. |
| `shorts-picker.spec.ts` | Opens the "Muokkaa novelleja" picker on a 5-story collection, searches a person, adds one of their stories to the list (6 items), closes without saving. |
| `changes-audit.spec.ts` | Creates a work, then confirms a matching `Uusi`-action entry by `Test Admin` appears via `GET /api/changes`. |
| `pricing.spec.ts` | On `/works/10` (one edition): the "Hinnat" picker links a shop product, fetches its price and saves it, and the price shows in the edition's price dialog — the shop search and price fetch are answered by `page.route`, never the real shops; a price added by hand in the edition price dialog is listed. |
| `omnibus.spec.ts` | Adds a work to an omnibus (`/works/11`) through "Muokkaa kokoomateosta", with an explanation; checks "Sisältää teokset", then removes it again. |
| `site-stats.spec.ts` | `/stats` admin tabs: "Kävijät" charts render; the "Käynnit" page view log filters by path. |
| `award-admin.spec.ts` | Creates a domestic award from `/awards` (listed under Kotimaiset) and renames it on its page; imports winners into Sidewise from a preview answered by `page.route` (sfadb.com is down) — only the new entry is pre-selected and saved, and the work appears among the winners. |
| `kirjasampo-import.spec.ts` | On `/works/5`: Kirjasampo tags (answered by `page.route`) list without the author section, with "(luokka)" stripped and a film list turned into "elokuva"; one tag is skipped, the rest imported and shown on the work. |

## Coverage gaps

- External services (shops, Kirjasampo, award sources) are never called:
  `pricing`, `kirjasampo-import` and `award-admin` answer those requests
  with `page.route`. The face-detection image picker (face-api.js, to be
  replaced) has no test.
- `npm run test:e2e:coverage` (below) shows what else no test reaches.
- Award-winner *ISFDB* import has no frontend UI yet at all (still
  design-stage per project memory), so there's nothing to test.

## Concurrency

`playwright.config.ts` caps `workers` at 8 and runs chromium/firefox as two
sequential `playwright test` invocations rather than one concurrent run.
The E2E backend runs with `--workers 16` (tuned up from gunicorn's default
of 1 across this project). At these settings the suite is stable per run
(65/65 in both browsers, 2026-10-05); the residual occasional flake is `ownership.spec.ts` or
`profile.spec.ts` timing out mid-`Rating`-widget interaction under load —
a re-run resolves it. See the git log for the tuning history if this
degrades again as more specs get added.

## Frontend coverage from the E2E run

```bash
npm run test:e2e:coverage     # Chromium, 4 workers
```

Builds the E2E frontend with Istanbul counters (`vite-plugin-istanbul`,
only when `E2E_COVERAGE` is set) and collects `window.__coverage__` from
every test page (`tests/fixtures/coverage.ts`); monocart-coverage-reports
writes `coverage/e2e/index.html` plus `coverage-summary.json` and prints a
summary. Every `src/` file is listed, those no test loads at 0 %. Normal
E2E runs are not instrumented.

Each page load has its own counters, which disappear with it, so the
fixture hands them over on `beforeunload` (through a raw CDP binding:
Playwright's `exposeFunction` and Chromium's `pagehide`/`unload` both drop
the call) and again when the test ends. Chromium's built-in V8 coverage
can't be used for this: it only reports scripts of the page that is
loaded when it is read, so a test that ends on another page loses
everything before it.

2026-10-05: 68.0 % of lines, 63.1 % of functions, 53.2 % of branches
(was 58.6 / 53.0 / 44.5 before the search, history, person tab, pricing,
omnibus, site stats and registration specs).
