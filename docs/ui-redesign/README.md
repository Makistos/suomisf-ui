# SuomiSF UI redesign

Plans for improving the SuomiSF user interface, one page at a time, with shared rules so the pages end up
looking and working like one site. Written for admins and contributors, so anyone can review a plan before it's built.

Nothing here is built yet unless the status table says so. Each change still goes through normal review.

## Rules for every redesigned page (decided 2026-11-24)

These apply to every page in this rewrite, not only the ones built so far:

1. **The new identity style.** Every redesigned page uses the visual identity defined in
   [work-identity.md](pages/work-identity.md#design-plan): Literata and Schibsted Grotesk (self-hosted, `src/components/identity-fonts/`),
   ink and catalogue-blue tokens with light and dark values, the site's own page background, rules and space instead of boxes,
   labelled facts and text lists instead of chips. A page plan that was agreed in the older style (indigo, Roboto, cards) is built in the
   identity style; its behaviour stays as agreed. The person and work pages are the reference implementations.
2. **An admin-only trial first.** The new page is reached only by admins, with the shared switch
   (`src/components/page-version-switch.tsx`): a button at the bottom left and **Shift+U**, the choice kept per page type in the browser.
   Visitors and other users keep getting the current page, and the new page's code is lazy-loaded so they never download it.
3. **The current page must not break.** It keeps working for everyone, unchanged except for bug fixes. If the new page needs an API change
   that would break the current page, it gets a new route instead. Tests prove both: Playwright specs for the new page (`tests/admin/<page>-new.spec.ts`),
   and for visitors and users that they still get the current page (`tests/anon|user/<page>-version.spec.ts`); the full test suites
   (backend, Vitest, Playwright in Chromium and Firefox) pass before a trial is called done.
4. **Making it the default** is a separate decision per page: render the new page for everyone in the switch, then remove the old page and the switch.

## How to read and comment

- Start with [principles.md](principles.md): the rules every page follows (colours, type, chips, tabs, lists, mobile), and the build rules above.
- Each page has its own plan in [pages/](pages/). A plan has before/after screenshots, the problems found,
  the proposed layout, implementation steps and **open questions**. The open questions are where input is most useful.
- Mockups in [mockups/](mockups/) are static HTML pages with real data. Download one and open it in a browser;
  they don't need the app running. The yellow bar at the top switches between visitor, logged-in user and admin,
  and between the light and dark theme (by default they follow your system setting, like the site).
  Every plan's before/after table shows the mockup in both the light and the dark theme.
- Comment by opening a GitHub issue that names the plan (for example "UI redesign: person page"), or by commenting on the pull request that changes the plan.

## Status

| Page | Route | Plan | Status |
|---|---|---|---|
| Person | `/people/:id` | [person.md](pages/person.md) | Agreed; new page in admin-only trial (Shift+U), 2026-11-24 |
| Work | `/works/:id` | [work.md](pages/work.md) | Agreed (revised 2026-11-23) |
| Person: visual identity (alternative) | `/people/:id` | [person-identity.md](pages/person-identity.md) | Proposal; implemented for the admin trial |
| Work: visual identity (alternative) | `/works/:id` | [work-identity.md](pages/work-identity.md) | New page in admin-only trial (Shift+U), 2026-11-24 |
| Front page: visual identity (alternative) | `/` | [front-identity.md](pages/front-identity.md) | New page in admin-only trial (Shift+U), 2026-11-25 |
| Edition link | `/editions/:id` | Part of [work.md](pages/work.md) (no separate page: it opens the work page with that edition highlighted) | Agreed |
| Short story | `/shorts/:id` | [short.md](pages/short.md) | Agreed; new page in admin-only trial (Shift+U) in the identity style, 2026-11-25 |
| Front page | `/` | [front-page.md](pages/front-page.md) | Agreed (revised 2026-11-23) |
| Search (menu dropdown and results page) | `/search` | [search.md](pages/search.md) | Agreed |
| People list | `/people` | [people-list.md](pages/people-list.md) | Agreed |
| Book index, works by type, non-fiction | `/bookindex`, `/nonfiction` | [book-index.md](pages/book-index.md) | Agreed |
| Short story index | `/shortstoryindex` | [short-index.md](pages/short-index.md) | Agreed |
| Magazines, magazine, issue | `/magazines`, `/magazines/:id`, `/issues/:id` | [magazines.md](pages/magazines.md) | Agreed |
| Book series | `/bookseries`, `/bookseries/:id` | [bookseries.md](pages/bookseries.md) | Agreed |
| Publisher series | `/pubseries`, `/pubseries/:id` | [pubseries.md](pages/pubseries.md) | Agreed |
| Publishers | `/publishers`, `/publishers/:id` | [publishers.md](pages/publishers.md) | Agreed |
| Awards | `/awards`, `/awards/:id` | [awards.md](pages/awards.md) | Agreed |
| Tags | `/tags`, `/tags/:id` | [tags.md](pages/tags.md) | Agreed |
| Latest additions, changes | `/latest`, `/changes` | [latest-changes.md](pages/latest-changes.md) | Agreed |
| Statistics | `/stats` | [../stats-plan.md](../stats-plan.md) | Done 2026-10-13 |
| Users, profile, admin | `/users`, `/users/:id`, `/admin` | [users-admin.md](pages/users-admin.md) | Agreed |
| Login, password, FAQ | `/login`, `/register`, `/forgot-password`, `/faq` | [misc.md](pages/misc.md) | Agreed |

Status values: **Not started** → **Reviewed** (current page looked at, problems listed) → **Proposal** (layout and mockup) →
**Agreed** (open questions answered) → **In progress** → **Done** (with the commit or PR).

## Order of work

1. Agree on [principles.md](principles.md) using the person page as the first example.
2. Fix the site-wide issues listed there first (nav width, tab style, chip styles), since every page benefits.
3. Then the pages people visit most: person, work, edition, search, front page.
4. Then lists and indexes, then admin pages.

## TODO (from the trials, 2026-11-25)

Owner's notes on the person and work page trials, not done yet. The work page items are planned in
[work-identity.md, "Revision plan"](pages/work-identity.md#revision-plan-2026-11-25-the-record-and-the-printings-first):

- **Work page title a bit smaller in general** (58 px now, besides the long-word scaling added on 2026-11-25).
- **Descriptions closed by default** on the work and person pages: only a "Näytä kuvaus" button, no clamped first lines.
- **The work page's bookshelf closed by default** behind a "Näytä kirjahylly" button.
- **The person page's publication timeline closed by default** behind a similar button (for example "Näytä julkaisuvuodet").

## Later

Things agreed for after the redesign is implemented:

- **Colour scheme in user settings:** a logged-in user can choose follow the browser / always light / always dark for this site,
  saved with their account, overriding the browser setting (see the dark theme rule in [principles.md](principles.md)).
- **Change history for short stories,** like works and people have (see [short.md](pages/short.md)).
- **Original-year differences between translations:** find out why translations of the same story have different original years
  (e.g. *The Tell-Tale Heart* 1843 vs 1850). If they aren't errors, remove the admin note added by the short story plan.
- **Suggestions page** (`/suggestions`, Kirjaehdotukset): not part of this redesign; it stays as it is for now (see [misc.md](pages/misc.md)).

## Adding a plan

Copy [_template.md](_template.md) to `pages/<page>.md`, take screenshots of the current page at 1400 px and 390 px wide
into `images/<page>/`, and update the status table above.
