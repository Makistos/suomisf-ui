---
name: SuomiSF
description: Bibliography of Finnish-language speculative fiction (sf-bibliografia.fi)
colors:
  catalogue-indigo: "#3F51B5"
  catalogue-indigo-dark: "#9FA8DA"
  indigo-highlight: "rgba(63, 81, 181, 0.12)"
  ground: "#fafafa"
  ground-dark: "#121212"
  card: "#ffffff"
  card-dark: "#1e1e1e"
  ink: "rgba(0, 0, 0, 0.87)"
  ink-secondary: "rgba(0, 0, 0, 0.6)"
  hairline: "rgba(0, 0, 0, 0.12)"
  input-stroke: "rgba(0, 0, 0, 0.38)"
  success-green: "#689f38"
  danger-red: "#f44336"
typography:
  display:
    fontFamily: "Roboto Slab, serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.5px"
  headline:
    fontFamily: "Roboto Slab, serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: "36px"
  title:
    fontFamily: "Roboto Slab, serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1
  label:
    fontFamily: "Roboto Slab, serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: "24px"
    letterSpacing: "0.5px"
  body:
    fontFamily: "Roboto, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "normal"
  body-prose:
    fontFamily: "Roboto, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "16.8px"
    fontWeight: 400
    lineHeight: "31px"
rounded:
  none: "0px"
  sm: "4px"
  pill: "16px"
spacing:
  xs: "4px"
  md: "12px"
  gutter: "15px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.catalogue-indigo}"
    textColor: "{colors.card}"
    rounded: "{rounded.sm}"
    padding: "8px 10.5px"
  input-text:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "12px"
  card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.sm}"
  chip:
    backgroundColor: "{colors.hairline}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 12px"
  tag-success:
    backgroundColor: "{colors.success-green}"
    textColor: "{colors.card}"
    rounded: "{rounded.sm}"
    padding: "4px 6.4px"
  menubar:
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "12px"
  tab-active:
    textColor: "{colors.catalogue-indigo}"
    backgroundColor: "{colors.card}"
---

# Design System: SuomiSF

## Overview

**Creative North Star: "The Card Catalogue"**

SuomiSF is a reference work, not a showcase. Like a library card catalogue, its job is to hold a great many exact facts, keep them in order and lead from one record to the next. The interface stays quiet so the record can speak: the dense bibliographic data, the cross-links and the book covers.

The system is stock PrimeReact on its Material "mdc indigo" theme, deliberately close to its defaults. Components are quiet and utilitarian. Density and scanability come before flourish, because the main users are admin editors entering data and bibliographers checking it. Identity sits in a few consistent details: Roboto Slab headings, the indigo page titles and the covers themselves. It does not come from custom decoration.

Light and dark themes follow the visitor's system setting (`prefers-color-scheme`), switching between `mdc-light-indigo` and `mdc-dark-indigo`. Everything is coloured through the theme's CSS variables, so it changes with the theme.

**Key Characteristics:**
- Stock PrimeReact Material components; minimal custom styling
- Roboto Slab for headings, Roboto for everything else
- Catalogue Indigo used sparingly, for identity and navigation
- Gently rounded 4px corners throughout; square-cornered covers
- Dense, scannable layouts on a 1140px container
- Automatic light and dark themes driven by theme variables

## Colors

A restrained Material palette: one indigo accent on neutral grey surfaces, with status colours only where they mean something.

### Primary
- **Catalogue Indigo** (light theme; periwinkle in the dark theme): the site's identity colour. Used sparingly, for identity and navigation: page titles (`h1`), the active tab, links and primary actions. Comes from the theme variable `--primary-color`, so the dark theme swaps it for the lighter periwinkle automatically. Its translucent tint (`--highlight-bg`) marks selected rows and options.

### Neutral
- **Ground** (light grey; near-black in the dark theme): the page background (`--surface-ground`).
- **Card** (white; dark grey in the dark theme): cards, menus, inputs and dialogs (`--surface-card`).
- **Ink** (87% black): body text and h2 titles (`--text-color`).
- **Secondary Ink** (60% black): small uppercase section labels, metadata and helper text (`--text-color-secondary`).
- **Hairline** (12% black): borders, dividers and chip fills (`--surface-border`).
- **Input Stroke** (38% black): the outline of text inputs.

### Status
- **Success Green**: `Tag` severity success. On white text it measures 3.17:1, below AA for its 12px text; a darker shade or dark text is needed.
- **Danger Red**: destructive actions and errors only.

### Named Rules
**The Sparing Indigo Rule.** Catalogue Indigo marks identity and navigation: page titles, active tabs, links and primary actions. It is never a background for content areas or decoration.

**The Theme Variable Rule.** Interface colours come from the theme's CSS variables (`--primary-color`, `--surface-*`, `--text-color*`), never from hex values, so both themes stay correct. The one exception is data-visualisation palettes in the stats charts.

## Typography

**Display Font:** Roboto Slab (with serif fallback)
**Body Font:** Roboto (with Helvetica Neue, Helvetica, Arial, sans-serif)

**Character:** The slab serif gives headings the sturdy, typewritten feel of a catalogue card. Plain Roboto keeps the dense data and forms neutral and legible.

### Hierarchy
- **Display** (700, 32px, line-height 1, uppercase, 0.5px tracking, Catalogue Indigo): the entity title on detail pages, such as a work's title.
- **Headline** (700, 28px/36px, sentence case, Catalogue Indigo): the front page's site heading.
- **Title** (600, 24px, line-height 1, Ink): secondary titles such as a work's author line.
- **Label** (700, 14px/24px, uppercase, 0.5px tracking, Secondary Ink): section labels ("Genret", "Asiasanat", "Viimeisimmät lisäykset").
- **Body** (400, 16px, Roboto, Ink): lists, tables, forms and metadata.
- **Body Prose** (400, 16.8px/31px, Roboto): longer descriptive text, such as the front page introduction or work descriptions. Kept to a readable column (about 860px).

