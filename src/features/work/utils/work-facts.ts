// Pure rules of the new work page (docs/ui-redesign/pages/work-identity.md and work.md):
// printing labels and ranges, laitos groups, merged rows, the printings summary,
// the ownership summary, the series position, subject headings by type and the shelf.

import { Edition } from "@features/edition";
import { groupSimilarEditions } from "@features/edition/utils/group-similar-editions";
import type { SfTag } from "@features/tag/types";
import { Work } from "../types";

/** Today's grouping modes (groupSimilarEditions): every printing, similar ones together, one row per laitos. */
export type GroupingMode = "all" | "condensed" | "brief";

const num = (v: unknown): number | null => {
    const n = Number(v);
    return v === null || v === undefined || v === "" || Number.isNaN(n) ? null : n;
};
const uniq = <T,>(items: (T | null | undefined | "")[]): T[] => [...new Set(items.filter((x): x is T => !!x))];
const year = (e: Edition) => num(e.pubyear);

export const editionLabel = (e: Edition) => {
    const n = num(e.editionnum);
    return n !== null ? `${n}. painos` : "Numeroton painos";
};

export const yearRange = (years: (number | null)[]) => {
    const known = years.filter((y): y is number => y !== null);
    if (known.length === 0) return "";
    const [min, max] = [Math.min(...known), Math.max(...known)];
    return min === max ? String(min) : `${min}–${max}`;
};

/** Laitos, then numbered printings by number, then the unnumbered by year. */
export const comparePrintings = (a: Edition, b: Edition) => {
    const [na, nb] = [num(a.editionnum), num(b.editionnum)];
    return (a.version || 1) - (b.version || 1)
        || (na === null ? 1 : 0) - (nb === null ? 1 : 0)
        || (na ?? 0) - (nb ?? 0)
        || (year(a) ?? 0) - (year(b) ?? 0);
};

/** "1.–36. painos", "23. painos ja numerottomat", "Numerottomat painokset". */
export const groupLabel = (group: Edition[]) => {
    if (group.length === 1) return editionLabel(group[0]);
    const known = group.map(e => num(e.editionnum)).filter((n): n is number => n !== null);
    if (known.length === 0) return "Numerottomat painokset";
    const [min, max] = [Math.min(...known), Math.max(...known)];
    const range = min === max ? `${min}. painos` : `${min}.–${max}. painos`;
    return known.length < group.length ? `${range} ja numerottomat` : range;
};

export interface Laitos {
    version: number;
    editions: Edition[];
    /** Rows of the table in the chosen grouping mode. */
    groups: Edition[][];
}

export const laitosGroups = (editions: Edition[], mode: GroupingMode): Laitos[] => {
    const byVersion = new Map<number, Edition[]>();
    for (const e of [...editions].sort(comparePrintings)) {
        const v = e.version || 1;
        byVersion.set(v, [...(byVersion.get(v) ?? []), e]);
    }
    return [...byVersion.entries()].sort(([a], [b]) => a - b).map(([version, list]) => ({
        version,
        editions: list,
        groups: groupSimilarEditions(list, mode)
            .map(g => [...g].sort(comparePrintings))
            .sort((a, b) => comparePrintings(a[0], b[0])),
    }));
};

const ROLE_TRANSLATOR = 2;
const isbnsOf = (e: Edition): string[] =>
    typeof e.isbn === "string" ? [e.isbn] : (e.isbn ?? []).map(i => i.isbn);
const peopleOf = (group: Edition[], role: number) => {
    const seen = new Map<number, { id: number; name: string; alt_name: string }>();
    for (const e of group) for (const c of e.contributions ?? []) {
        if (c.role.id === role && !seen.has(c.person.id)) seen.set(c.person.id, c.person);
    }
    return [...seen.values()];
};

export interface MergedRow {
    label: string;
    years: string;
    publishers: Pick<Edition, "publisher" | "printedin" | "pubseries" | "pubseriesnum">[];
    translators: { id: number; name: string; alt_name: string }[];
    /** Cover artists, illustrators, dust jacket, overlapping covers, a different title, the edition's own notes. */
    notes: string[];
    bindings: string[];
    pages: number[];
    sizes: number[];
    isbns: string[];
    cover: Edition["images"][number] | null;
}

