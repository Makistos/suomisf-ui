# Statistics page: chart review and implementation plan

Status: all phases (0–6) implemented 2026-10-13 (branch `stats-redesign` in both repos); see section 5. Covers the general statistics page
(`src/features/stats`) and the stats endpoints in `../suomisf/app/api_stats.py`
/ `impl_stats.py`. User statistics reuse the same components where noted.

## 1. How the charts show data now, and what to change

### Problems found

| Chart | Now | Problem |
|---|---|---|
| Teokset genreittäin | Pie, 16 genres | Pies only read for ≤ 6 parts; close slices can't be compared. A work in several genres counts in each, so the "whole" isn't a whole. `GenreColors` has key `VH` but the abbreviation is `VEH`, so Vaihtoehtohistoria gets no colour. |
| Kansallisuudet (books, stories) | Pie, top 20 | 20 slices; most are slivers. |
| Suurimmat kustantajat | Pie, 10–100 slices | 100 slices can't be read; colours cycle through 30 values so different publishers share a colour. The new user-stats publisher chart copies this. |
| Julkaisut vuosittain | Horizontal stacked bars, years down the page | Time normally runs left to right. With ~185 years the chart is ~3,800 px tall and can't be taken in at once. Up to 50 stacked colours (generated hues past 10). Publisher colours are assigned by rank, so changing the year range repaints publishers. |
| Vertailu (Finnish vs original year) | Two bar series per year | Two different events on one axis; the gap between them is the interesting part, and that isn't shown. |
| Kumulatiiviset painokset | Line | Fine. |
| Lehdet | Columns per year, one series | Fine as a total; hides which magazine. |
| Intro paragraph | Five figures inside running text | Headline figures are hard to scan in prose. |
| Tuotteliaimmat | Table | Fine; a bar inside the count column would help comparison. |

Palette: the language/publisher palette (`#0958D7, #D30031, …`) **fails** the
data-viz validator: `#31572C` is too dark and greyish, `#82C341` and `#FF696D`
can't be told apart with red-green colour blindness (ΔE 4.9, needs ≥ 8), and
5 of 10 colours are below 3:1 contrast. Charts also use Chart.js's default grey
text and grid on the dark theme, as no chart reads the theme's CSS variables.

### Principles for the new charts

- **Time runs left to right.** Per-year charts are vertical columns with a fixed
  height (~360 px); 185 one-year columns fit a 1,000 px card. Decades toggle stays.
- **Pies only for ≤ 6 parts that sum to a whole** (e.g. hardback / paperback /
  unknown). Rankings (genres, nationalities, publishers) become **horizontal
  bars**, sorted, top N + "Muut".
- **At most 7 colours + grey "Muut".** Beyond that, use a **heatmap** (rows =
  publisher/language/magazine, columns = decade or year, one-hue blue scale) or
  **emphasis** (selected item in indigo, others grey).
- **Colour follows the entity, not its rank.** Languages keep fixed colours;
  publishers get a colour from their all-time rank, so filters never repaint.
- **Count and share are separate statistics.** "How many" is a column chart;
  "what share" is a 100 % chart or a percentage line, as its own card or as a
  labelled toggle that renames the card's unit.
