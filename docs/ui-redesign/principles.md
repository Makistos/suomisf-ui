# Shared UI principles

Rules every page follows. **Proposed** = from the person page plan, waiting for agreement.
**TODO** = still to be decided. Change this file through a pull request so the discussion stays with the rule.

## Site-wide issues (fix once, every page benefits)

| Issue | Seen on | Status |
|---|---|---|
| Nav bar is narrower than the content (940 px vs 1060 px), so edges don't line up | Person; check others | Proposed fix: same max width for nav and content |
| Tab icons sit right against their labels | Person; check others | Proposed fix: gap, or drop icons |
| Tabs don't show counts | Person; check others | Proposed: count after each label |
| Three chip styles side by side (grey genre, red tag, purple "+N") | Person, work? | Proposed: one style per meaning, below |
| Very long pages from big cards per item | Person; check work and series | Proposed: compact rows as the default list |
| Tab and filter state is lost on reload and back | TODO check | Proposed: keep it in the URL |
| _add as found_ | | |

## Visual identity

- **Keep:** indigo primary, Roboto for text, Roboto Slab for headings and numbers. The redesign tidies the site rather than rebranding it.
- **Names in mixed case**, not uppercase (Proposed; currently uppercase).
- **Surfaces:** light grey page, white boxes with a thin border. **TODO:** check every token in the dark theme too
  (the stats page already reads theme CSS variables; follow it).
- **Genre colours** (Proposed): SF indigo, fantasy rust, other grey. Used only for genre data (timelines, genre bars, badges), never for decoration.

## Components

| Element | Rule | Status |
|---|---|---|
| Role (Kirjailija, Kääntäjä…) | Small soft indigo chip | Proposed |
| Tag (asiasana) | Outlined neutral chip with count; top N plus "+N muuta" | Proposed |
| Filter | Pill that turns dark when on, with a count | Proposed |
| Genre | Small coloured badge in lists; horizontal bars in summaries | Proposed |
| Tabs | One row only, count after each label, state in the URL | Proposed |
| Lists of books | Compact row by default (thumb, title, original title and year, series, Finnish editions); cover grid as a toggle | Proposed |
| Sort | Original year, Finnish year, name; group by decade when sorting by year | Proposed |
| Long text (bio, description) | Clamp to 4–5 lines with "Näytä koko…" (`CollapsibleHtml`) | Proposed |
| Facts / summary box | Sidebar on desktop (sticky), below the content on a phone | Proposed |
| External links | Two-column list in the sidebar | Proposed |
| Admin actions | Keep the SpeedDial button; show last edit and change history link | Proposed |
| Use PrimeReact components where one fits (repo rule) | `SelectButton`, `Dropdown`, `Chip`, `Tag`, `InputText` | Agreed |

## Layout and quality floor

- Page width: TODO (mockup uses 1240 px max with a 300 px sidebar).
- Phone: works at 390 px wide with no sideways scroll, 16 px side margins.
- Page height budget: TODO (person page goes from 8,651 px to about 4,200 px on desktop for Le Guin).
- Keyboard focus visible everywhere; clickable chart parts are buttons with labels.
- Each page plan lists its Playwright and a11y test changes; the wiki (`SuomiSF‐ohje.md`) is updated in the same change.
