# Changelog

This list is abbreviated to the most significant changes. Over two years (March 2024 – March 2026) a total of 272 commits were made, of which 220 were features or bug fixes. The project's entire history spans 623 commits.

---
## 2026-10-02 `8fc9d86` — Faster first paint and no layout shift on load
First paint about 1 s sooner on a throttled phone connection. JavaScript needed before the first paint halved (378 KB → 194 KB gzipped): the menu's login, registration, new-work and new-person dialogs now load on demand, and the front page no longer pulls in the whole edition feature. Pages no longer jump while loading (front page CLS 0.27 → 0.03, tag page 0.37 → 0.01): the menubar is styled from the first paint, entity pages keep their width while data loads, and covers and portraits reserve their space. The light/dark theme switches by CSS alone; duplicate PrimeReact and PrimeFlex stylesheets removed. List and gallery thumbnails load lazily.

## 2026-10-02 `bb235ce` — Link style and contrast
Links are Catalogue Indigo with medium weight, underlined only on hover and keyboard focus. Better text contrast on tags and secondary buttons. (Through `5019b25`.)

## 2026-10-02 `92849e4` — Error pages and accessibility fixes
Entity pages show a clear "not found" or "loading failed" message with a retry button instead of an empty page; unknown URLs get a not-found page; requests are no longer retried for missing records. Alt text on images, accessible names for icon buttons, dropdowns and charts, a labelled main navigation, and the author line above titles is no longer a heading.

## 2026-10-02 `c1c20f1` — Mobile fixes
The menubar no longer makes pages wider than a phone screen, toasts fit narrow screens, and tag chips, letter buttons and the "Vain nimet" checkbox have larger tap targets on touch screens. Product and design documentation added (`PRODUCT.md`, `DESIGN.md`).

## 2026-10-01 `d9ba822` — Legacy article pages removed
The unlinked article pages were removed; articles still appear on tag, person and issue pages.

## 2026-10-01 `9835d95` — Fix: app could go blank after deleting from a dialog
Closing overlays on navigation removed elements React still owned, which could unmount the whole app. Delete confirmations now show through an app-wide toast. Contributor rows in edit forms no longer remount (and lose focus) on every keystroke (`32605f5`).

## 2026-10-01 `84042cb` — Unit tests, linting and code quality
Vitest unit tests for edition, work and shared utilities; oxlint replaces the ineffective ESLint setup, and all its findings were fixed (unused code, hook rules, effect dependencies, React compiler rules); 24 unused source files deleted. The E2E suite gained a page guard that fails on runtime errors, render loops and request storms. (Through `06441a7`.)

## 2026-09-25 `bc277c4` — Winner-import source shown on award page

## 2026-09-21 `b5a7e23` — Person page combines contributions by work
Edited, translated, cover and illustration tabs list contributions per work like the authored-works list, keeping version (laitos) details, and tab counts are by work. (Through `9701855`.)

## 2026-09-15 `05da6d5` — Front page random picks
New "Bibliografiasta löytyy" section with one random book per genre category, shown in an image accordion that reveals genres, description and tags on hover. "Kokoelman laajuus" renamed "Bibliografian laajuus". (Through `b05ac94`.)

## 2026-09-12 `c96a7d5` — Parent series shown with sub-series
Work and person pages show a book series as "parent > sub-series". (Through `6e6ea14`.)

## 2026-09-10 `52d7121` — Counts and percentages in visitor stats charts

## 2026-09-05 `71cc70f` — Face detection library replaced
The admin person-image picker scores portrait candidates by face count with `@mediapipe/tasks-vision` instead of the unmaintained face-api.js, removing a high-severity dependency vulnerability.

## 2026-09-04 `006751b` — Fixes: original titles and stale tabs
Original title and year are shown based on language rather than title equality, without a stray "()" when empty; the Muistilista tab no longer shows Omistetut data; the book series browser updates after a work's series is edited. (Through `adc894f`.)

## 2026-09-03 `3bc2685` — More price sources and price editing
Lukuhetki and Kampin kirjakauppa added as price sources; Oranssi Planeetta hidden. Stored price rows can be edited; edit and delete are shown only to admins and the person who added the row. Work page and price lists refresh after pricing changes. (Through `03e7411`.)