- **Every card names its unit** in a subtitle: teoksia / painoksia / henkilöitä
  / novelleja, and says how multi-valued data counts (e.g. "teos lasketaan
  jokaiseen genreensä").
- **Every chart has a table view** (the existing "Näytä data" pattern) and a
  drill-down where items map to works.
- **Distributions get histograms; trends of a measure get a median line** with
  a shaded 25–75 % band (Chart.js line with `fill` between two datasets).
- **Spans get timelines** (Chart.js floating bars `[start, end]`).
- **Coverage gets meters** (PrimeReact `ProgressBar`), headline figures get
  **stat tiles**.
- **Filters sit in one row at the top of a tab** and apply to every card in it
  (genre, year range, material Kirjat / Novellit). Cards keep only their own
  grouping toggles.
- **Dark mode:** axis, grid, legend and tooltip colours come from
  `--text-color`, `--text-color-secondary` and `--surface-border`; the
  categorical palette has a light and a dark column.

## 2. Target structure

| Tab | Cards (statistic → form) |
|---|---|
| **Yleiskatsaus** | Stat tiles: teoksia, painoksia, novelleja, henkilöitä, kustantajia, lehtinumeroita, palkintoja; sivuja yhteensä / pinon korkeus · Kovakantisten osuus (meter) |
| **Julkaisut ajallisesti** | Ensipainokset vuosittain (columns; group by kieli / kustantaja / genre) · Alkuteokset vuosittain (columns by language) · Suomennosviive: jakauma (histogram) · Suomennosviive: mediaani vuosikymmenittäin (line + band) · Kotimaisten osuus vuosittain (% line) · Uudet vs. uusintapainokset (stacked columns) · Kumulatiiviset ensipainokset (line) · Kustantajat × vuosikymmen (heatmap, replaces 50-colour stacks) |
| **Sisältö** | Teokset genreittäin (horizontal bars) · Genret vuosikymmenittäin (heatmap) · Teostyypit (bars) · Yleisimmät asiasanat per tyyppi (bars with tag-type selector) · Alagenret vuosikymmenittäin (heatmap) · Kirjasarjat: pisimmät (table + bars) · Sarjaan kuuluvien osuus (% line) · Painosmäärät per teos (histogram 1/2/3/4/5+) · Eniten painetut (table) · Uudelleensuomennokset (count + table) |
| **Henkilöt** (material switch Kirjat / Novellit / Kaikki) | Henkilöt kansallisuuksittain (bars) · Teokset tekijän kansallisuuden mukaan (bars) · Kansallisuudet vuosikymmenittäin (100 % stacked columns, top 6 + Muut) · Tuotteliaimmat (table with inline bars; role filter, "Kaikki roolit" removed or renamed to "Kaikki roolit yhteensä") · Kääntäjät lähdekielittäin (heatmap translator × language, top 20) · Kirjoittajat syntymävuosikymmenittäin (columns, with coverage note) |
| **Kustantajat** | Suurimmat kustantajat (bars, top N + Muut, genre filter) · Aktiiviset kustantajat vuosittain (line) · Keskittyminen: 5 suurimman osuus (% line) · Kustantajien toiminta-ajat (timeline, top 30) · Kustantajasarjat (bars, coverage note: 22 % of editions) |
| **Novellit** | Novellit vuosittain (columns by language) · Novellityypit (bars) · Novellit julkaisukanavittain: lehti / kokoelma / antologia (stacked columns) |
| **Lehdet** | Numerot vuosittain lehdittäin (heatmap magazine × year, or stacked top 6 + Muut) · Artikkelit vuosittain (columns) · Lehtien ilmestymisajat (timeline) · Novellit lehdittäin (bars) |
| **Kirjat esineinä** | Sivumäärän jakauma (histogram) · Sivumäärän mediaani vuosittain (line + band) · Paksuimmat (table) · Sidosasu vuosittain (100 % columns) · Korkeuden jakauma (histogram) |
| **Palkinnot** | Suomennettujen osuus palkinnoittain (horizontal % bars) · Palkinnosta suomennokseen (dot/box per award) · Palkituimmat kirjailijat (table) |
| **Kattavuus** (public); admin: **Kävijät**, **Käynnit** (unchanged) | Kattavuus: meters for editions with cover / pages / ISBN / verified, people with birth year / nationality / picture |

Where today's statistics go (numbers from the earlier review):
1–5 → Yleiskatsaus tiles · 6 → Sisältö · 7, 8, 15, 16 → Henkilöt (material
switch replaces the duplicate code in `short-story-chart.tsx`) · 9, 10, 12 →
Julkaisut ajallisesti as separate cards · 11 replaced by the translation-delay cards
(the old comparison stays available as a toggle on the first-editions card) ·
13 → Kustantajat · 14 → Lehdet · 17 → Novellit.

User statistics: use the same `RankedBarChart` for publishers / languages /
work types. **Open question:** the user-stats publisher chart was just made a
pie on request; with 10–100 publishers, a bar chart reads better.

## 3. Implementation plan

Each phase is its own branch, merged with `--no-ff`, with a CHANGELOG entry in
each repo it touches. Every new endpoint gets a backend test (snapshot where the
data is stable); each tab gets an E2E smoke test (the existing axe check covers
accessibility).

### Phase 0 — Chart foundation (no visible new statistics)

Frontend, under `src/features/stats/charts/`:
- `palette.ts`: validated categorical palette (8 slots, light + dark columns),
  sequential blue ramp, "Muut" grey; fixed `LANGUAGE_COLORS`; helper giving
  publishers a stable colour by all-time rank. Validate with the data-viz
  validator in both modes.
- `use-chart-theme.ts`: reads theme CSS variables and returns Chart.js
  options for text, grid, tooltip; sets `ChartJS.defaults` once.
- `StatCard`: title, unit subtitle, optional card toggles, chart slot,
  "Näytä data" table, coverage note.
- `TabFilterBar` + context: genre, year range, material, shared by a tab's cards.
- `YearColumnsChart`: vertical columns over years/decades, group by a
  dimension, top N + Muut, count / share mode, drill-down callback.
- `RankedBarChart`: horizontal bars, top N + Muut, drill-down.
- `Heatmap`: CSS grid component (no new dependency), one-hue scale, cell
  tooltip and keyboard focus, table view.
- `Histogram`, `MedianBandLine`, `Timeline` (floating bars), `StatTiles`.
- Fix the `VH`/`VEH` genre colour key.

Backend: a small helper in `impl_stats.py` for "first edition" and genre
filters (both repeated in several functions now); measure endpoint times and
add caching only for endpoints over ~300 ms.

### Phase 1 — New structure, existing statistics in new forms

- Tabs as in section 2; tab and filters in the URL query (shareable links).
- Yleiskatsaus tiles (extend `/api/stats/misc` with story, person, publisher,
  issue and award counts).
- Genre, nationality and publisher pies → `RankedBarChart`.
- Julkaisut vuosittain → `YearColumnsChart` (language / publisher / genre);
  publisher view gets the heatmap alternative.
- Henkilöt tab with the material switch; delete the duplicate story charts.
- Lehdet: issues per magazine (extend `/api/stats/issuesperyear` with
  `magazine_id`).

### Phase 2 — New statistics from edition and work data

Endpoints (each `GET /api/stats/<name>`, optional `genre`):
- `translationlag`: per work, first Finnish edition year − original year →
  histogram buckets and median / quartiles per decade.
- `editiontypes`: first editions vs reprints per year.
- `editionsperwork`: histogram + top list.
- `retranslations`: works with editions of version > 1 by a different
  translator (check the data first: how `version` and translators are recorded).
- `bindingsbyyear`, `pagesbyyear` (median + quartiles), `pagehistogram`,
  `sizehistogram`.
- Domestic share per year is computed in the frontend from `worksbyyear`.

### Phase 3 — People and content

- `nationalityworks` (works by contributor nationality, role filter),
  `nationalitybydecade`, `translatorlanguages`, `birthdecades` (with coverage
  count; 55 % of people have a birth year).
- `tagcounts?type=` (top tags per tag type), `tagsbydecade?type=Alagenre`.
- `worktypecounts`, `genresbydecade`, `bookseries` (longest series, share in
  a series per year).

### Phase 4 — Publishers, stories and magazines

- `publisherspans` (first/last edition year), `activepublishers` per year,
  `publisherconcentration` (top-5 share per decade), `pubseriescounts`.
- `storychannels` (stories per year by magazine / collection / anthology),
  `storytypes`.
- `articlesbyyear`, `magazinespans`, `storiespermagazine`.

### Phase 5 — Awards

- `awardtranslated`: per award, winners with a Finnish edition / all winners.
- `awardlag`: years from award to first Finnish edition.
- `topawarded`: people with most awards.
Check first how winners link to works (`awarded.work_id` vs `story_id` vs
`person_id`) and how many winning works exist in the database at all.

### Phase 6 — Coverage and user aggregates

- Public `coverage` endpoint and Kattavuus tab (meters).
- Optional public "most owned works" from `userbook`, shown only for works
  owned by at least 3 users. "Most read" waits until `userwork` has data.

## 4. Decisions (2026-10-13)

1. User-stats publisher chart stays a pie for now.
2. Heatmap is a self-built CSS-grid component (no new dependency).
3. Tab names are provisional; revisit once the new tabs exist.
4. "Kaikki roolit" in Tuotteliaimmat stays as it is.
5. Kattavuus (phase 6) is a public tab.
6. The admin tabs **Kävijät** and **Käynnit** stay exactly as they are.

## 5. Progress

Phases 0 and 1 are done:

- Shared pieces in `src/features/stats/charts/`: validated palette, theme
  hook, `StatCard`/`DataView`/`FilterBar`, `YearColumnsChart`,
  `RankedBarChart`, `Heatmap`, `StatTiles`/`Meter`, drill-down dialogs,
  year helpers. Tabs in `src/features/stats/tabs/`. The seven old chart
  components were deleted; user stats use `CollectionYearsCard`.
- Backend: `/api/stats/misc` overview counts, `origworksbyyear?genre=`,
  `issuesperyear?by=magazine`.

Differences from the plan:

- `Histogram`, `MedianBandLine` and `Timeline` are built in the phase that
  first uses them (2 and 4), not in phase 0.
- Henkilöt has Kirjat / Novellit; "Kaikki" needs combined endpoints (phase 3).
- Grouping first editions by genre waits for phase 3 (`genresbydecade`).
- The cumulative chart lost its language filter and the 11-line
  "Genret erikseen" mode; it keeps the total and six genre groups.
- The 10/20/30/50 biggest-publishers choice moved to the publisher heatmap;
  the stacked chart shows the 7 biggest + Muut.
- Default year range starts at 1900 (earlier years selectable).

Phase 2 is done:

- Backend endpoints (all take `?genre=`): `translationlag` (`start`/`end`
  limit the Finnish edition year), `editiontypes`, `editionsperwork`,
  `retranslations`, `bindingsbyyear`, `pagesbyyear` (`by=decade`),
  `pagehistogram` and `sizehistogram` (`start`/`end`). All under 30 ms, so
  no caching.
- New chart pieces: `Histogram` (labelled, possibly uneven bins) and
  `MedianBandLine` (median + quartile band).
- Julkaisut ajallisesti: Painokset vuosittain (first / new version / reprint),
  Suomennosviive (histogram) and its median by decade, Kotimaisten osuus.
- Sisältö: Painoksia teosta kohden, Eniten painetut, Uudelleensuomennokset
  (summary + new translations by decade) and a table of retranslated works.
- New tab Kirjat esineinä (`?tab=kirjat`): page and height histograms, page
  count median by year/decade, binding by year, thickest editions.

Differences from the plan:

- A retranslation is detected from translators, not `version`: a work's
  editions that share a translator form one translation; two or more
  translations = retranslated (123 works).
- Kirjat esineinä counts every printing, reprints included.
- Data notes: several editions have a year-like page count (2 008–2 018
  pages) and one has 3 602; they top the Paksuimmat table.

Phase 3 is done:

- Backend (people endpoints take `material=books|stories|all`, `role`,
  `genre`, `storytype`): `contributornationalities`, `topcontributors`,
  `nationalitiesbydecade`, `birthdecades`, `translatorlanguages`; content:
  `worktypecounts`, `genresbyyear`, `tagcounts`, `tagsbydecade`,
  `bookseries`. All under 200 ms.
- People counts now include edition-level roles (translator, cover artist,
  illustrator). The old `personcounts`/`nationalitycounts` only looked at
  work contributors, so the book translator list was empty; the frontend no
  longer uses them. `filterworks?nationality=` uses the same base, so a
  clicked bar lists the same works it counts.
- Henkilöt: Kirjat / Novellit / Kaikki; one role filter for the whole tab
  (Kaikki roolit counts any role). Cards: Kansallisuudet (people or
  works), Tuotteliaimmat, Kansallisuudet vuosikymmenittäin (6 fixed
  nationality colours + Muut), Syntymävuosikymmenet (with coverage),
  Kääntäjät lähdekielittäin (heatmap).
- Sisältö: Teostyypit, Genret vuosikymmenittäin, Yleisimmät asiasanat
  (tag type selector), Asiasanat vuosikymmenittäin (default Alagenre),
  Pisimmät kirjasarjat, Sarjaan kuuluvien osuus.
- Julkaisut ajallisesti: first editions can be grouped by genre group.

Differences from the plan:

- Tuotteliaimmat follows the tab's role filter instead of its own role
  dropdown.
- Genre groups now use colour slots 0–5 in stacking order (Fantasia's
  green sat next to Kauhu's red, which colour-blind readers can't tell
  apart); the cumulative chart changes colour accordingly.

Phase 4 is done:

- Backend: `pubseriescounts` (genre), `storychannels` (storytype),
  `magazinestats`, `magazinecontents`. All under 120 ms.
- New chart piece: `Timeline` (floating bars on a year axis).
- Kustantajat: Aktiiviset kustantajat, Keskittyminen (5 biggest per
  decade), Kustantajien toiminta-ajat (30 biggest), Kustantajasarjat.
- Novellit: Julkaisukanavat (magazine / collection / anthology by year of
  first Finnish appearance), Tekstityypit.
- Lehdet: Lehtien sisältö vuosittain (by text type), Lehtien
  ilmestymisajat, Tekstit lehdittäin.

Differences from the plan:

- `publisherspans`, `activepublishers` and `publisherconcentration` are
  computed in the frontend from `publishersbyyear`, so they count works by
  the year a publisher first published them (reprint-only years don't
  count as activity).
- `articlesbyyear` became `magazinecontents`: articles are not linked to
  issues; magazine articles are stories of type Artikkeli.
- An anthology is a book whose stories have more than one author; a
  story's channel is where it first appeared (magazine wins a same-year
  tie).
