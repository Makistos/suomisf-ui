import { Edition } from "@features/edition";

/**
 * Checks if two values are equal, treating undefined as null.
 *
 * @param {any} a - The first value to compare.
 * @param {any} b - The second value to compare.
 * @returns {boolean} True if the values are equal, false otherwise.
 */
const emptyIsEqual = (a: any, b: any) => {
    if (a === undefined) a = null;
    if (b === undefined) b = null;
    if (a === b) return true;
    if (a === null || b === null) return true;
    return false;
}

// This is used for radio buttons where variables always have a value, even
// when unknown. Unknown is equal to 1.
// This will consider unknown to be equal to any other value.
const unknownIsEqual = (a: any, b: any) => a === 1 || b === 1 || (a === b);

// For versions, unknown is equal to 1.
const unknownIsEqualToOne = (a: any, b: any) => {
    if (!a) a = 1;
    if (!b) b = 1;
    return a === b;
}

const addToGroup = (edition: Edition, groups: Edition[][], mode: string) => {

    if (mode === 'condensed') {
        // Condense list of editions so editions with same version & page count
        // go together.
        let found = false;
        for (const group of groups) {
            if (group && unknownIsEqualToOne(group[0].version, edition.version) &&
                emptyIsEqual(group[0].title, edition.title) &&
                emptyIsEqual(group[0].pages, edition.pages)
            ) {
                group.push(edition);
                found = true;
            }
        }
        if (!found) {
            groups.push([edition]);
        }
    } else if (mode === 'brief') {
        // Group editions by version
        for (const group of groups) {
            const ed = group[0];
            if (unknownIsEqualToOne(ed.version, edition.version)) {
                group.push(edition);
                return
            }
        }
        groups.push([edition]);
    } else {
        // No grouping, each edition by itself
        groups.push([edition]);
    }
}

const sortEditions = (a: Edition, b: Edition): number => {
    return a.version !== b.version ? (a.version > b.version ? 1 : -1) :
        (a.editionnum && b.editionnum) ? Number(a.editionnum) - Number(b.editionnum) :
            (a.pubyear > b.pubyear ? 1 : -1);
}

export const groupSimilarEditions = (editions: Edition[], mode: string) => {
    let groups: Edition[][] = [];
    for (const edition of editions) {
        addToGroup(edition, groups, mode);
    }
    // Sort editions in each group by edition number
    for (const group of groups) {
        group.sort((a, b) => sortEditions(a, b));
    }
    // First item in group has the smallest edition number so we can sort on
    // that
    groups.sort((a, b) => sortEditions(a[0], b[0]));
    return groups;
}