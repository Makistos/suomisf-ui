# Shared UI principles

Rules every page follows. **Agreed** = accepted by the project owner (2026-11-22); **Proposed** = waiting for agreement.
**TODO** = still to be decided. Change this file through a pull request so the discussion stays with the rule.

## Site-wide issues (fix once, every page benefits)

| Issue | Seen on | Status |
|---|---|---|
| Nav bar is narrower than the content (940 px vs 1060 px), so edges don't line up | Person; check others | Agreed fix: same max width for nav and content |
| Tab icons sit right against their labels | Person; check others | Agreed fix: gap, or drop icons |
| Tabs don't show counts | Person; check others | Agreed: count after each label |
| Three chip styles side by side (grey genre, red tag, purple "+N") | Person, work? | Agreed: one style per meaning, below |
| Very long pages from big cards per item | Person; check work and series | Agreed: compact rows as the default list |
| Tab and filter state should be remembered across reload, back and shared links | All list pages | Agreed: keep it in the URL |
| Tag colours encode tag type (subgenre, style, place, topic…) with no legend | Person, work | Agreed: group tags by type with written labels |
| Names and titles in uppercase | Person, work | Agreed: mixed case |
| Admin tools mixed into public content; change history is a tab for everyone | Work; check others | Agreed: one admin box, history as a link |
| _add as found_ | | |

## Visual identity

- **Keep:** indigo primary, Roboto for text, Roboto Slab for headings and numbers. The redesign tidies the site rather than rebranding it.
- **Names and titles in mixed case**, not uppercase (Agreed).
- **No "Suomeksi" / "suomennos" labels** (Agreed): everything in the database is published in Finnish, so saying so adds nothing.
  "Suomentaja" for the translator role is fine.
- **Surfaces:** light grey page, white boxes with a thin border.
- **Dark theme** (Agreed): every page has a dark version that follows the system setting, as the app does today with PrimeReact's
  `mdc-light-indigo` / `mdc-dark-indigo` themes. Colours come from tokens, never hard-coded, so each has a light and a dark value:

  | Token | Light | Dark (from `mdc-dark-indigo`) |
  |---|---|---|
  | Page background | `#F3F4F8` | `#121212` (`--surface-ground`) |
  | Boxes | `#FFFFFF` | `#1e1e1e` (`--surface-card`) |
  | Text | `#1E2233` | 87 % white (`--text-color`) |
  | Secondary text | `#5D6377` | 60 % white (`--text-color-secondary`) |
  | Borders | `#E3E6EE` | 12 % white (`--surface-border`) |
  | Primary (links, active tab) | `#3F51B5` | `#9FA8DA` (`--primary-color`) |
  | Text on primary | white | `#121212` |

  Genre colours stay the same in both themes; in dark mode genre dots, bars and timeline blocks get a faint light outline,
  because the darkest ones (fantasy `#31572C`) almost disappear on `#1e1e1e`. Every mockup has a Vaalea / Tumma switch.
  In code, use the theme's CSS variables (`var(--surface-card)`, `var(--text-color)`…) as the stats page already does, so both themes come for free.
  **Later, after the new UI is implemented:** a logged-in user can choose a colour scheme for this site in their settings
  (follow the browser / always light / always dark), saved with their account so it stays the same on every device and overrides the browser setting.
- **Genre colours** (Agreed): the same colours as today, from `src/features/genre/utils/genre-colors.ts` (SF `#0958D7`, F `#31572C`, K `#D30031`,
  Kokoelma `#008B8B`, Ei SpeFiä `#6C757D`, and the rest). Used only for genre data (timelines, genre bars, genre chips), never for decoration.

## Components

