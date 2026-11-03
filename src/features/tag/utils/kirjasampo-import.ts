import { TagType } from '../types';

/** A tag as the import preview describes it. */
export interface PreviewTag {
    id: number;
    name: string;
    type: TagType | null;
}

/** One Kirjasampo tag from GET /api/work/<id>/tags/import/preview. */
export interface PreviewItem {
    name: string;
    raw_name: string;
    mapping: { action: 'omit' } | { action: 'replace'; tag: PreviewTag } | null;
    match: PreviewTag | null;
    on_work: boolean;
}

export interface PreviewGroup {
    section: string;
    items: PreviewItem[];
}

/** A row of the import table. Rows with the same name are kept in sync. */
export interface ImportRow {
    key: string;
    section: string;
    name: string;
    rawName: string;
    onWork: boolean;
    // An existing tag, or the typed name of a new one.
    localTag: PreviewTag | string;
    // Type for a new tag.
    typeId: number;
    skip: boolean;
}

export interface ImportItem {
    name: string;
    id: number | null;
    action: 'add' | 'replace' | 'omit';
    type_id?: number;
}

// Type a new tag gets from its Kirjasampo section; other sections give Aihe.
export const SECTION_TAG_TYPES: Record<string, string> = {
    'Henkilöt, toimijat': 'Toimija',
    'Tapahtumapaikat': 'Paikka',
    'Konkreettiset tapahtumapaikat': 'Paikka',
    'Tapahtuma-aika': 'Aika',
    'Tarkka aika': 'Aika',
};
export const DEFAULT_TAG_TYPE = 'Aihe';

/** Id of the default type for a new tag from a section. */
export const sectionTypeId = (section: string, types: TagType[]) => {
    const byName = (name: string) => types.find(t => t.name === name)?.id;
    return byName(SECTION_TAG_TYPES[section] ?? DEFAULT_TAG_TYPE) ?? byName(DEFAULT_TAG_TYPE) ?? 1;
};

/** True when saving the row would create a new tag. */
export const isNewTag = (row: ImportRow) => typeof row.localTag === 'string';

/**
 * Table rows for a preview: one per item, in page order. A new tag's type
 * defaults by section; a name in several sections takes the type of the
 * first, since its rows change together.
 */
export const previewRows = (groups: PreviewGroup[], types: TagType[]): ImportRow[] => {
    const nameTypes = new Map<string, number>();
    for (const { section, items } of groups) {
        for (const item of items) {
            if (!nameTypes.has(item.name)) nameTypes.set(item.name, sectionTypeId(section, types));
        }
    }
    return groups.flatMap(({ section, items }) => items.map(item => ({
        key: `${section}\u0000${item.name}`,
        section,
        name: item.name,
        rawName: item.raw_name,
        onWork: item.on_work,
        localTag: item.mapping?.action === 'replace'
            ? item.mapping.tag
            : item.match ?? item.name,
        typeId: nameTypes.get(item.name)!,
        skip: item.mapping?.action === 'omit',
    })));
};

/**
 * Import items to post for the rows, one per name. A name is omitted
 * only when all of its rows are skipped; otherwise the first kept row
 * decides.
 */
export const importItems = (rows: ImportRow[]): ImportItem[] => {
    const byName = new Map<string, ImportRow[]>();
    for (const row of rows) {
        byName.set(row.name, [...(byName.get(row.name) ?? []), row]);
    }
    return [...byName.entries()].map(([name, nameRows]): ImportItem => {
        const kept = nameRows.find(row => !row.skip);
        if (!kept) return { name, id: null, action: 'omit' };
        const local = kept.localTag;
        if (typeof local === 'object') {
            return local.name.toLowerCase() === name.toLowerCase()
                ? { name, id: null, action: 'add' }
                : { name, id: local.id, action: 'replace' };
        }
        return { name: local.trim() || name, id: null, action: 'add', type_id: kept.typeId };
    });
};
