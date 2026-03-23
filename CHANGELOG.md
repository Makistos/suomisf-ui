# Changelog

This list is abbreviated to the most significant changes. Over two years (March 2024 – March 2026) a total of 272 commits were made, of which 220 were features or bug fixes. The project's entire history spans 623 commits.

---

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
