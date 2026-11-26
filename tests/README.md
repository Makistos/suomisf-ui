# E2E test suite

Playwright specs covering anonymous, logged-in-user, and admin flows against
a disposable test database restored from the backend's golden dump (see
`../suomisf/tests/TEST_DOCUMENTATION.md`, "Test data (golden dump)"). See `../TEST_PLAN.md` for the design
rationale; this file documents what each spec actually checks.

## Running it

- `npm run test:e2e` — the normal run: chromium, then firefox, sequentially
  (see "Concurrency" below for why not in parallel).
- `npm run test:e2e:password-reset` — `tests/user/password-reset.spec.ts`
  only. It temporarily changes `Test User`'s password, which every other
  `userPage`-fixture test depends on being fixed, so it's excluded from the
  runs above and must be run alone.
- `npx playwright test tests/admin/work.spec.ts` — any single file/dir.

Each run's `globalSetup` (`tests/global-setup.ts`) restores `suomisf_test`
from the golden dump (never the live dev DB), seeds `Test Admin`/`Test User`, builds the frontend,
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
| `tags.spec.ts` | `/tags` | All category headings present, each listing tags with a sane count. No tag names are checked: editors move tags between categories. |
| `tag.spec.ts` | `/tags/521` | "dystopia" tag: description, Teokset/Novelleja/Artikkeleita headings, a known linked work's author heading (large tag, 300+ works — rendering-scale check). "eurooppa" (`/tags/937`) lists its suggested similar tags, 12 and the rest behind "+"; "jännitys" (`/tags/445`) shows the section and the option below only if the API lists similar tags for it. "Näytä myös samankaltaisten asiasanojen teokset" on "eurooppa" lists more works, its own among them, each once, with the tags each matched. |
| `work.spec.ts` | `/works/63` | Title/author headings, genres/tags sections, and the "Myös teoksessa" omnibus relation (exercises the `part_of` sort fixed earlier this project). |
| `edition.spec.ts` | `/editions/1731` | `/editions/:id` shares `WorkPage` with `/works/:id` but loads via the parent work and highlights the requested edition — checks exactly one `.highlighted-edition`. |
| `short.spec.ts` | `/shorts/4985` | Title/author, and a short with 20 translators all rendered (exercises `remove-duplicate-contributions.ts`). |
| `nonfiction.spec.ts` | `/nonfiction` | List view loads; switching to "Kannet" lazy-loads cover images (`cover-image-list.tsx`). |
| `stats.spec.ts` | `/stats` | Overview tiles and every chart tab render, no console errors; the edition, work, people, content, publisher, story, magazine and award cards appear; the public Kattavuus tab shows its meters and the decades filter retitles the page-count card; the open tab is kept in `?tab=`; Kävijät/Käynnit hidden from visitors. |
| `stats-filters.spec.ts` | `/stats` | Henkilöt tab: changing the role filter refetches the top-people table for books and stories (translators are listed), and Kaikki counts books and stories together; first editions regroup by publisher and by genre; a publisher heatmap cell opens a list of works. |
| `not-found.spec.ts` | missing ids, unknown route | A missing work, person or tag (the API answers 404, 400 and 200-with-`{}` respectively) and an unknown route each show their not-found heading and a link home, within 10 s (no retry delay on 4xx). |
| `issue.spec.ts` | `/issues/:id` | Opens an Alienisti issue, steps Seuraava → Edellinen; the heading follows each step. |
| `in-place-navigation.spec.ts` | `/works/63`, `/people/1429` | Following a link to another item of the same type (work → omnibus; pseudonym "Outsider" → real person → back) replaces the content — the page component stays mounted, so this catches effects that don't re-run on the new id. |
| `latest.spec.ts` | `/latest` | Page loads with entries — deliberately doesn't assert specific titles, since "latest" is inherently a moving target. |
| `bookindex.spec.ts` | `/bookindex` | Page loads, an alphabet-letter filter (A–Ö buttons) returns matching results. |
| `shortstoryindex.spec.ts` | `/shortstoryindex` | Page loads, a real author-name search returns results. |
| `search.spec.ts` | `/` | Main-menu search: a title search ("Vain nimet" on, the default) gives one hit and opens the work; turning "Vain nimet" off widens the results and is remembered across a reload; a name search opens the person. Enter in the search bar opens `/search` with every hit (more than the 50 suggestions) grouped by type with jump links, the pending suggestions don't pop up over it, and a hit opens its page; the page's own "Vain nimet" toggle refetches; Enter on a too short term or on a highlighted suggestion doesn't open the page. |
| `work-history.spec.ts` | `/works/3` | "Muutoshistoria" tab lists changes; an update row expands into field/old value rows; no delete column for visitors. |
| `person-version.spec.ts` | `/people/2435`, `/people/191` | Visitors get the current person page: no switch button, and Shift+U does nothing even with an admin's choice left in `localStorage`. Bugs fixed on the current page: Le Guin's roles leave out Tietokirjailija (she only appears in a non-fiction book); J. Pekka Mäkelä's article "Hylyntyhjentäjien laulu" (Esiintyy and Kirjoittaja) is listed under Kirjoittaja; a link row without an address (injected with `page.route`) isn't rendered. |
| `work-version.spec.ts` | `/works/3984` | Visitors get the current work page: no switch button, and Shift+U does nothing even with an admin's choice left in `localStorage`. Bug fixed on the current page: the series arrows follow the series order (Hain-sarja by original years: Harhakaupunki before, Maailma, vihreä metsä after), not the database order. |
| `front-version.spec.ts` | `/` | Visitors get the current front page: no switch button, and Shift+U does nothing even with an admin's choice left in `localStorage`. |
| `short-version.spec.ts` | `/shorts/714` | Visitors get the current short story page: no switch button, and Shift+U does nothing even with an admin's choice left in `localStorage`. |
| `bookindex-version.spec.ts` | `/bookindex` | Visitors get the current book index ("Kirjatietokanta"): no switch button, and Shift+U does nothing even with an admin's choice left in `localStorage`. |
| `person-tabs.spec.ts` | `/people/368` | Johanna Sinisalo's tabs: edited books (edition list), short stories, series, magazine issues, awards. |
| `register.spec.ts` | `/` | Registering through the account menu logs the new user in, and the password and tokens never reach the browser console; mismatched passwords block the request; the account menu's "Kirjaudu"/"Rekisteröidy" labels are visible text (not only accessible names); the register dialog closes from its close button. |
| `front-page-popups.spec.ts` | `/` | "Bibliografiasta löytyy" covers (`ImageAccordion`): on a touch screen the first tap opens the panel, a tap on the panel's cover opens the edition and a tap outside closes it; mouse hover opens and leaving closes; Tab goes from cover to cover with each panel open and Enter opens the edition. |
| `work-description.spec.ts` | `/works/6790`, `/works/53` | A long description is clipped and opens/closes by clicking it or "Näytä vähemmän" (`CollapsibleHtml`); a short one has no button. |
| `a11y.spec.ts` | 25 page types + register dialog | axe (WCAG 2.1 A/AA) finds no violations; see "Accessibility checks" below. `/tags` (~4000 tags) gets triple the time: axe alone can take over 30 s on it in Firefox. |
| `sanitize.spec.ts` | `/awards/27` | A description with a script, an `onerror` handler and a `javascript:` link (injected with `page.route`) renders its text but runs nothing (`safeHtml`, `src/utils/safe-html.ts`). |