export const mergeGroupForRow = (group: Edition[], workTitle?: string): MergedRow => {
    const publishers = new Map<string, MergedRow["publishers"][number]>();
    for (const e of group) {
        const key = [e.publisher?.id, e.printedin, e.pubseries?.id, e.pubseriesnum].join("|");
        if (!publishers.has(key)) publishers.set(key, { publisher: e.publisher, printedin: e.printedin, pubseries: e.pubseries, pubseriesnum: e.pubseriesnum });
    }
    const credits = (role: number, prefix: string) => {
        const people = peopleOf(group, role);
        return people.length ? `${prefix} ${people.map(p => p.alt_name || p.name).join(", ")}` : "";
    };
    return {
        label: groupLabel(group),
        years: yearRange(group.map(year)),
        publishers: [...publishers.values()],
        translators: peopleOf(group, ROLE_TRANSLATOR),
        notes: uniq<string>([
            ...uniq<string>(group.map(e => workTitle && e.title && e.title !== workTitle ? `Nimellä ${e.title}` : "")),
            credits(4, "Kansi"), credits(5, "Kuvitus"),
            group.some(e => e.dustcover === 3) ? "Kansipaperi" : "",
            group.some(e => e.coverimage === 3) ? "Ylivetokannet" : "",
            ...group.map(e => e.misc),
        ]),
        bindings: uniq<string>(group.map(e => (e.binding && e.binding.id > 1 ? e.binding.name : ""))),
        pages: uniq<number>(group.map(e => num(e.pages))),
        sizes: uniq<number>(group.map(e => num(e.size))),
        isbns: uniq<string>(group.flatMap(isbnsOf)),
        cover: group.find(e => e.images?.length)?.images[0] ?? null,
    };
};

/** "20 painosta vuosina 1985–2023, WSOY. Suomentanut Eila Pennanen, Kersti Juva." */
export const printingsSummary = (editions: Edition[]) => {
    const sorted = [...editions].sort(comparePrintings);
    const years = sorted.map(year);
    const many = new Set(years.filter(y => y !== null)).size > 1;
    const publishers = uniq<string>(sorted.map(e => e.publisher?.name));
    const translators = peopleOf(sorted, ROLE_TRANSLATOR).map(p => p.alt_name || p.name);
    const n = editions.length;
    return `${n} ${n === 1 ? "painos" : "painosta"} ${many ? "vuosina" : "vuonna"} ${yearRange(years)}`
        + (publishers.length ? `, ${publishers.join(", ")}` : "") + "."
        + (translators.length ? ` Suomentanut ${translators.join(", ")}.` : "");
};

/** A merged row's "Omat" cell: "Omistat 3/17, muistilistalla 2", or "Et omista". */
export const ownershipSummary = (group: Edition[], owned: Set<number>, wished: Set<number>) => {
    const o = group.filter(e => owned.has(e.id)).length;
    const w = group.filter(e => wished.has(e.id)).length;
    return (o ? `Omistat ${o}/${group.length}` : "Et omista") + (w ? `, muistilistalla ${w}` : "");
};

type SeriesWork = Pick<Work, "id" | "title" | "pubyear" | "bookseriesnum" | "bookseriesorder">;
export interface SeriesPosition {
    prev: SeriesWork | null;
    next: SeriesWork | null;
    /** "osa 4/9" with an order or numbers, otherwise "4/9 alkuteosten ilmestymisjärjestyksessä". */
    label: string;
}

/**
 * The series page's default order: bookseriesorder, then the series number,
 * then the original year, then the title. Today's arrows follow database order.
 */
export const seriesPosition = (work: Work): SeriesPosition | null => {
    const works = (work.bookseries?.works ?? []) as SeriesWork[];
    if (works.length === 0) return null;
    const last = (v: number | null) => v ?? Number.POSITIVE_INFINITY;
    const ordered = [...works].sort((a, b) =>
        last(num(a.bookseriesorder)) - last(num(b.bookseriesorder))
        || last(num(a.bookseriesnum)) - last(num(b.bookseriesnum))
        || last(num(a.pubyear)) - last(num(b.pubyear))
        || a.title.localeCompare(b.title, "fi"));
    const i = ordered.findIndex(w => w.id === work.id);
    if (i < 0) return null;
    const hasOrder = works.some(w => num(w.bookseriesorder) !== null || num(w.bookseriesnum) !== null);
    const pos = `${i + 1}/${ordered.length}`;
    return {
        prev: ordered[i - 1] ?? null,
        next: ordered[i + 1] ?? null,
        label: hasOrder ? `osa ${pos}` : `${pos} alkuteosten ilmestymisjärjestyksessä`,
    };
};