## 2026-08-27 `db143ce` — Owners can price their own editions
The pricing button moved into the edition ownership row.

## 2026-08-25 `98af167` — Work list grouping and sorting
Work lists (including the person page) have a group-by-author toggle and a sort-field dropdown. Book series and publisher series lists are alphabetical.

## 2026-08-23 `350b0a3` — Framework upgrades and security fixes
Vite 8, React Router 7, TypeScript 7 and React 19. The search dropdown no longer renders descriptions as HTML (XSS fix). (Through `d9b9e8e`.)

## 2026-08-21 `65be8de` — End-to-end test suite
Playwright tests against a disposable copy of the database, covering anonymous browsing, logged-in user actions and admin create/edit/delete for every entity type, plus a repeatable performance harness. (Through `855754b`.)

## 2026-08-21 `d69fab0` — Code splitting and list performance
Routes load on demand (main bundle 2.58 MB → 793 KB). Long list tables are paginated, cover grids lazy-load, and in-place sort bugs that reordered shared data were fixed. (Through `e8e6000`.)

## 2026-08-19 `ba1a91c` — Chart legends drill down to filtered lists

## 2026-08-11 `f2b5542` — Other owners panel for editions
Edition ownership controls show who else owns the edition. Edition details lay out correctly on narrow screens.

## 2026-07-29 `aac62e0` — Collection composition and per-year stats
The Tilastot panel shows collection composition, a per-year chart and label counts, with drill-down scoped to the user. (Through `14e44e5`.)

## 2026-07-28 `2bd5fa6` — Titles-only search
A "Vain nimet" checkbox inside the main search box limits matching to titles and names. It is on by default and remembered. (Through `ba17c92`.)

## 2026-07-27 `dc0ca88` — Price sources and sellers
The work price picker has a source selector, and the seller is shown in the picker, prices table and collection value dialog. The work's "Muuta" note is shown separately from the description. (Through `d70fff4`.)

## 2026-07-21 `47f2c6a` — Finnish user and admin guides
`docs/KAYTTOOHJE.md` and `docs/ADMIN_GUIDE.md`.

## 2026-07-20 `d0d907a` — Read books in suggestions and profile
The suggestion wizard can hide books already read; the profile has a read-books view, and the open profile view is kept in the URL. (Through `5fdb72b`.)

## 2026-07-19 `a6c6493` — Admin shortcuts for new works and people
An admin menu creates works and people directly. People with no linked works can be deleted from their page.

## 2026-07-17 `fbf2f91` — Work read status
Logged-in users can mark a work read and give it a thumbs down, neutral or thumbs up. (Through `9588404`.)

## 2026-07-15 `c6bd61e` — Tag page shorts split by type
Each short story type (novelli, runo, artikkeli…) gets its own tab on the tag page. Award descriptions render as HTML on the awards list; the translation disclaimer is hidden for domestic awards.

## 2026-07-10 `1c7ef78` — Award creation and winner import
Admins can create awards and import winners from an external source, with a preview where each winner is matched before saving. (Through `d4422b2`.)

## 2026-07-08 `b2978f2` — Autocomplete for link descriptions

## 2026-07-07 `ce1c36e` — Password reset and registration email
Users can reset a lost password by email, and registration asks for an email address.

## 2026-07-06 `247720f` — Book suggestion wizard
New `/suggestions` page: a PrimeReact Stepper wizard that recommends books in refining steps — genre, subgenre & style, author's home country, original publication decade (including a pre-1900 bucket), length, and a final step with award-winning and owned-only switches plus subject/location/era/actor/list tags. Each selection live-refreshes a random ten matching works; option lists are constrained to the narrowed pool with per-tag match counts; a summary of the current selections shows under the stepper; award-winning books are marked with a trophy. Linked under the Muut menu and opens in a new tab. (Evolved through `73ea791`.)

## 2026-06-28 `661d757` — Edition best price in work ownership row
The ownership row on the work page shows the best available price for the edition.

