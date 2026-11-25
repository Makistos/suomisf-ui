// Pure rules of the new front page (docs/ui-redesign/pages/front-identity.md, behaviour from front-page.md).

import type { Edition } from "@features/edition";

export interface FrontStats {
    works: number;
    editions: number;
    shorts: number;
    magazines: number;
}

const EDITOR = /\s*\(toim\.\)$/;
const natural = (name: string) => (name.includes(", ") ? name.split(", ").reverse().join(" ") : name);

/** "Sisättö, Vesa & Halme, Jukka (toim.)" → "Vesa Sisättö & Jukka Halme (toim.)" */
export const naturalAuthors = (authorStr: string | null | undefined) => {
    if (!authorStr) return "";
    const editor = EDITOR.test(authorStr);
    return authorStr.replace(EDITOR, "").split(" & ").map(natural).join(" & ") + (editor ? " (toim.)" : "");
};

/** Under a cover there is room for two names; three or more become "Matleena Sopanen ym." (agreed). */
export const shelfAuthors = (authorStr: string | null | undefined) => {
    if (!authorStr) return "";
    const editor = EDITOR.test(authorStr);
    const people = authorStr.replace(EDITOR, "").split(" & ");
    return people.length < 3 ? naturalAuthors(authorStr) : `${natural(people[0])} ym.${editor ? " (toim.)" : ""}`;
};

/** The printing the cover is from: "Kirjayhtymä 1975, 2. painos". */
export const coverLine = (e: Edition) => {
    const n = Number(e.editionnum);
    return [e.publisher?.name, e.pubyear].filter(Boolean).join(" ") + (n > 1 ? `, ${n}. painos` : "");
};

/**
 * The holdings sentence's four counts, each linked to a page with the same total where one exists.
 * The cover count is dropped (decided). The story search has no type filter in the URL yet, so its total
 * includes other story types than the count.
 */
export const holdings = (s: FrontStats) => {
    const n = (v: number) => v.toLocaleString("fi-FI").replace(/\s/g, " ");
    return [
        { text: `${n(s.works)} teosta`, to: "/bookindex" },
        { text: `${n(s.editions)} painosta`, to: "/stats?tab=julkaisut" },
        { text: `${n(s.shorts)} novellia`, to: "/shortstoryindex" },
        { text: `${n(s.magazines)} lehteä`, to: "/magazines" },
    ];
};
