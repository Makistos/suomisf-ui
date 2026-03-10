# Feature Modules

Each feature lives under `src/features/<name>/` and encapsulates types, route pages, and UI components for one domain entity.

## work

Books and other long-form works in the database.

**Key types:** `Work`, `WorkSummary`, `WorkBrief`
**Key components:** `WorkDetails`, `WorkForm`, `WorkList`, `WorkSummary`, `WorkTooltip`, `OmnibusPicker`
**Routes:** `/works/:id`

A work may have multiple editions, associated short stories (omnibus collections), tags, awards, and contributions (author/translator roles). Works belong to a book series (`bookseries`).

## edition

A specific published edition of a work.

**Key types:** `Edition`, `EditionImage`
**Key components:** `EditionDetails`, `EditionForm`, `EditionList`, `EditionOwnership`, `EditionWishlist`
**Routes:** `/editions/:id`

Editions track physical details: publisher, year, binding, format, ISBN, page count, size (`publication-size`), and cover images. Authenticated users can mark editions as owned or wishlisted.

## short

Short stories and novellas.

**Key types:** `ShortStory`, `ShortStoryBrief`
**Key components:** `ShortDetails`, `ShortForm`, `ShortList`, `SimilarShorts`
**Routes:** `/shorts/:id`, `/shortstoryindex`

Short stories appear both in book editions (collections/anthologies) and in magazine issues. Each story tracks contributors (author, translator), tags, genres, and awards.

## magazine

Magazines and fanzines.

**Key types:** `Magazine`, `MagazineType`
**Key components:** `MagazineDetails`, `MagazineForm`, `IssueList`
**Routes:** `/magazines`, `/magazines/:id`

Magazines group issues. They carry an ISSN, type classification, publisher, description, and tags.

## issue

Individual issues of a magazine.

**Key types:** `Issue`
**Key components:** `IssueDetails`, `IssueForm`
**Routes:** `/issues/:id`

An issue belongs to a magazine and contains a list of short stories. It records publication year, issue number, and optional cover image.

## article

Articles published in magazine issues (distinct from short fiction).

**Routes:** `/articles/:id`

## person

Authors, translators, editors, and other contributors.

**Key types:** `Person`, `PersonBrief`
**Key components:** `PersonDetails`, `PeopleList`, `PersonMagazineControl`
**Routes:** `/people`, `/people/:id`

Persons track biography details (birth/death dates, nationality), all roles they have contributed in, and associated awards.

## publisher

Book and magazine publishers.

**Key types:** `Publisher`
**Key components:** `PublisherDetails`, `PublisherList`
**Routes:** `/publishers`, `/publishers/:id`

## bookseries

Named series that group related works (e.g., a trilogy).

**Key types:** `Bookseries`
**Routes:** `/bookseries`, `/bookseries/:id`

## pubseries

Publisher-defined series (imprint series).

**Key types:** `Pubseries`
**Routes:** `/pubseries`, `/pubseries/:id`

## tag

Genre and thematic tags applied to works and short stories.

**Key types:** `Tag`, `TagGroup`
**Key components:** `SFTag`, `SFTagGroup`, `TagForm`
**Routes:** `/tags`, `/tags/:id`

Tags are organized into groups. The tag detail page lists all works and stories carrying that tag.

## award

Science fiction awards (Finnish and international).

**Key types:** `Award`, `AwardCategory`
**Key components:** `AwardDetails`, `AwardList`
**Routes:** `/awards`, `/awards/:id`

## genre

Genre classification used across works and short stories.

**Key components:** `GenreList`
**Routes:** Referenced from stats and work detail pages.

## stats

Statistical dashboards visualizing the database contents.

**Key components:** `EditionStatsPanel`, `WorkStatsPanel`, `GenreChart`, `PublisherChart`, `AuthorChart`, `ShortStoryChart`
**Routes:** `/stats`

Charts are rendered with Chart.js. Stats are fetched from dedicated API endpoints under `stats/*`.

## changes

Displays recent changes to database records.

**Key components:** `EntityChanges`
**Routes:** `/changes`, `/latest`

## images

Cover image management (upload, view, associate with editions).

**Key components:** `ImageGallery`, `CoverImageList`

## user

Authentication and user profile management.

**Key types:** `User`
**Key components:** Login dialog, registration form, profile page
**Routes:** `/login`, `/users/:id`

User sessions are stored in `localStorage` as JWT access and refresh tokens.