const TAG_TYPES: [string, string][] = [
    ["Alagenre", "Alalaji"], ["Tyyli", "Tyyli"], ["Aihe", "Aiheet"], ["Toimija", "Hahmot ja olennot"],
    ["Paikka", "Paikat"], ["Aika", "Aika"], ["Lista", "Listat ja sovitukset"],
];

/** Subject headings grouped by type with written labels, as in a library catalogue. */
export const tagsByType = (tags: SfTag[] = []) => {
    const byType = new Map<string, SfTag[]>();
    for (const t of tags) {
        const type = t.type?.name ?? "Muut";
        byType.set(type, [...(byType.get(type) ?? []), t]);
    }
    const known = TAG_TYPES.filter(([type]) => byType.has(type)).map(([type, label]) => ({ label, tags: byType.get(type)! }));
    const rest = [...byType.keys()].filter(type => !TAG_TYPES.some(([t]) => t === type)).map(type => ({ label: type, tags: byType.get(type)! }));
    return [...known, ...rest];
};

/** The subgenre goes into the record next to the genre (it answers the same question); the other types below the printings. */
export const subjectGroups = (tags: SfTag[] = []) => {
    const groups = tagsByType(tags);
    return {
        subgenre: groups.find(g => g.label === "Alalaji")?.tags ?? [],
        rest: groups.filter(g => g.label !== "Alalaji"),
    };
};

/** The record's row for where the work comes from: "Alkuteos: englanti, 1969", or "Julkaistu: 1999" for a Finnish original. */
export const originFact = (work: Pick<Work, "language_name" | "pubyear">) => {
    const finnish = work.language_name?.id === 7;
    const value = [finnish ? null : work.language_name?.name, work.pubyear].filter(v => v !== null && v !== undefined && v !== "").join(", ");
    return value ? { label: finnish ? "Julkaistu" : "Alkuteos", value } : null;
};

export interface CoverItem {
    image: Edition["images"][number];
    edition: Edition;
    /** "1. painos 1976, WSOY" */
    caption: string;
}

/** Every cover of the given printings in printing order, each once: the work's gallery, or one table row's. */
export const workCovers = (editions: Edition[]): CoverItem[] => {
    const seen = new Set<number>();
    const items: CoverItem[] = [];
    for (const e of [...editions].sort(comparePrintings)) {
        for (const image of e.images ?? []) {
            if (!image.image_src || seen.has(image.id)) continue;
            seen.add(image.id);
            const caption = [`${editionLabel(e)} ${e.pubyear ?? ""}`.trim(), e.publisher?.name].filter(Boolean).join(", ");
            items.push({ image, edition: e, caption });
        }
    }
    return items;
};

/**
 * Which cover the work page shows: a picked printing's own cover, else the one an admin chose
 * (work.cover_image_id), else the first printing's. -1 when there are none.
 */
export const mainCover = (covers: CoverItem[], chosenImageId: number | null | undefined, pickedEditionId: number | null) => {
    if (covers.length === 0) return -1;
    const picked = pickedEditionId === null ? -1 : covers.findIndex(c => c.edition.id === pickedEditionId);
    if (picked >= 0) return picked;
    const chosen = chosenImageId == null ? -1 : covers.findIndex(c => c.image.id === chosenImageId);
    return chosen >= 0 ? chosen : 0;
};

/** Letters of a word that still fit the title column at full size (58 px in about 490 px). */
const TITLE_WORD_FITS = 13;

/**
 * Scale for the title so its longest word fits its column ("Tapahtumapaikkana", 17 letters, ran into the sidebar):
 * 1 for ordinary words, smaller for a long one, never below half.
 */
export const titleFit = (title: string) => {
    const longest = Math.max(0, ...title.split(/[\s\-–—/]+/).map(w => w.replace(/[^\p{L}\p{N}]/gu, "").length));
    return longest <= TITLE_WORD_FITS ? 1 : Math.max(0.5, TITLE_WORD_FITS / longest);
};