## 2026-06-07 `1d0976b` — Antikvaari/Antikka price tracking UI
UI for second-hand book price tracking: a price picker and dialog with exclusions and product removal, manual price entry with URL scraping, match-quality tooltips, price source URLs, laitos/painos editing, and a price-range chart in collection stats. (Through `7b7735c`.)

## 2026-05-26 `d1fe511` — Fix: stale overlay masks after back navigation
Stale PrimeReact overlay masks no longer block the UI after browser back navigation.

## 2026-05-21 `c5fde9a` — Styled links in HTML description/bio/notes
Links inside HTML description, bio, and notes fields now match the site link style, with a visited-link style added.

## 2026-05-17 `62382c5` — Per-edition story differences in Novellit tab
The Novellit ja artikkelit tab shows how short-story contents differ between editions.

## 2026-05-16 `802a5d9` — Visitor analytics tab and pageview tracking
Admin-only visitor analytics tab on the stats page with a filterable pageview log, operator and location columns, and pageview beacons sent on every route change.

## 2026-05-12 `f65fe32` — Dark mode following browser preference
The PrimeReact theme switches automatically between `mdc-light-indigo` and `mdc-dark-indigo` based on the OS/browser `prefers-color-scheme` setting. Theme is applied before React hydrates (no flash), and live-switches if the user changes their preference while the app is open. Hardcoded light-mode colours in CSS replaced with theme variables.

## 2026-05-11 `0c4c6a5` — Multi-image support for issues
Issue pages now use the shared `ImageView` component, supporting multiple cover images with previous/next navigation, upload, and delete. Duplicate image-handling code removed from the issue page.

## 2026-05-10 `9b27d10` — Fix: tag combine button not working

## 2026-05-10 `7ed56af` — Kirjasampo tag import for works
Admin-only button on the work page that fetches tags from kirjasampo.fi and presents them for review before saving. Supports skip/omit and replace mappings that persist across imports.

## 2026-05-06 `868e023` — Fix: ownership indicator not showing on person page

## 2026-05-06 `ed9d752` — Fix: work/wishlist changes now reflect immediately
React Query cache is invalidated after ownership and wishlist mutations, so lists update without a manual refresh.

## 2026-05-05 `4f269f7` — Fix: front page cover strip picks oldest edition per work
Latest additions cover strip now selects the oldest edition that has a cover image, avoiding placeholder slots when a newer edition lacks an image.

## 2026-05-04 `a01f1cd` — Award description uses rich text editor

## 2026-05-04 `1e90e48` — Award editing and links on award page
Edit form for award name, description, domestic flag, and external links. Links are displayed in the award card header. Award list entries are now linked to their award page.

## 2026-05-03 `c9e93a5` — Notes field on short story

## 2026-05-01 `85ea770` — Fix: works grouped under wrong person when author names collide

## 2026-05-01 `397e4c7` — Fix: tag delete button; inline tag creation in tag autocomplete field

## 2026-05-01 `a7b6fbb` — Tag type styles and new Lista type
Added Lista as a new tag type (id 7) with purple colour and `pi-list` icon. Alagenre and Tyyli got icons (`pi-bookmark`, `pi-palette`). Era (Aika) now has a distinct sepia-brown colour instead of appearing unstyled. Lista appears as its own section between Tyylit and Paikat on the tags page.

## 2026-04-29 `dc6a562` — Incomplete work search shows total match count
The incomplete work search result now displays both the sampled count and the total number of matching works, e.g. "10 näytetty, 1 234 yhteensä".

## 2026-04-29 `4038afd` — Combined-genres mode for cumulative editions chart
Added a "Yhdistetyt genret" toggle (available when "Genret erikseen" is active) that merges subgenre variants into three bands: SF/nSF/lSF → Science Fiction, F/nF/lF → Fantasia, K/nK → Kauhu.

## 2026-04-26 `79ca31d` — Cumulative editions line chart in Teokset stats tab
New chart showing the running total of first editions by print year. Supports language filter, genre filter, year range, and per-genre breakdown with a separate line per genre via parallel API queries.