| Element | Rule | Status |
|---|---|---|
| Type (Romaani, Kokoelma…) | Small soft indigo chip, same look as a role | Agreed |
| Role (Kirjailija, Kääntäjä…) | Small soft indigo chip | Agreed |
| Tag (asiasana) | Outlined neutral chip with count; top N plus "+N muuta". On a single item (work, short), grouped by tag type with a small label | Agreed |
| Award | Trophy chip (award, year, category) in the header of the thing that won it; up to three, the rest behind "+N muuta palkintoa" in a dialog | Agreed (work) |
| Cover | The item's cover in the page header; a strip of distinct covers with years when there are several | Agreed (work) |
| Tabular data (editions, printings) | Real table by default on desktop (full page width), stacked cards on a phone; keeps every field and user/admin control the old cards had | Agreed (work) |
| Series navigation | Previous and next titles by name plus position, not bare arrows | Agreed (work) |
| Filter | Pill that turns dark when on, with a count | Agreed |
| Genre | Neutral chip with a dot in the genre's colour (readable for light colours too); small coloured badge in compact lists; horizontal bars in summaries | Agreed |
| Tabs | One row when they fit; if not, the row scrolls sideways (as PrimeReact `TabView scrollable` does today). Count after each label, state in the URL. Above a long list the tab row may stick to the top of the screen while scrolling | Agreed |
| Covers in lists | Title and author next to every cover; nothing important is hover-only; samples work by click or tap | Agreed (front page) |
| Counts shown to visitors | Link to the list or statistics behind them | Agreed (front page) |
| Portraits | Only on a person's own page, not in lists | Agreed (people list) |
| Text first | This is a bibliography: every list opens as text (rows); cover grids are an option, never the default | Agreed (series) |
| "Merkittävä sarja" | Not shown in the UI for now (book and publisher series) | Agreed (series) |
| Lists of books | Compact row by default (thumb, title, original title and year, series, editions); cover grid as a toggle | Agreed (person) |
| Sort | Original year, Finnish year, name; group by decade when sorting by year | Agreed |
| Long text (bio, description) | Clamp long text to 4–5 lines so it doesn't break the page flow, with "Näytä koko…" to read all of it (`CollapsibleHtml`) | Agreed |
| Facts / summary box | Sidebar on desktop that scrolls with the page (not sticky), below the content on a phone | Agreed |
| External links | Two-column list in the sidebar | Agreed |
| Admin actions | Keep the SpeedDial button; admin-only tools in one dashed "Ylläpitäjille" box | Agreed |
| Search hits | Matched term highlighted; a text repeated across a list (shared blurb) shown once | Agreed (search) |
| Navigation | Links and suggestions navigate inside the app; nothing reloads the whole site | Agreed (search) |
| Printings in lists | Printings of the same book are one row with their years (each year links to its edition), not one row per printing | Agreed (short story) |
| Filters on lists | In a bar above the list, not inside column headers | Agreed (people list) |
| Sorting | Empty values last in both directions | Agreed (people list) |
| Errors | A failed request shows a message with a way to retry; a loading indicator never stays up after an error | Agreed (people list) |
| Large lists | Paged on the server; nothing loads hundreds of items at once | Agreed (book index) |
| Filter updates | Text fields search on Enter or a search button; chips, selects and letter bars update results at once | Agreed (book index) |
| Natural order | A list with a natural order (series number, issue number) shows it by default; title order is an option | Agreed (series) |
| Main menu | Same on every page, including the search box; admins always see the Ylläpito menu | Agreed (front page) |
| Change history | A link that opens a dialog, not a tab | Agreed (work) |
| Similar works | Public to everyone (going public); a row of covers, each with a "Miksi samankaltainen?" popover (reasons for all, score numbers for admins) | Agreed (work) |
| Use PrimeReact components where one fits (repo rule) | `SelectButton`, `Dropdown`, `Chip`, `Tag`, `InputText` | Agreed |

## Layout and quality floor

- Page width (Agreed): content up to 1280 px wide, centred, with 24 px side margins (16 px on a phone); the main menu uses the same width.
  Running text stays under about 72 characters per line; a sidebar is 300 px.
- Phone: works at 390 px wide with no sideways scroll, 16 px side margins.
- Page height (Agreed): no budget. Some people have almost a hundred works (Erin Hunter 94 works and 195 editions,
  Stephen King 88 works and 152 stories), so long pages are normal. Compact rows, sticky tab rows and filters keep them usable.
- Keyboard focus visible everywhere; clickable chart parts are buttons with labels.
- Each page plan lists its Playwright and a11y test changes; the wiki (`SuomiSF‐ohje.md`) is updated in the same change.