- Data note: edition 10483 (Heureka ja muita kirjoituksia, Basam Books)
  has year 1848, which stretches Basam's span back to 1848.

Phase 5 is done:

- Backend: `awardcounts`, `awardlag` (foreign awards → first Finnish
  publication, works and stories), `topawarded`.
- Palkinnot tab (`?tab=palkinnot`): Palkitut palkinnoittain (all /
  foreign / domestic), Palkituimmat kirjailijat, Palkinnosta suomennokseen
  (histogram, "ennen" bin for negative delays), Viive palkinnoittain
  (table with quartile bars, scale clamped to −10…20 years).

Differences from the plan:

- "Suomennettujen osuus palkinnoittain" is not possible: `awarded` only
  holds winners that are in the bibliography (the importer saves matched
  works and stories), so untranslated winners are unknown. The tab says
  so; "Palkitut palkinnoittain" takes its place.

Phase 6 is done:

- Backend: `coverage` (editions, works, people, stories: total and how
  many have each detail).
- Public Kattavuus tab (`?tab=kattavuus`) with a meter per detail.
  Meters never round an incomplete share up to 100 % (or a non-zero one
  down to 0 %).

Differences from the plan:

- "Most owned works" is not built: only 4 users have collections, so even
  a list limited to works owned by 3+ users would reveal what individual
  users own.
- Data note: 5 584 `personimage` rows have an empty `src`; they are not
  counted as pictures (1 945 people, 25 %, have one).

Open: with 11 tabs the tab bar scrolls at desktop width; tab names were
to be revisited once all tabs exist (decision 3).