## 2026-04-25 `9e2a52a` — Fix: factual books now shown in Tietokirjat tab
Factual books (work type 4) were appearing under Muu tuotanto instead of the Tietokirjat tab due to genre filtering. Added `ignoreGenreFilter` option to `ContributorBookControl` so type 4 works are shown regardless of SF/non-SF genre tagging. Type 4 also excluded from Muu tuotanto.

## 2026-04-25 `0f67ec6` — Person page: Tietokirjailija role and refined Kirjailija
Added Tietokirjailija as a derived role for persons with factual books (work type 4). Kirjailija is now only assigned for fiction work types (1, 2, 5, 6). A person can hold both roles simultaneously.

## 2026-04-11 `76a2937` — Fix: real_person filtering applied to series listing
Works are now filtered from the book series list using the same real_person logic as the contributor control, preventing series entries from appearing on the wrong person's page.

## 2026-04-11 `5a37b8e` — Fix: alias work visibility and grouping on person pages
Works are hidden only when real_person points outside the person's alias/real-name set, so they show correctly on both the alias and real person's page. Works written under an alias now appear under the alias name on the real person's page.

## 2026-04-11 `4940617` — Fix: works hidden when real_person points to someone else
Contributions where real_person is set to a different person are excluded from that person's work list.

## 2026-04-10 `da8d4c6` — Fix: real person display in contributor control and work details
Real person dropdown now shown for all aliases (not just multi-person ones). Fixed dropdown value matching, mount-time overwrite, query invalidation on save, and real author re-detection when contributions change.

## 2026-04-10 `4e2a6d0` — Show real person behind shared alias on work and short pages
Contributor field auto-selects the real person if an alias has exactly one, or shows a dropdown if multiple. Work and short pages display a "Kirjoittanut" line with real author links when an alias is shared. Real person also shown inline on issue page for editors and cover artists.

## 2026-04-10 `970d679` — Person aliases are now clickable links

## 2026-04-09 `f464eff` — Show real persons behind alias name; hide empty genres heading

## 2026-04-09 `c05b081` — Fix: translator role detection in PersonPage

## 2026-03-25 `092b76d` — Contribution list shows authors, falls back to editors

## 2026-03-25 `19295d3` — Normalise page wrapper elements and CSS classes

## 2026-03-24 `dd8355e` — Improved WorkList and WorkSummary design
WorkSummary uses a two-line layout with title and muted original title on line one, metadata (series, translator, publisher, genres) on line two. Other editions grouped under their work. Author group headers in WorkList are linked to person pages.

## 2026-03-24 `45e884b` — Award page refactored to standard entity page layout

## 2026-03-24 `61a07bf` `5ecb63c` `f186877` — Visual consistency pass
Normalised SpeedDial tooltips, loading spinners, tab content wrappers, and minor layout fixes across person, award, bookseries, pubseries, publisher, and issue pages.

## 2026-03-23 `d2bbee2` — New home page
Complete redesign of the front page: cleaner layout, latest additions as a cover image view, collection size statistics, and loading animations.

## 2026-03-22 `9ebeca6` — Fix: dialogs stopped working after in-app navigation
PrimeReact's `blockScroll` dialog left the `p-overflow-hidden` class on `<body>` when navigating away while a dialog was open. Additionally, `QueryClient` was being recreated on every render. Both issues fixed.

## 2026-03-22 `0d5bf8d` — Person page: derived roles, tags, and tab fix
Added derived roles to the person page sidebar (Author, Short story writer, Poet, Writer, Translator, Editor, Cover artist, Illustrator, Editor-in-chief) and tags. Fixed a PrimeReact TabView bug where the first tab was not selected under certain conditions.

## 2026-03-22 `4de64d9` — Work page: cover image layout and detail level selector
Edition list cover images now always stay beside the details on narrow screens. The detail level selector got Finnish labels (Brief / Condensed / All).

## 2026-03-22 `92b4f42` — Person portrait image from Wikimedia
Person page automatically fetches a portrait from Wikimedia Commons based on QID. Image is saved to the database. Includes image picker, scored face detection, no-image option, and toast notifications.

