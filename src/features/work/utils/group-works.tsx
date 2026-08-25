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
