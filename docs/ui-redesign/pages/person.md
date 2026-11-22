# Person page

**Route:** `/people/:id` · **Code:** `src/features/person/routes/person-page.tsx`, `src/features/person/components/person-details.tsx`, `src/components/contributor-book-control.tsx`
**Status:** Proposal · **Updated:** 2026-11-22
**Sample page:** Ursula K. Le Guin, https://www.sf-bibliografia.fi/people/2435
**Mockup:** [`../mockups/person.html`](../mockups/person.html), built with real Le Guin data from the live API (download and open it in a browser; covers load from the live site).

| Before | After (mockup) |
|---|---|
| ![before](../images/person/before-desktop.png) | ![after](../images/person/after-desktop.png) |
| ![before mobile](../images/person/before-mobile.png) | ![after mobile](../images/person/after-mobile.png) |

Full mockup page: [after-desktop-full.png](../images/person/after-desktop-full.png). Current works list: [before-works.png](../images/person/before-works.png).

## What's wrong today (measured on Le Guin)

1. **Too long.** The page is 8,651 px tall on desktop and 17,391 px on a phone. Each book is a ~260 px card
   (cover carousel, edition list, genre chip, collapsed tags). The mockup is 4,162 / 5,470 px.
2. **Two rows of tabs.** Main tabs (Teokset, Tietokirjat…), then role subtabs (Kirjoittanut (29)) inside.
   Tab icons sit right against the labels. Tab labels show no counts.
3. **No summary.** You can't see how much exists or when it came out in Finnish without scrolling the whole list.
4. **Noisy header sidebar.** Roles in bold text with an underline, large grey genre chips ("Fantasia x 17"),
   red tag chips, and a purple "+157" button: three different chip styles next to each other.
5. **Bio pushes everything down,** especially on a phone (the whole first screen). `CollapsibleHtml` already exists but isn't used here.
6. **Eight external links take a full-width row.**
7. **The nav bar (940 px) is narrower than the content (1060 px),** so the two don't line up.
8. **Sorting is by name only.** For a bibliography, original year and Finnish year are the useful orders.
9. **Name in uppercase** makes long names hard to read and wrap badly on mobile.

## Proposed layout

```
┌ nav (same width as content) ─────────────────────────────────────────┐
│ Henkilöt / Le Guin, Ursula K.                                         │
├──────────────────────────────────────────────┬───────────────────────┤
│ [photo] Ursula K. Le Guin                     │ Tuotanto tietokannassa │
│         Ursula Kroeber Le Guin                │  31 kirjaa  40 painosta│
│         🇺🇸 Yhdysvallat  1929–2018              │  93 novellia 2 palk.  │
│         (Kirjailija)(Novellisti)…             ├───────────────────────┤
│ ┌ Suomeksi 1976–2024 ──────────────────────┐ │ Genret (bars)          │
│ │ ▮▮ ▮   ▮▮▮   ▮ ▮▮      ▮▮▮▮▮▮▮▮▮  ▮▮ ▮▮  │ │ Yleisimmät asiasanat   │
│ └──────────────────────────────────────────┘ │ Linkit (2 columns)     │
│ Bio, 4 lines … Näytä koko esittely ▾          │ Muokattu · Muutoshist. │
│ Kirjat 31 | Novellit 93 | Sarjat 3 | Palk. 2  │   (sticky on desktop,  │
│ (Kaikki)(Romaanit)(Kokoelmat)…  [filter][sort][Lista|Kannet]          │
│ ── 1960-luku ──                               │    below on phone)     │
│ [cover] Maameren velho          F  3 painosta │                       │
│         A Wizard of Earthsea 1968 · Maameren tarinat 1                 │
│         Suomeksi: WSOY 1976, 1984, 1990       │                       │
└──────────────────────────────────────────────┴───────────────────────┘
```

The numbers 1–6 in the mockup screenshots match the sections below.

1. **Header.** Mixed-case name in Roboto Slab, larger portrait (168 px, 96 px on phone) with credit under it,
   nationality and years on one line, roles as small soft chips. "Myös" / "Oikea henkilö" stay under it.
2. **Finnish publication timeline (new, the one distinctive element).** One block per Finnish edition per year,
   coloured by genre (SF / fantasy / other), outlined if it's that book's first Finnish edition. Hover shows the titles;
   clicking a year filters the list below. This shows a person's Finnish publishing history in one look
   (for Le Guin: the WSOY 1970s–90s wave, then Avain and Vaskikirjat from 2010). Hidden when there are fewer than ~3 editions.
