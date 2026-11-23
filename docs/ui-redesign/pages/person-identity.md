# Person page: visual identity proposal

**Route:** `/people/:id` · **Builds on:** the agreed [person plan](person.md) (all its behaviour stays: bar-height timeline, main tabs by kind of record,
role tabs as a second row, toolbar inside the tab, compact rows, URL state, the phone filter sheet, only the tab row sticky, missing data hidden)
**Companion:** [work-identity.md](work-identity.md), the same identity on the work page (same tokens, fonts and rules)
**Status:** Proposal · **Updated:** 2026-11-23
**Mockup:** [`../mockups/person-identity.html`](../mockups/person-identity.html) with [`person-identity-data.js`](../mockups/person-identity-data.js) and the shared
[`timeline-data.js`](../mockups/timeline-data.js), real data: `?p=leguin` Ursula K. Le Guin, `?p=jpm` J. Pekka Mäkelä (writer and translator, no portrait),
`?p=tan` Eevien Tan and `?p=huo` Safa Huovinen (one cover each, from the sparse data check). `&tl=hunter` and `&tl=verne` swap in the timeline worst cases;
`&rooli=Kääntänyt` opens Mäkelä's translations. The yellow bar also switches visitor / logged in / admin and light / dark.

Like the work page proposal, this changes how the page **looks**, not what it does.

| Agreed design (current plan) | This proposal, light | This proposal, dark |
|---|---|---|
| ![agreed](../images/person/after-desktop.png) | ![proposal](../images/person-identity/desktop.png) | ![proposal dark](../images/person-identity/desktop-dark.png) |
| ![agreed list](../images/person/after-admin-list.png) | ![proposal list](../images/person-identity/list.png) | ![proposal list dark](../images/person-identity/list-dark.png) |
| ![agreed phone](../images/person/after-mobile.png) | ![proposal phone](../images/person-identity/mobile.png) | ![proposal phone dark](../images/person-identity/mobile-dark.png) |

More: [role tabs, Mäkelä](../images/person-identity/roles.png) · [his translations](../images/person-identity/roles-translations.png)
· [timeline, Erin Hunter](../images/person-identity/timeline-hunter.png) · [timeline, Jules Verne](../images/person-identity/timeline-verne.png)
· [one cover, Eevien Tan](../images/person-identity/sparse-tan.png) · [one book, Safa Huovinen](../images/person-identity/sparse-huo.png)
· [1,000 px](../images/person-identity/desktop-1000.png) · [phone, toolbar folded](../images/person-identity/mobile-toolbar.png)
· [phone, only the tab row sticks](../images/person-identity/mobile-scrolled.png) · [whole page](../images/person-identity/desktop-full.png) (each also `-dark`).

## Starting point

- **The person page's job:** say who the person is, show their Finnish publishing history at a glance, then list their books by role.
- **Vernacular it borrows from:** the library **authority record**. A catalogue gives each person one standard heading, written surname first
  with dates ("Le Guin, Ursula K., 1929–2018"), plus labelled facts. The page shows the name as people read it, and that heading under it.

## What changes, section by section (numbers match the mockup)

1. **The record:** name in Literata at 56 px; the authority heading under it in the interface face; then a labelled list (Koko nimi, Kansallisuus,
   Elinvuodet, Roolit, Tuotanto). **The agreed stats box becomes the "Tuotanto" line** ("31 kirjaa, 40 painosta, 93 novellia ja artikkelia, 2 palkintoa"),
   and the role chips become plain text ("kirjailija, novellisti, tietokirjailija"). Portrait 168 px with its credit; without a portrait the record is one column.
2. **The timeline is the page's one bold element,** drawn in ink: first editions solid, reprints hatched, the picked year in catalogue blue,
   a 2 px ink base line. Behaviour exactly as agreed (all book editions in any role, bins for long spans, a stated scale, a text legend, bars as buttons).
3. **Bio** in the reading face at 18 px, 66 characters a line, clamped to five lines, source after the toggle.
4. **Tabs** as text with counts on a 2 px ink rule; the active tab is bold with a catalogue-blue underline. **Role tabs** (only with more than one role)
   are a small segmented control under them, "Rooli: Kirjoittanut 7 | Kääntänyt 28 | Kansikuva 1".
5. **Toolbar:** type filters as text links with counts (the active one underlined in blue), name filter, sort, Lista / Kannet.
   **The list reads like catalogue entries:** decade headings in Literata on a rule; each row has the title in the reading face, the original title in italics
   with its year and series, then the printings in the interface face ("WSOY 1976, 1984, 1990", each year a link), genre as a dot with its name, and the
   printing count. For translations, the row shows the author and the original year instead.
6. **Sidebar without boxes:** genre bars, the most common tags as a comma-separated list with counts, links in two columns, the change history link.

**Sparse people** (Eevien Tan, Safa Huovinen): no portrait column, only the facts that exist, a one-sentence summary instead of the timeline, a heading
("Kansikuvat, 1 kirja") instead of tabs, no toolbar; the sidebar has only links. Same rules as the agreed missing data rule.

**Phone:** portrait 96 px beside the name, the facts full width under them, the timeline at 80 px, only the tab row sticks, the toolbar folds into
"Suodata ja järjestä", and each row's genre and count wrap under the text.

## Page heights (Le Guin, visitor, measured 2026-11-23)

| | Agreed mockup | This proposal | Change |
|---|---|---|---|
| Desktop 1,400 px | 4,080 px | 4,416 px | +8% |
| Phone 390 px | 5,287 px | 6,272 px | +19% |

A smaller increase than on the work page: moving the stats box into the facts list saves space that the larger type uses.

## What this changes in agreed decisions

Each can be taken separately (the first three are shared with the work page proposal):
1. **Fonts and colours** instead of Roboto / Roboto Slab and the PrimeReact indigo themes (a site-wide theme layer).
2. **Boxes:** the sidebar's stats, genre, tag and link boxes lose their frames.
3. **Chips:** roles and tags become text; type filters become text links (the agreed "filter = pill that turns dark when on" rule).
4. **The stats box** moves into the record as the "Tuotanto" line.
5. Page height grows by 8% on desktop and 19% on a phone.

Unchanged: everything the person plan decided about the timeline, tabs, role tabs, filters, URL state, sticky bars, the phone filter sheet and missing data.

## Open questions

- Adopt the identity for the whole site, for the person and work pages as a trial, or not at all? (Same question as on the work page proposal.)
- The authority heading line ("Le Guin, Ursula K., 1929–2018"): useful, or noise for most readers?
- Roles as text instead of chips?

## Decisions

_None yet._