### Named Rules
**The Slab-for-Headings Rule.** Roboto Slab is for headings and section labels only; all data, forms and running text use Roboto.

## Layout

Content sits in a centred container with a maximum width of 1140px and 15px side gutters. It is laid out with PrimeFlex's 12-column grid and utility classes (PrimeFlex breakpoints: 576 / 768 / 992 / 1200px; `App.css` adds a 960px breakpoint). Reading-focused pages narrow to an 860px column with generous vertical padding (40px top, 48px bottom).

Spacing follows PrimeFlex's 0.25rem (4px) steps. In use: 4px (tag padding), 12px (menu and input padding), 24px (column padding) and 40px (section separation). Layouts are dense on purpose: lists and tables favour showing more records over more whitespace.

Detail pages place the cover beside the data on wide screens and stack them on narrow ones. The main menu and its search box have to fit a 390px phone screen. They currently do not: every page overflows sideways by 33px (see the audit).

## Elevation & Depth

This is a hybrid system following stock Material. Content cards lift slightly with PrimeReact's default three-layer Material shadow, while navigation stays flat. The menubar is outlined with a hairline border and has no shadow. Overlays (dialogs, dropdowns, toasts) use the theme's own elevation. Depth is never added by hand.

### Shadow Vocabulary
- **Card elevation** (`box-shadow: rgba(0,0,0,0.08) 0 1px 8px 0, rgba(0,0,0,0.1) 0 3px 4px 0, rgba(0,0,0,0.1) 0 1px 4px -1px`): PrimeReact `Card` default, used for grouped content such as chart panels and info boxes.

### Named Rules
**The Theme Elevation Rule.** Only the theme's own shadows are used. No custom shadows, glows or layered effects.

## Shapes

Gently rounded corners (4px, `--border-radius`) on buttons, inputs, cards, tags and the menubar. Chips are pill-shaped (16px). Book covers are always square-cornered (0px) and unframed, so they look like the physical objects they represent. Dividers are 1px hairlines.

## Components

Stock PrimeReact Material components, used as they come. They are quiet and utilitarian.

### Buttons
- **Shape:** gently rounded (4px)
- **Primary:** Catalogue Indigo background with white text (dark text on periwinkle in the dark theme), compact padding (8px 10.5px), 14px medium weight, sentence case.
- **Text buttons:** used for secondary actions inside forms and dialogs.
- **Destructive:** Danger Red, only for delete actions, always behind a confirmation dialog.
- **Admin actions:** collected in a floating SpeedDial on entity pages (new, edit, delete, and related actions such as "Muokkaa novelleja").

### Chips
- **Style:** Hairline-tinted fill, Ink text, pill shape (16px), 0 12px padding.
- **Use:** compact lists of values such as aliases or selected items.

### Tags
- **Style:** PrimeReact `Tag`: 4px corners, 12px bold text, severity colours (genre and keyword tags).
- **Note:** the white-on-green success tag fails contrast for 12px text.

### Cards / Containers
- **Corner Style:** 4px
- **Background:** Card surface (white, or dark grey in the dark theme)
- **Shadow Strategy:** theme card elevation (see Elevation & Depth)
- **Border:** none
- **Internal Padding:** theme default

### Inputs / Fields
- **Style:** outlined Material input: Card background, 1px Input Stroke border, 4px corners, 12px padding, 16px text.
- **Focus:** the theme's Material focus treatment (border changes to Catalogue Indigo).
- **Labels:** float labels (`p-float-label`) in forms.
- **Error:** the `p-invalid` border plus an error message below the field.

### Navigation
- **Menubar:** a PrimeReact `Menubar` outlined with a hairline border and 4px corners, transparent in the light theme and card-grey in the dark. It holds the "SuomiSF" wordmark in Catalogue Indigo, Roboto 16px items, the account menu and the site search (an autocomplete with the "Vain nimet" checkbox inside the field).
- **Tabs:** PrimeReact `TabView`. The active tab has Catalogue Indigo text, medium weight and an indigo underline.

### Covers (Signature Component)
Book cover images are the system's only ornament. They are square-cornered and unframed, typically 150px wide on detail pages (PrimeReact `Image` with preview), and laid out in rows on the front page and in cover views.

## Do's and Don'ts

### Do:
- **Do** use PrimeReact components with their theme defaults before writing custom CSS.
- **Do** colour through theme variables (`--primary-color`, `--surface-card`, `--surface-border`, `--text-color`, `--text-color-secondary`) so both themes keep working.
- **Do** use Catalogue Indigo for page titles, active states, links and primary actions only.
- **Do** keep Roboto Slab for headings and the uppercase 14px section labels; use Roboto for everything else.
- **Do** keep 4px corners on controls and square corners on covers.
- **Do** make links inside running text distinguishable by more than colour (an underline, or at least 3:1 contrast against the surrounding text).
- **Do** keep layouts dense and scannable; the main users enter and check data.

### Don't:
- **Don't** hard-code hex colours in components; chart data palettes are the only exception.
- **Don't** let links fall back to the browser's default blue (`#0000EE`); it currently happens in the main content area.
- **Don't** add custom shadows, gradients or decorative effects; depth comes from the theme only.
- **Don't** use white text on the light green success colour at small sizes (3.17:1).
- **Don't** introduce a second icon set or another CSS framework; consolidate on what is already loaded.
