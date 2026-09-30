// Minimal typed builders for unit tests. Only the fields a test cares about
// need to be given; everything else gets an empty-ish default.
import type { Edition } from "@features/edition";
import type { Work } from "@features/work";
import type { Short } from "@features/short";
import type { Contribution } from "../types/contribution";

export const contribution = (
    personId: number, roleId: number, name = `Person ${personId}`,
    roleName = roleId === 1 ? 'Kirjoittaja' : `Role ${roleId}`
): Contribution => ({
    person: { id: personId, name, alt_name: '' },
    role: { id: roleId, name: roleName },
} as Contribution);

export const edition = (fields: Partial<Edition> = {}): Edition => ({
    id: 1,
    version: 1,
    editionnum: 1,
    pubyear: 2000,
    title: 'Title',
    subtitle: '',
    isbn: '',
    binding: { id: 1, name: 'Ei tietoa' },
    images: [],
    owners: [],
    wishlisted: [],
    contributions: [],
    work: null,
    ...fields,
} as Edition);

export const work = (fields: Partial<Work> = {}): Work => ({
    id: 1,
    title: 'Title',
    orig_title: '',
    author_str: '',
    pubyear: 2000,
    contributions: [],
    editions: [],
    stories: [],
    ...fields,
} as Work);

export const short = (fields: Partial<Short> = {}): Short => ({
    id: 1,
    title: 'Short',
    contributors: [],
    ...fields,
} as Short);