3. **Bio** clamped to 4–5 lines with `CollapsibleHtml`, source label next to the toggle.
4. **One row of tabs with counts:** Kirjat / Novellit ja artikkelit / Sarjat / Lehdet / Palkinnot / Muu tuotanto.
   Fiction and non-fiction merge into Kirjat; Tietokirjat becomes a filter chip. Tab state goes in the URL (`?tab=novellit`)
   so links and the back button work.
5. **Toolbar instead of subtabs.** Type chips with counts (Kaikki, Romaanit, Kokoelmat, Yhteisniteet, Tietokirjat);
   role chips appear only when the person has more than one role (Kirjoittanut / Toimittanut / Kääntänyt / Kansikuva);
   filter by name; sort (original year, Finnish year, name); view toggle **Lista** (compact rows, default) / **Kannet**
   (cover grid, replaces "Näytä kaikki kuvat"). Grouped by decade when sorted by year, by series when "Ryhmittele sarjoittain" is on.
6. **Sidebar.** Stats box, genre bars (replace the chip pile), top 8 tags in one neutral style with counts plus "+N muuta",
   links in 2 columns, last-edited date with a link to the change history (`get-person-changes.ts` already exists).

**Compact row:** 44×64 cover thumb, title, original title + year + series link, "Suomeksi: WSOY 1976, 1984, 1990"
(each year links to its edition), genre badges and edition count on the right. Tags move to the work page.
That takes the row from ~260 px to ~76 px.

**Visual rules:** keep the current indigo primary and Roboto / Roboto Slab, light grey page with white surfaces,
one chip style per meaning (role = soft indigo, tag = outlined neutral, filter = pill that turns dark when on).
Genre colour (SF indigo, fantasy rust, other grey) is used only in the timeline, genre bars and badges.

## Shared principles used or added

This is the first plan, so it proposes most of the rules in [principles.md](../principles.md): one tab row with counts, compact rows,
chip styles, genre colours, sticky facts sidebar, clamped bio, URL state. New rule only here: the publication timeline,
which could be reused on publisher and series pages.

## Implementation steps (each one a small PR)

All of it is frontend; the `/people/<id>` response already has editions with `pubyear`, genres and covers. No backend change is needed.

1. **Header and bio**: `person-details.tsx`. Mixed-case name, portrait size, role chips (move `getDerivedRoles` out
   of `person-page.tsx` into `person/utils.ts` with Vitest tests), `CollapsibleHtml` for the bio. Align the nav width in `mainmenu.tsx`.
2. **Sidebar**: new `person-sidebar.tsx` (stats, `GenreBars`, top tags, links). Use the PrimeReact `Chip`/`Tag` components.
   Two columns via PrimeFlex `lg:col-8` / `lg:col-4`, sticky with `position: sticky`.
3. **Timeline**: new `publication-timeline.tsx`. A pure `binEditionsByYear(person)` function with Vitest tests from a captured
   fixture (Le Guin's API response in `src/test/fixtures/`). Plain CSS grid, no chart library (chart.js would be heavy for this
   and less accessible). Bars are buttons with `aria-label="1984: 4 painosta"`.
4. **Single tab row + toolbar**: rework `ContributorBookControl` (only the Person page uses it). PrimeReact `SelectButton`
   for chips and the Lista/Kannet toggle, `Dropdown` for sort, `InputText` for the filter. URL state through `useSearchParams`.
5. **Compact row view**: new `work-row.tsx`. The current card stays available as the cover view.
6. **Mobile and accessibility pass**: 390 px check, focus rings, no sideways scroll; update `tests/anon/person-tabs.spec.ts` and `a11y.spec.ts`.
7. **Wiki**: update the person-page section in `SuomiSF‐ohje.md` and retake its screenshots (repo rule).

## Tests

Vitest for the pure functions (roles, binning, sorting/grouping), Playwright for tabs, filters and the URL state.

## Open questions

- Keep the uppercase name? (It's the current house style; the mockup uses mixed case.)
- Default list view: compact rows (proposed) or the current cards?
- Merge Tietokirjat into Kirjat as a filter, or keep it as its own tab?
- Should the timeline filter by year (proposed) or only show the data?
- Same treatment later for the work page and the series pages?

## Decisions

_None yet._