## `tests/user/` — logged-in regular user (`Test User`)

| Spec | What it does |
|---|---|
| `person-version.spec.ts` | A regular user gets the current person page, no switch button, and Shift+U does nothing. |
| `work-version.spec.ts` | A regular user gets the current work page, no switch button, and Shift+U does nothing. |
| `front-version.spec.ts` | A regular user gets the current front page, no switch button, and Shift+U does nothing. |
| `short-version.spec.ts` | A regular user gets the current short story page, no switch button, and Shift+U does nothing. |
| `bookindex-version.spec.ts` | A regular user gets the current book index, no switch button, and Shift+U does nothing. |
| `smoke.spec.ts` | Logs in via the fixture, confirms the nav shows the username and no "Ylläpito" (admin) menu. |
| `auth.spec.ts` | Three cases: wrong password on the real `/login` form shows an inline error with no console error; correct credentials on the real form log the user in (and nothing with the password or tokens is logged to the console); logout (via the `userPage` fixture, then driving the nav's "Kirjaudu ulos" menu item) clears `localStorage` and the username disappears from the nav. |
| `no-admin-ui.spec.ts` | On a work page and a magazine page, confirms no `.fixed-dial` (admin SpeedDial) and no "Ylläpito" text anywhere. |
| `ownership.spec.ts` | Marks an edition owned via the `Rating` widget on `/works/63`, confirms it appears under the profile's "Omistetut" tab. |
| `read-status.spec.ts` | Marks a work read+liked via the thumbs `SelectButton` on `/works/2`, confirms it appears under "Luetut". |
| `profile.spec.ts` | After owning a book, confirms the profile's "Tilastoja" tab renders a chart and "Kokoelman arvo" dialog opens without error. |
| `admin-page-access.spec.ts` | `/admin` shows "Ei käyttöoikeutta" and none of the tools to a regular user and to an anonymous visitor; the profile page no longer has the "Satunnainen keskeneräinen teos" search. |
| `suggestion.spec.ts` | Walks the `/suggestions` stepper by skipping every step, confirms it reaches results. |
| `a11y.spec.ts` | axe on a work page and the profile, logged in. |
| `password-reset.spec.ts` | Full forgot/reset-password cycle without email: drives `/forgot-password` for real, mints a valid reset token via the backend's `mint_reset_token.py` (the token is a deterministic signed hash, not something that needs to be emailed), resets the password, logs in with it, then resets back to the original so it doesn't break other specs. Run separately (see above) — the password change would otherwise race every other `userPage`-fixture test. |

## `tests/admin/` — logged-in admin (`Test Admin`)

Each of these creates data named `E2E_TEST_...` for debuggability. No
cleanup logic is needed — the whole `suomisf_test` database is restored
from the golden dump again before the next run.

| Spec | What it does |
|---|---|
| `smoke.spec.ts` | Logs in as admin, confirms the "Ylläpito" menu is visible. |
| `work.spec.ts` | Full create → edit → delete cycle for a Work via the page SpeedDial, including filling a required contributor. |
| `edition.spec.ts` | Create an edition under an existing work, verify `edition-owners-panel.tsx` only appears once a *different* user (via a direct API call as `Test User`) owns it, then edit and delete. |
| `person.spec.ts` | Create → edit → delete a person. |
| `person-new.spec.ts` | The new person page under trial (`src/features/person/new/`), the checks it must keep passing to become the default: the switch button and Shift+U swap the pages, the choice stays across people and reloads, and the hotkey does nothing while typing; Le Guin's record (no second name line, roles without Tietokirjailija, "30 kirjaa, 39 painosta, 80 novellia ja artikkelia, 35 palkintoa"), tab counts, no publication graph; the description closed behind "Näytä kuvaus" (aria-expanded, Enter, focus stays, source line); all seven of Anne Leinonen's tabs visible without scrolling the tab bar; Henkilöstä lists books and articles apart; an old link with `vuosi` still filters the list and its chip clears it; type and name filters with the URL and Tyhjennä; pen names (King's Richard Bachman with "nimellä" rows, Erin Hunter's eight writers); the role row only with several roles (Mäkelä); Kannet; a one-cover person (sentence, heading instead of tabs); the admin pencil's work dialog; the phone layout and filter sheet; the page background matches the site's in light and dark; books sorted by title by default, and the sort dropdown shows its value and changes to original year (decade groups) without crashing; King's "Tekijä" row (own name 75, Richard Bachman 2, three collaborations) filters to Bachman's two books with `tekija` and Tyhjennä clears it; Anne Leinonen's books grouped by credit (own name 14, then each collaboration) with "yhdessä Eija Lappalainen" on the rows, and in her stories her three pen names and the collaborations folded into "Yhdessä muiden kanssa 23"; an owned book (owners injected with `page.route`) is marked before its title; Cherith Baldry's books under the shared Erin Hunter pen name are hers only (Kate Cary's *Aamunkoi* isn't listed, Teokset under 94); an admin's visit to a person with no image record (James W. Kunetka) looks for a picture, shows it with its credit, says "Kuva lisätty" and saves the picture and the Commons link (lookup and saves answered with `page.route`); no lookup for "Ei kuvaa" (Barry Unsworth), and "Kuvia ei löytynyt" when nothing is found (Eugène Sue); axe with the description closed and open. |
| `work-new.spec.ts` | The new work page under trial (`src/features/work/new/`), the checks it must keep passing to become the default: the switch button and Shift+U, kept apart from the person page's choice; Le Guin's record (original title, then the facts in order: Alkuteos "englanti, 1969", type, genre, Alalaji, Hugo and Nebula, "4/9 alkuteosten ilmestymisjärjestyksessä" with the neighbours by name, the printings summary); the other subject headings and the description closed behind one "Asiasanat ja kuvaus" button (subject headings first; aria-expanded, aria-controls, Enter, focus stays), no shelf, and the printings on the first screen at 1,400 × 900 for Le Guin and Tolkien, Tolkien's note as a Lisätietoja row; printings grouped by laitos by default with a clean URL, "Samanlaiset yhdessä" written to the URL; a title with a long word (Tapahtumapaikkana Duma Key, Houkutus: kymmenvuotisjuhlakirja) stays in its column on desktop and phone; a single cover (Tuulen tavoittelua): table cover at least 44 px wide, header and table covers opening the original file at full size from "Suurenna kuva", no gallery and no picker; several covers: Le Guin's header cover and its "2 kantta" link open a gallery of both covers with their printings, the original files and thumbnails; Tolkien's 2. painos row (two covers) and first laitos row (18 covers) open galleries of their own covers, a one-cover row keeps "Suurenna kuva"; an admin picks the main cover of *Matka alkaa* (552), it is stored (reload) and *Oletus* restores the first; a failed save shows an alert and leaves the cover; a merged row opens into 17 printings with their own controls and the page makes one ownership request, none per printing; grouping in the URL across reload and back, and the device's last choice on the next work; `/editions/:id` picks that printing; the Kirja column and ⋯ menu (with Novellit ja artikkelit for a collection) in the site's content column; a work with little data (no button); the history dialog; the phone layout (Tolkien and Le Guin: no sideways scroll, the facts under the cover, author and title together, the translator cell full width; the order record, Asiasanat ja kuvaus, printings); the site's background; axe with the block closed and open. |
| `front-new.spec.ts` | The new front page under trial (`src/features/front/new/`): the switch button and Shift+U, kept apart from the other pages' choices; the search opens `/search?q=…&titles=1` and shares "Vain nimet" with the menu search; the holdings sentence with four links; the catalogue card swaps picks without moving the page and "Arvo uudet" draws a new set; eight latest additions with titles, ten ways in, Kirjaehdotukset in the same tab; a failed random pick request shows its own error while the rest loads; books without a cover, or whose images fail to load, show the same cloth binding on the shelf, in the card and in its thumbnails, and the pick keeps its title; the phone layout fits (several random sets, and before the counts load) with the short placeholder; the site's background; axe. |
| `short-new.spec.ts` | The new short story page under trial (`src/features/short/new/`): the switch button and Shift+U, kept apart from the other pages' choices; Poe's *Kielivä sydän* (record, "3 kirjaa, 4 painosta", one row per book with printing years linking to `/editions/:id`, editors with "(toim.)"); all four translations oldest first with the current one marked and the others linked, and the admin's original-year note (1843 / 1850); Le Guin's *Jotka Omelasista poistuvat* (a book and a magazine in one list, the Hugo, no translations table); an owned printing (owners injected with `page.route`) marked before its year; covers that fail to load show the cloth binding; the SpeedDial in the bottom right corner with Muokkaa, Palkinnot and Poista (cancelled); the phone layout with translations as cards; the site's background; axe. |
| `bookindex-new.spec.ts` | The new book index under trial (`src/features/work/bookindex/`, `GET /api/bookindex`): the switch and Shift+U, kept apart from the other pages' choices; every work listed before any search, grouped by author and 200 a page by default (neither in the URL), with the total in the header and the paging line; text fields search on Enter, land in the URL and survive reload and back (Le Guin's row: "(The Left Hand of Darkness, 1969)" after the title, no images in the rows, series link, "Suom. Kalevi Nyytäjä. WSOY 1976. Sci-fi -sarja." on the first line, then "2. painos: WSOY 1986. Best Seller." and "3. painos: WSOY 1992." each on its own line; a single printing has only the first line); Stoker's *Kammoittava kreivi*: exactly the owner's six printing lines, each laitos with its own translators ("2. laitos: Dracula. Suom. Jarkko Laine. Otava 1977.", the 3. laitos last with two translators), reprints that differ only by number and year left out (the rule's other cases, Hobitti's 4. laitos and translators in another order, are unit tests on the dev data in `bookindex-state.test.ts`), and such a reprint shown with its mark when the reader owns it (injected with `page.route`); the reader's own printings marked on their own printing's line (star, bookmark; injected with `page.route`); grouped rows leave out the author and ungrouped rows (`ryhmittely=ei`) start with "Author: Title" and link the author; type and genre chips, the letter bar (one page, under 3 s) and the nationality select update at once, Tyhjennä clears; typing is kept when a chip is clicked; year ranges for the original and any printing; next page (201–400), rows per page (back to page 1), sort newest first, turning grouping off, no Lista/Kannet switch; no results with "Tyhjennä rajaukset"; a failed request with retry; the phone layout (two fields, "Lisää rajauksia" opens the rest, no sideways scroll); the site's background; axe. |
| `identity-dial.spec.ts` | The admin SpeedDial on the new person, work and short story pages matches the current page's: fixed in the bottom right corner, the same button size, the theme's colours on its action buttons (not the identity's link blue). |
| `publisher.spec.ts` | No "create" UI exists for publishers — creates an unlinked publisher through the API, then edits and deletes it in the UI (every existing publisher has editions, magazines or series). |
| `pubseries.spec.ts` | Same pattern as publisher: no create UI, edit + delete on a linkage-free series. |
| `award.spec.ts` | No "create new award" UI — adds and removes an award-*winner* entry (a work receiving the Hugo) via the work page's "Palkinnot" dialog. |
| `bookseries.spec.ts` | Full create → edit → delete cycle. |
| `magazine.spec.ts` | Three tests: (1) create a magazine and add an issue to it — not deleted afterward, since a magazine with issues genuinely can't be deleted (FK constraint) and the UI doesn't disable "Poista" for that case; (2) create-then-delete a magazine with no issues, checking the "Lehti poistettu" toast; (3) edit a magazine that has no publisher (used to crash the backend: the form sends `publisher: null`). |
| `short.spec.ts` | Creates a new short story via the work page's "Muokkaa novelleja" picker dialog's nested "Uusi" form, then attaches it to the work. |
| `tag.spec.ts` | No "create" UI — a tag is created through the API (so it has no links whatever the copied data holds), renamed, then deleted. |
| `shorts-picker.spec.ts` | Opens the "Muokkaa novelleja" picker on a 5-story collection, searches a person, adds one of their stories to the list (6 items), closes without saving. |
| `changes-audit.spec.ts` | Creates a work, then confirms a matching `Uusi`-action entry by `Test Admin` appears via `GET /api/changes`. |
| `pricing.spec.ts` | On `/works/10` (one edition): the "Hinnat" picker links a shop product, fetches its price and saves it, and the price shows in the edition's price dialog — the shop search and price fetch are answered by `page.route`, never the real shops; a price added by hand in the edition price dialog is listed. |
| `omnibus.spec.ts` | Adds a work to an omnibus (`/works/11`) through "Muokkaa kokoomateosta", with an explanation; checks "Sisältää teokset", then removes it again. |
| `site-stats.spec.ts` | `/stats` admin tabs: "Kävijät" charts render; the "Käynnit" page view log filters by path. |
| `award-admin.spec.ts` | Creates a domestic award from `/awards` (listed under Kotimaiset) and renames it on its page; imports winners into Sidewise from a preview answered by `page.route` (sfadb.com is down) — only the new entry is pre-selected and saved, and the work appears among the winners. |
| `kirjasampo-import.spec.ts` | On `/works/5`: the import preview (answered by `page.route`) lists tags grouped by section; a new tag's type defaults by section (Toimija under "Henkilöt, toimijat") and is picked (and follows to the same name in another section), an existing tag shows its type and a check mark in the "Teoksessa" column, one tag is skipped; the posted items, the new tag's type and the tags on the work are checked. Saving sets `kirjasampo_imported`, and "Tuotu Kirjasammosta <date>" shows to the admin but not to an anonymous visitor. On `/works/19` one tag is skipped for this work only ("Ohita tästä"; nothing is stored, and "Ohita aina" disables it), and an existing tag and a typed new one are added by hand under "Lisätyt". On `/works/6` every tag is skipped and on `/works/56` (no tags) the preview is empty; "Merkitse tuoduksi" still records the import date, which then shows on a work without tags. |
| `tag-similar.spec.ts` | On a new tag's page (two tags made through the API and deleted afterwards), the Muokkaa dialog's "Samankaltaiset asiasanat" adds the other tag ("Liittyvä, lisätty käsin"), the page lists it, and removing it empties the list. |
| `admin-tools.spec.ts` | `/admin` (opened from Ylläpito → Ylläpitotyökalut): the incomplete-work search with "Kuvaus" lists works that have no description; the Kirjasampo search lists works with a Kirjasampo link and no import date (both checked via the API); on "Teosten linkkien lähteet" a mistyped source (links added to work 21, or 22 in Firefox, through the API) is expanded, combined into the right one and then deleted with its links — the work's other links stay, the change is in its history, and its links are put back afterwards. On "Samankaltaiset asiasanat" each view button shows its count, the Asiasanat column sorts in Finnish order both ways, and the first suggested duplicate pair of the copied job results (the second in Firefox) is dismissed, shows under Hylätyt with Test Admin as the dismisser, and is restored. Another pair (the third, or fourth in Firefox) is marked related, then back a duplicate. A fifth (sixth) is marked checked, hidden with "Piilota tarkistetut", and unmarked. |
| `a11y.spec.ts` | axe on the admin work page (SpeedDial), the work and new-edition dialogs, and the person form. |

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
(96/96 in both browsers, 2026-10-05); the residual occasional flake is `ownership.spec.ts` or
`profile.spec.ts` timing out mid-`Rating`-widget interaction under load —
a re-run resolves it. See the git log for the tuning history if this
degrades again as more specs get added.

## Accessibility checks

`expectAccessible(page, { include? })` (`tests/fixtures/axe.ts`) runs axe
with the WCAG 2.1 A and AA rules on the page as it is (after animations
finish) and fails on any violation, listing rule, element and markup.
Use it in new specs for new pages and dialogs. Two documented exceptions:

- PrimeReact's Menubar puts `aria-level` on menu items, and Quill's
  editor pickers have no names: library markup, filtered by exact match.
- `link-in-text-block` is off: links inside text lines (e.g. the publisher
  in "Otava 1990") differ from the text by colour only (1.1:1 where WCAG
  wants 3:1), because links have no resting underline. Open decision.

Most fixes are global, in `src/App.tsx`: Finnish `aria` labels and `close`
in the PrimeReact locale (PrimeReact's own locales lack `close`,
`expandLabel`, `collapseLabel`, `selectLabel`, `unselectLabel`), and
`PrimeReact.pt` defaults that name spinners, the SpeedDial button, dialog
maximise buttons and icon-only buttons with a tooltip.

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

2026-10-05: 69.9 % of lines, 65.7 % of functions, 54.9 % of branches
(was 58.6 / 53.0 / 44.5 before the search, history, person tab, pricing,
omnibus, site stats, registration, award and import specs).
