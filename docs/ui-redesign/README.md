# SuomiSF UI redesign

Plans for improving the SuomiSF user interface, one page at a time, with shared rules so the pages end up
looking and working like one site. Written for admins and contributors, so anyone can review a plan before it's built.

Nothing here is built yet unless the status table says so. Each change still goes through normal review.

## How to read and comment

- Start with [principles.md](principles.md): the rules every page follows (colours, type, chips, tabs, lists, mobile).
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
| Person | `/people/:id` | [person.md](pages/person.md) | Agreed |
| Work | `/works/:id` | [work.md](pages/work.md) | Agreed |
| Edition link | `/editions/:id` | Part of [work.md](pages/work.md) (no separate page: it opens the work page with that edition highlighted) | Agreed |
| Short story | `/shorts/:id` | [short.md](pages/short.md) | Agreed |
| Front page | `/` | [front-page.md](pages/front-page.md) | Agreed |
| Search (menu dropdown and results page) | `/search` | [search.md](pages/search.md) | Agreed |
| People list | `/people` | [people-list.md](pages/people-list.md) | Agreed |
| Book index, works by type, non-fiction | `/bookindex`, `/nonfiction` | [book-index.md](pages/book-index.md) | Agreed |
| Short story index | `/shortstoryindex` | [short-index.md](pages/short-index.md) | Agreed |
| Magazines, magazine, issue | `/magazines`, `/magazines/:id`, `/issues/:id` | [magazines.md](pages/magazines.md) | Not started |
| Book series | `/bookseries`, `/bookseries/:id` | [bookseries.md](pages/bookseries.md) | Not started |
| Publisher series | `/pubseries`, `/pubseries/:id` | [pubseries.md](pages/pubseries.md) | Not started |
| Publishers | `/publishers`, `/publishers/:id` | [publishers.md](pages/publishers.md) | Not started |
| Awards | `/awards`, `/awards/:id` | [awards.md](pages/awards.md) | Not started |
| Tags | `/tags`, `/tags/:id` | [tags.md](pages/tags.md) | Not started |
| Latest additions, changes | `/latest`, `/changes` | [latest-changes.md](pages/latest-changes.md) | Not started |
| Statistics | `/stats` | [../stats-plan.md](../stats-plan.md) | Done 2026-10-13 |
| Users, profile, admin | `/users`, `/users/:id`, `/admin` | [users-admin.md](pages/users-admin.md) | Not started |
| Login, password, FAQ, suggestions | `/login`, `/faq`, `/suggestions` … | [misc.md](pages/misc.md) | Not started |

Status values: **Not started** → **Reviewed** (current page looked at, problems listed) → **Proposal** (layout and mockup) →
**Agreed** (open questions answered) → **In progress** → **Done** (with the commit or PR).

## Order of work

1. Agree on [principles.md](principles.md) using the person page as the first example.
2. Fix the site-wide issues listed there first (nav width, tab style, chip styles), since every page benefits.
3. Then the pages people visit most: person, work, edition, search, front page.
4. Then lists and indexes, then admin pages.

## Later

Things agreed for after the redesign is implemented:

- **Colour scheme in user settings:** a logged-in user can choose follow the browser / always light / always dark for this site,
  saved with their account, overriding the browser setting (see the dark theme rule in [principles.md](principles.md)).
- **Change history for short stories,** like works and people have (see [short.md](pages/short.md)).
- **Original-year differences between translations:** find out why translations of the same story have different original years
  (e.g. *The Tell-Tale Heart* 1843 vs 1850). If they aren't errors, remove the admin note added by the short story plan.

## Adding a plan

Copy [_template.md](_template.md) to `pages/<page>.md`, take screenshots of the current page at 1400 px and 390 px wide
into `images/<page>/`, and update the status table above.
