import React from "react";
import { Link } from "react-router-dom";

import { Contribution } from "../../../types/contribution";
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

export type WorkSortField = 'Title' | 'OrigTitle' | 'Year' | 'Pubyear';

// Oldest edition's publication year, without mutating work.editions
// (Array.prototype.sort sorts in place).
const oldestEditionPubyear = (work: Work): number =>
    work.editions?.length > 0
        ? Math.min(...work.editions.map(e => Number(e.pubyear)))
        : Infinity;

// Shared work comparator for the sort-field dropdown, used both when
// sorting within an author group and when sorting a flat, ungrouped
// list. 'Title' - work title; 'OrigTitle' - original title, falling
// back to the work title for domestic works with no foreign original;
// 'Pubyear' - oldest edition's year (first edition in this catalog);
// 'Year' - the work's own pubyear (original publication year).
export const compareWorksByField = (
    a: Work, b: Work, orderField: WorkSortField
): number => {
    if (orderField === 'Title') {
        if (a.title.toUpperCase() < b.title.toUpperCase()) return -1;
        if (a.title.toUpperCase() > b.title.toUpperCase()) return 1;
    } else if (orderField === 'OrigTitle') {
        const aOrig = (a.orig_title || a.title).toUpperCase();
        const bOrig = (b.orig_title || b.title).toUpperCase();
        if (aOrig < bOrig) return -1;
        if (aOrig > bOrig) return 1;
    } else if (orderField === 'Year') {
        if (a.pubyear < b.pubyear) return -1;
        if (a.pubyear > b.pubyear) return 1;
    } else if (orderField === 'Pubyear') {
        const oldestA = oldestEditionPubyear(a);
        const oldestB = oldestEditionPubyear(b);
        if (oldestA < oldestB) return -1;
        if (oldestA > oldestB) return 1;
    }
    return 0;
};

export const workSortOptions: { name: string, code: WorkSortField }[] = [
    { name: 'Nimi', code: 'Title' },
    { name: 'Alkuperäinen nimi', code: 'OrigTitle' },
    { name: 'Ensipainoksen vuosi', code: 'Pubyear' },
    { name: 'Alkuperäinen vuosi', code: 'Year' },
];

// Renders the author (role 1), or editor (role 3) if there's no author,
// as linked name(s) - " & "-joined, with a "(toim.)" suffix for
// editor-only. Falls back to plain text if there's no matching
// contribution at all. Shared between the group heading and the
// per-work inline author prefix shown when the list isn't grouped.
export const renderContributorLink = (
    contributions: Contribution[], fallback: string
): React.ReactNode => {
    const authors = contributions.filter(c => c.role.id === 1);
    const contribs = authors.length > 0
        ? authors
        : contributions.filter(c => c.role.id === 3);
    if (contribs.length === 0) return fallback;
    const isEditor = authors.length === 0;
    return (
        <>
            {contribs.map((c, i) => (
                <React.Fragment key={c.person.id}>
                    {i > 0 && ' & '}
                    <Link to={`/people/${c.person.id}`} className="author-link">
                        {c.person.alt_name || c.person.name}
                    </Link>
                </React.Fragment>
            ))}
            {isEditor && ' (toim.)'}
        </>
    );
};
