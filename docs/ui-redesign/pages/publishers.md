# Publishers

**Routes:** `/publishers` (list) and `/publishers/:id` · **Code:** `src/features/publisher/routes/publisher-list-page.tsx`, `publisher-page.tsx`,
`src/features/edition/components/edition-list.tsx`, `src/features/pubseries/components/pubseries-list.tsx`; backend `GET /api/publishers`, `/api/publishers/:id`
**Status:** Agreed; the list and the publisher page implemented as admin-only trials in identity style (2026-11-26) · **Updated:** 2026-11-26
**Samples:** the list (507 publishers), WSOY (2,263 editions, 59 publisher series, https://www.sf-bibliografia.fi/publishers/387) and
Helsingin Science Fiction Seura ry (publisher of Tähtivaeltaja, https://www.sf-bibliografia.fi/publishers/85).
**Mockup:** [`../mockups/publishers.html`](../mockups/publishers.html) with [`publishers-data.js`](../mockups/publishers-data.js) (real data): `?v=pub` WSOY, `?v=series` its Sarjat tab,
`?v=mags` a publisher with a magazine (Lehdet tab), `?v=list` the list. The yellow bar switches visitor / admin and light / dark.

| Before | After (mockup, light) | After (mockup, dark) |
|---|---|---|
| ![before](../images/publishers/before-publisher.png) | ![after](../images/publishers/after-publisher.png) | ![after dark](../images/publishers/after-publisher-dark.png) |
| ![before series](../images/publishers/before-publisher-series.png) | ![after series](../images/publishers/after-publisher-series.png) | ![after series dark](../images/publishers/after-publisher-series-dark.png) |
| _no Lehdet tab today_ | ![after magazines](../images/publishers/after-publisher-magazines.png) | ![after magazines dark](../images/publishers/after-publisher-magazines-dark.png) |
| ![before list](../images/publishers/before-list.png) | ![after list](../images/publishers/after-list.png) | ![after list dark](../images/publishers/after-list-dark.png) |
| ![before mobile](../images/publishers/before-publisher-mobile.png) | ![after mobile](../images/publishers/after-publisher-mobile.png) | ![after mobile dark](../images/publishers/after-publisher-mobile-dark.png) |

More: [after, whole WSOY page](../images/publishers/after-publisher-full.png) ([dark](../images/publishers/after-publisher-full-dark.png)) ·
phones: [list before](../images/publishers/before-list-mobile.png), [list after](../images/publishers/after-list-mobile.png).

## What's wrong today

1. **A big publisher's page loads everything at once.** WSOY's 2,263 editions come in one 2 MB response (1.1 s) and render as one text list:
   the page is **47,007 px tall on desktop and 170,483 px on a phone** (too big to keep as a screenshot).
2. **The header says only "Julkaisuja 2263 / Sarjoja 59"** in large labelled numbers; no years, nothing about when the publisher was active.
3. **The edition list is text lines with codes** ("Lagerlöf, Selma: Peukaloisen retket … 1 - 3.painos. WSOY 1906 - 1929. [nF]"), sorted by year with no paging or search.
4. **The Sarjat tab is a bare list of 59 names,** with no book counts or years.
5. **List page:** 507 publishers in a `DataTable` with filters in the header cells; the API returns every edition of every publisher (only id and year)
   to count them; 22 publishers show "0" with no explanation. Many of them are clubs whose output is a magazine: "Aikakone ry" has no books
   but publishes Aikakone (50 issues). The page doesn't show a publisher's magazines at all, although the API returns them.
   There are also near-duplicates for admins to check, e.g. "Helsingin Science Fiction Seura" and "Helsingin Science Fiction Seura ry".
6. Centred title, "Kustantajia yhteensä: 507" without thousands separators elsewhere.

## Proposed layout

**Publisher page**
1. **Header:** name, full name, a "Kustantaja" chip and one line of facts: "2 263 painosta (1 389 kirjaa) vuosina 1889–2026, 59 kustantajan sarjaa".
2. **"Painokset vuosittain" timeline:** the person page's timeline component (bar heights, solid first editions and hatched reprints, bins for long spans; WSOY peaks at 103 editions a year).
   Clicking a year filters the book list to that year.
3. **Sidebar:** links.
4. **Tabs with counts:** Kirjat, Sarjat, and **Lehdet** when the publisher has magazines (decided): a table of its magazines with type, years and
   number of issues ([screenshot](../images/publishers/after-publisher-magazines.png)).
5. **Kirjat:** one row per book and laitos (agreed rule: printings of the same book are one row with their years): cover, title, author,
   original title and year, laitos when more than one, printing years (each links to its edition), publisher series, genre chips.
   Text filter, year range, sort (**oldest first by default**, decided; newest first, title, author), Lista / Kannet. **Server-side paging** (agreed rule).
   **Sarjat:** a table of the publisher's series with book counts and years, sortable.
6. Paging under the list.

**List page**
1. Header with the total and the five biggest publishers as links.
2. Filter bar: name search, "toiminut" year range, "Piilota ilman painoksia (22)".
3. Table: name (full name under it when different), number of editions, years, and a thin **activity bar** on a common 1889–2026 axis,
   so long-running houses and one-off publishers are told apart at a glance. A publisher without books but with a magazine says
   "ei kirjoja; julkaisee lehteä Aikakone"; one with neither says "ei luetteloituja painoksia".
   Every column sorts; state in the URL; cards on a phone (the activity bar is hidden there).

## Implementation (2026-11-26): `/publishers` as an admin-only trial in identity style

Built to the [build rules](../README.md#rules-for-every-redesigned-page-decided-2026-11-24): the list page of this plan in the identity
style (the book index's tokens and type). Admins switch with *Uusi kustantajasivu* or Shift+U (`suomisf.publishersPageVersion`, apart
from the other pages' choices); everyone else gets the current page. The publisher page: see the next section.

- **Backend:** a new route, `GET /api/publisherindex` (`app/impl_publisherindex.py`): every publisher with its edition count, first and
  last year and magazines with issue counts, counted in the database (76 kB in about 30 ms on the dev data, against 400 kB and 340 ms for
  `GET /api/publishers`, which the current page keeps using unchanged).
- **Frontend:** `src/features/publisher/list/` (page, styles, `publisher-list-state.ts` with Vitest tests), the switch in
  `src/features/publisher/routes/publisher-list-switch.tsx`. 507 rows are light, so filtering and sorting happen in the page.
- **Header:** "507 kustantajaa. Suurimmat: WSOY (2 260), Tammi (1 148), Otava (1 066), Karisto (695), Gummerus (605)."
- **Filters:** name (as typed, from the start of any word of the name or the full name, so "söderström" finds WSOY through
  "Werner Söderström Oy" and four other houses), "Toiminut" year range (active at any time in it; *Rajaa* or Enter), and
  "Piilota ilman painoksia (22)". Count line "N / 507 kustantajaa" when filtered, *Tyhjennä*.
- **Table:** name (full name under it when it differs beyond case), Painoksia, Vuodet, and the activity bar on one axis from the
  earliest to the latest year in the data (1856–2026 today, not the plan's 1889: J. Simeliuksen perilliset, 1856). Each header sorts;
  its first click is its natural direction (names A–Ö, most editions, oldest first), the second reverses; publishers without editions
  stay last. A publisher without books says "ei kirjoja; julkaisee lehteä Aikakone (50 numeroa)" with the magazine linked.
- **URL:** `nimi`, `toiminut=1950-1980`, `piilota=tyhjat`, `jarjestys=painoksia|vuodet`, `suunta` only when not the column's default;
  the name is written without a history entry for every letter.
- **Phone:** cards ("2 260 painosta · 1889–2026"), no activity bar, a *Järjestys* select instead of the column headers.
- **Tests:** backend `tests/api/test_publisherindex.py`; Playwright `tests/admin/publishers-new.spec.ts`,
  `tests/anon|user/publishers-version.spec.ts`.

### Compared with the live site (2026-11-26)

| | Live (`/publishers`) | Dev data, new page | Why |
|---|---|---|---|
| Publishers | 507 | 507 | same |
| Without editions | 22 (shown as 0) | 22, all with a magazine | same |
| WSOY / Tammi / Otava / Karisto / Gummerus | 2 263 / 1 148 / 1 067 / 697 / 605 | 2 260 / 1 148 / 1 066 / 695 / 605 | the dev database is an older copy |
| WSOY years | 1889–2026 | 1889–2026 | same |

## Implementation (2026-11-26): `/publishers/:id` as an admin-only trial in identity style

The owner changed two things in the plan before it was built: **a publisher publishes editions, so its list is of printings, not works**
(one row a printing, no merged reprints), and **no "Painokset vuosittain" chart** (as the person page's was removed, 2026-11-25).
Admins switch with *Uusi kustantajan sivu* or Shift+U (`suomisf.publisherPageVersion`); everyone else gets the current page.

- **Backend:** `GET /api/publishers/:id/summary` (facts, links, series with printing counts and years, magazines with issue counts and
  years: 6 kB in 25 ms for WSOY) and `GET /api/publishers/:id/editions` (paged 50/100/200, 100 by default; `q` from the start of a word of
  the author's name or the printing's, work's or original title; `year_min`, `year_max`; `sort` oldest (default), newest, title, author;
  the logged-in user's owned and wishlisted marks: 73 kB in 85 ms a page, against 2 MB for `GET /api/publishers/:id`, which the current page
  keeps using). The optional login is `optional_user_id()` in `app/api_jwt.py`, shared with `/api/bookindex`: an expired token gets 401.
- **Shared component:** `src/features/edition/rows/` (`EditionRows`, helpers with Vitest tests), one printing a row, its own identity
  tokens so other edition lists (a publisher's series, a person's translations) can use it:
  "Ursula K. Le Guin: **Pimeyden vasen käsi** (*The Left Hand of Darkness*, 1969). Suom. Kalevi Nyytäjä. Sci-fi -sarja." — author and
  translators link to people, the title to the printing (`/editions/:id`), the series to it; "2. painos", "2. laitos", "2. laitos,
  3. painos" when not a first printing; the reader's star or bookmark before the row; genres on the right. Sorted by year, the rows sit
  under year headings ("1976 · 14 painosta"); by title or author, the year ends each row. *Kannet* shows the same page as covers
  (cloth binding without one), **each cover file once** (owner, 2026-11-26: of WSOY's 2 069 printings with a cover only 1 760 files
  differ; Hobitti's 28 reprints share one): the tile sits at its first printing in the list, links to the earliest, and says
  "28 painosta, 1985–2012"; no year headings in Kannet. A printing with an empty title shows its work's title.
- **Page:** `src/features/publisher/page/`: crumbs, name, full name when it differs, the facts line "2 260 painosta (1 320 teosta) vuosina
  1889–2026, 59 kustantajan sarjaa." (and "1 lehti" for a magazine publisher), description and links; tabs Painokset, Sarjat (when any),
  Lehdet (when any) with counts; Painokset with "Tekijä tai nimi", "Vuodet" (Hae or Enter), Tyhjennä, Järjestys, Kannet, paging and rows
  per page; Sarjat as a table sorted from its headers (name A–Ö, most printings, oldest first; empty last); Lehdet as a table (type,
  issues, years). The admin SpeedDial (Muokkaa, Poista off while the publisher has printings, series or magazines) as on the current page.
- **Genret (owner, 2026-11-27):** beside the header, as on the person page: a bar for each genre in its colour with the number of
  **works** (not printings: Hobitti's 28 reprints count once), most first, "Teoksia; teoksella voi olla useampi genre." The six biggest
  show, the rest from "18 genreä kaikkiaan" (WSOY); none for a publisher with one genre. From the summary's `genres`.
- **The reader's own printings (owner, 2026-11-27):** above the edition list, under the count, and for what the filters select (every
  page): "★ Omistat 12 näistä painoksista; muistilistallasi 2." (the edition list's `own`), hidden while a new result loads; nothing for
  a visitor or a reader with none among them. First placed under the facts line for the whole publisher; the owner moved it.
- **Book series in the rows (owner, 2026-11-27):** the work's book series, linked, with its number, after the printing label and before
  the translators, as in the book index: "Ursula K. Le Guin: Maameren velho (A Wizard of Earthsea, 1968). Maameren tarinat 1. Suom. …".
- **Genre filter (#90, owner 2026-11-28):** each genre in Genret is a button: a click shows only the printings of works in it (from any
  tab, opening Painokset), a second click clears it, one genre at a time; the picked one stays highlighted and visible among the six, the
  count line names it ("427 painosta / 2 260 · Science Fiction"), Tyhjennä clears it (`genre=SF`, the API's `genre`).
- **Vain ensipainokset (#89, owner 2026-11-28):** a checkbox in the filter bar, applied at once: only the work's first Finnish edition,
  laitos 1 (or none) and printing 1, so a 2. laitos goes too (`first=1`; WSOY 1 224 of 2 260 in the dev data). Tyhjennä clears it.
- **URL:** `valilehti=sarjat|lehdet`, `sivu`, `genre=SF`, `ensipainokset=1`, `haku`, `vuodet=1970-1979`, `jarjestys=uusin|nimi|tekija`, `riveja=50|200`, `nakyma=kannet`,
  `sarjat=painoksia|vuodet`, `suunta`; defaults are left out, and a filter, order or rows change goes back to page 1. An address with a
  tab the publisher has no rows for shows the printings.
- **Tests:** backend `tests/api/test_publisherpage.py`; Vitest `edition-rows-utils.test.ts`, `publisher-page-state.test.ts`; Playwright
  `tests/admin/publisher-new.spec.ts`, `tests/anon|user/publisher-version.spec.ts`.

**Compared with the live site (2026-11-26):** WSOY's series 59 on both; printings 2 263 live, 2 260 in the (older) dev data. The plan's
"(1 389 kirjaa)" counted book-and-laitos rows; the page counts distinct works (1 320).

### Notes: possible data errors (to check later, not part of the redesign)

1. Savukeidas, a publisher of this century, starts in 1869: its edition 7276, *Fantasmagoria ja muita runoja*, has the year 1869, the year
   Lewis Carroll's *Phantasmagoria* first appeared; probably the original's year entered as the printing year. It stretches Savukeidas's
   activity bar from 1869.
2. Four printings have an empty title (e.g. edition 8833, WSOY, Murakami's *Ensimmäinen persoona*); the edition rows show the work's title
   for them, and the Nimi order sorts them by it (before the fix 8833 came first).

## Shared principles used or added

Uses: large lists paged on the server, printings of the same book as one row, the person page's year timeline, filters above lists,
state in the URL, text first, tabs with counts, empty values last, dark theme, page width.

No new rules.

## Implementation steps

1. **Backend:** `/api/publishers/:id` returns the header facts, editions per year (for the timeline), series with counts and years, and the books
   **paged** (grouped by work and laitos, with filters and sorting) instead of all editions, and its magazines with issue counts and years.
   `/api/publishers` returns name, full name, edition count, year span and magazine names instead of every edition.
2. **Publisher page:** header, reuse `publication-timeline.tsx` from the person plan (year click sets a filter in the URL), tabs, book rows
   (shared compact row), series table.
3. **List page:** shared filter bar and table; the activity bar as a small presentational component.
4. **Tests and wiki:** Playwright for paging, the year filter from the timeline, the series table, the list filters; update `SuomiSF‐ohje.md`.

## Tests

- Backend: paging and totals for WSOY; grouping by work and laitos; per-year counts.
- Playwright: the WSOY page loads one page of books, oldest first; HSFS shows a Lehdet tab with Tähtivaeltaja, WSOY doesn't;
  "Aikakone ry" in the list says it publishes Aikakone; clicking 1980 in the timeline filters to 1980 and puts it in the URL; Sarjat sorts by count;
  the list hides publishers without editions on request.

## Open questions

_None._

## Decisions

2026-11-22, project owner:
- The backend change (paged books, per-year counts, series and magazines on the publisher page, light list) is fine.
- A publisher's books are shown oldest first by default.
- Publishers with magazines get a Lehdet tab.
