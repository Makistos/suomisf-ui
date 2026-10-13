// Colours for the statistics charts.
//
// The categorical palette is the data-viz reference palette, checked with its
// validator against this site's card surfaces (#ffffff light, #1e1e1e dark):
// adjacent pairs stay apart for colour-blind readers in both themes. Three
// light-theme slots are under 3:1 contrast, so every chart keeps a legend and
// a table view. The slot order is part of the check: stacks are drawn in slot
// order, and anything past the slots folds into "Muut".

export const SERIES_LIGHT = [
    '#2a78d6', '#eb6834', '#1baf7a', '#eda100',
    '#e87ba4', '#008300', '#6250d6', '#e34948',
];

export const SERIES_DARK = [
    '#3987e5', '#d95926', '#199e70', '#c98500',
    '#d55181', '#008300', '#9085e9', '#e66767',
];

export const OTHER_LIGHT = '#a3a29e';
export const OTHER_DARK = '#6b6a66';

export const OTHERS_LABEL = 'Muut';

// Most stacked charts show at most this many named series plus "Muut".
export const MAX_SERIES = 7;

// Original languages with their own colour, in slot order (most common
// first). Every other language is drawn as "Muut".
export const LANGUAGE_SLOTS: Record<string, number> = {
    'englanti': 0,
    'suomi': 1,
    'ruotsi': 2,
    'saksa': 3,
    'ranska': 4,
    'tanska': 5,
    'venäjä': 6,
};

export const COLOURED_LANGUAGES = Object.keys(LANGUAGE_SLOTS);

// Nationalities with their own colour, in slot order (most common first).
// Every other nationality is drawn as "Muut".
export const NATIONALITY_SLOTS: Record<string, number> = {
    'Yhdysvallat': 0,
    'Suomi': 1,
    'Iso-Britannia': 2,
    'Ruotsi': 3,
    'Saksa': 4,
    'Ranska': 5,
};

export const COLOURED_NATIONALITIES = Object.keys(NATIONALITY_SLOTS);

// Genres shown in the statistics, with Finnish names.
export const GENRE_NAMES: Record<string, string> = {
    'SF': 'Science Fiction',
    'F': 'Fantasia',
    'K': 'Kauhu',
    'nSF': 'Nuorten SF',
    'nF': 'Nuorten fantasia',
    'nK': 'Nuorten kauhu',
    'PF': 'Poliittinen fiktio',
    'VEH': 'Vaihtoehtohistoria',
    'lF': 'Lasten fantasia',
    'lSF': 'Lasten SF',
    'rajatap': 'Rajatapaus',
};

export const genreOptions = [
    { label: 'Kaikki genret', value: 'all' },
    ...Object.entries(GENRE_NAMES).map(([value, label]) => ({ label, value })),
];

// Genres combined into groups (adult, youth and children's versions
// together), each with a fixed colour slot. Slots follow the list order,
// which is also the stacking order, so neighbouring groups keep the
// validated colour-blind separation.
export const GENRE_GROUPS = [
    { key: 'SF', label: 'Science Fiction', slot: 0, genres: ['SF', 'nSF', 'lSF'] },
    { key: 'F', label: 'Fantasia', slot: 1, genres: ['F', 'nF', 'lF'] },
    { key: 'K', label: 'Kauhu', slot: 2, genres: ['K', 'nK'] },
    { key: 'PF', label: 'Poliittinen fiktio', slot: 3, genres: ['PF'] },
    { key: 'VEH', label: 'Vaihtoehtohistoria', slot: 4, genres: ['VEH'] },
    { key: 'rajatap', label: 'Rajatapaus', slot: 5, genres: ['rajatap'] },
];
