import { Work } from "../types";


export const groupWorks = (works: Work[]) => {
    const grouped: Record<string, Work[]> = works.reduce((acc: { [index: string]: any; }, work) => {
        const authors = work.contributions.filter(c => c.role.id === 1);
        const contribs = authors.length > 0 ? authors : work.contributions.filter(c => c.role.id === 3);
        const personIds = contribs.map(c => c.person.id).sort((a, b) => a - b).join(',');
        // Compound key: person IDs + author_str. Prevents same-named different persons
        // from being merged into one group with the wrong person link.
        const groupKey = personIds ? `${personIds}|${work.author_str}` : work.author_str;
        if (!acc[groupKey]) {
            acc[groupKey] = [];
        }
        acc[groupKey].push(work);
        return acc;
    }, {});

    return grouped;
};

export const groupKeyDisplayName = (key: string) => {
    const idx = key.indexOf('|');
    return idx >= 0 ? key.slice(idx + 1) : key;
};