## 2026-03-22 `4740e22` — Login fetches username and admin role
On login, the `/me` endpoint is called to retrieve the username and admin status.

## 2026-03-19 `844c78f` — Fix: non-SF works were not shown on person page

## 2026-02-06 `ba7353d` — Statistics page with interactive charts
Comprehensive statistics page: works by year, short story language breakdown with interactive filters, publisher chart with dynamic data.

## 2026-01-22 `e8e6a4e` — "Appears in" field on work page and short page
Added Appears In field with person links to work page. Improved short story page layout.

## 2026-01-21 `be0155e` — Non-fiction tab and work type on person and work pages
Separate non-fiction tab on person page. Work type display on work page. Book filtering in contributor control.

## 2026-01-17 `8b52889` — Aliases field in person form

## 2026-01-15 `bb344ea` — Description field on magazine page

## 2025-11-09 `429db10` — Work page auto-refreshes after short story changes

## 2025-10-29 `199a48f` — Previous/next navigation on issue page

## 2025-10-28 `f031703` — Similar stories on short story page

## 2025-10-15 `1ca6058` — Omnibus work management (OmnibusPicker)
New component for managing omnibus works. Short stories can be added to all work types. Language detection from collection parts.

## 2025-10-07 `d41824c` — Copy button in edition details

## 2025-09-30 `ed9deb5` — Random incomplete work on profile page

## 2025-09-21 `4af3dc7` — Book series and publisher series extended info
Description, links, genres, series relationships, and original name for book series and publisher series.

## 2025-09-18 `f3aacc1` — Person's magazine cover gallery grouped by contribution type

## 2025-08-05 `9918e9b` — Finnish locale sorting for Scandinavian letters

## 2025-08-01 `d31948e` — Contributor controls refactored
Refactoring, image collection view, starred owned editions, gallery integration, improved tag and edition display.

## 2025-07-31 `5edf4b8` — Magazine contributions on person page

## 2025-07-18 `fd88abe` — Direct URL routing for individual editions

## 2025-06-08 `7c3531b` — Link lists use alt_name by default

## 2025-05-14 `a94dc90` — Booklet work type support

## 2025-05-13 `ddab3c4` — Short story search improvements
More fields, award filter, cleaned up search page.

## 2025-05-11 `e42666f` — Award page groups by category

## 2025-04-27 `090b464` — Improved search results and award forms

## 2025-04-05 `4f2991f` — Short story page update
Books and issues tabs merged. Story type shown in summary. Ownership data fixed.

## 2025-04-01 `8e2998de` — Major responsiveness overhaul
Person, work, edition, and other pages optimised for mobile. CDN switched. Description fields for publishers and tags.

## 2025-03-31 `1405492` — Visual redesign of multiple pages
Tag, publisher series, publisher, and book series pages updated to new look.

## 2025-02-16 `362d9c1` — Ownership indicator on tag and book series pages

## 2025-02-12 `018616f` — Improved edition list with detail button

## 2025-01-22 `2c0372b` — Magazine admin features

## 2024-12-08 `3964073` — Wishlist
Users can mark editions on a wishlist. Profile page shows wishlist view and stats.

## 2024-11-24 `c336a52` — Issue content and short story management improvements

## 2024-10-15 `e8cdef2` — Issue admin features and cover image management

## 2024-09-22 `5c398d47` — Profile page shows owned books
Edition ownership tracking and display.

## 2024-07-29 `b3380f90` — Edition grouping and tag placement on work page

## 2024-07-03 `fb85f766` — FAQ page
Frequently asked questions page linked from the front page. Email link.

## 2024-05-15 `b851313` — Tag system rewrite
Tag filtering, deletion, and creation refactored. New tags can be created directly from the work form.

## 2024-05-05 `ac01c9ea` — Work and edition form improvements
Forms load data independently. Toast notifications on save. Various small fixes.

## 2024-04-18 `7acd99e2` — Migrated from Create React App to Vite

## 2024-04-16 `e77d68d3` — Series browser arrow navigation on work page

## 2024-04-01 `3c6ea2af` — Upgraded PrimeReact to version 10

## 2024-03-26 `a1d6941` — Publisher series form
