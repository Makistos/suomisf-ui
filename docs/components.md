# Components

## Global Shared Components (`src/components/`)

### MainMenu (`mainmenu.tsx`)

The application-wide top navigation bar, built on PrimeReact `Menubar`.

- Primary navigation: Books, Magazines, Short Stories
- "Muut" (Other) submenu: People, Publishers, Book Series, Publisher Series, Tags, Awards, Non-fiction, Statistics
- Global autocomplete search field (searches works, people, publishers, etc.)
- Right-hand user menu: login/register when logged out; profile link and logout when logged in

### Contributor*Control components

A family of CRUD form components for adding and editing database entries. Rendered as dialogs or inline forms. Only visible to authenticated users. Examples:

- `ContributorWorkControl` — add/edit works
- `ContributorEditionControl` — add/edit editions
- `ContributorMagazineControl` — add/edit magazines
- `ContributorShortControl` — add/edit short stories

### ImageGallery (`image-gallery.tsx`)

Displays a set of cover images in a lightbox/carousel using PrimeReact `Galleria`. Used on edition and work detail pages.

### CoverImageList (`cover-image-list.tsx`)

Lists cover images associated with an edition. Includes upload and deletion controls for authenticated users.

## Feature-Level Components

Each feature module exposes its own components, consumed only by that feature's route pages (or by other features that need cross-domain references).

### Work feature

| Component | Purpose |
|---|---|
| `WorkDetails` | Full detail page for a work |
| `WorkSummary` | Compact summary card (used inside edition pages) |
| `WorkTooltip` | Hover tooltip showing brief work info |
| `WorkList` | Paginated/filterable list of works |
| `WorkForm` | Create / edit form for a work |
| `OmnibusPicker` | Multi-select picker for adding stories to an omnibus |

### Edition feature

| Component | Purpose |
|---|---|
| `EditionDetails` | Full detail page for an edition (publisher, year, binding, images) |
| `EditionList` | List of editions belonging to a work |
| `EditionForm` | Create / edit form for an edition |
| `EditionOwnership` | Toggle whether the current user owns this edition |
| `EditionWishlist` | Toggle whether the edition is on the user's wishlist |

### Short Story feature

| Component | Purpose |
|---|---|
| `ShortDetails` | Full detail page for a short story |
| `ShortList` | Filterable list of short stories |
| `ShortForm` | Create / edit form |
| `SimilarShorts` | List of thematically similar stories |

### Magazine feature

| Component | Purpose |
|---|---|
| `MagazineDetails` | Full detail page for a magazine |
| `MagazineForm` | Create / edit form |
| `IssueList` | List of issues belonging to a magazine |

### Issue / Article features

| Component | Purpose |
|---|---|
| `IssueDetails` | Full detail page for a magazine issue |
| `IssueForm` | Create / edit form for an issue |
| `ArticleDetails` | Full detail page for an article |

### Person feature

| Component | Purpose |
|---|---|
| `PersonDetails` | Full detail page (bio, works, roles, awards) |
| `PeopleList` | Filterable list of people |
| `PersonMagazineControl` | Manage a person's connection to magazines |

### Publisher feature

| Component | Purpose |
|---|---|
| `PublisherDetails` | Publisher page with associated works/series |
| `PublisherList` | List of all publishers |

### Tag feature

| Component | Purpose |
|---|---|
| `SFTag` | Inline tag badge/chip |
| `SFTagGroup` | Renders a grouped set of tags |
| `TagForm` | Create / edit form for a tag |

### Award feature

| Component | Purpose |
|---|---|
| `AwardDetails` | Award page with all winners by year |
| `AwardList` | List of all awards |

### Stats feature

| Component | Purpose |
|---|---|
| `EditionStatsPanel` | Charts for edition counts over time |
| `WorkStatsPanel` | Charts for work publication years |
| `GenreChart` | Pie/bar chart of genre distribution |
| `PublisherChart` | Publisher activity chart |
| `AuthorChart` | Most prolific authors chart |
| `ShortStoryChart` | Short story publication year chart |

## Shared Form Components (`src/components/forms/`)

Reusable primitive form controls built on top of PrimeReact inputs, integrated with React Hook Form:

- `AutoCompleteField` — autocomplete text input
- `ContributorField` — contributor (person + role) picker
- `DropdownField` — select dropdown
- `InputTextField` — plain text input
- `CheckBoxField` — checkbox

## UI Utilities (`src/utils/`)

| File | Purpose |
|---|---|
| `image-tooltip.tsx` | Renders a hoverable cover image tooltip |
| `image-view.tsx` | Constructs the full URL for an image from its path |
| `select-id.ts` | Helpers for extracting IDs from autocomplete selections |
| `country-utils.ts` | Country name / code lookup helpers |
