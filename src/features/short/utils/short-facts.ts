// Pure rules of the new short story page (docs/ui-redesign/pages/short.md, in the identity style).

import type { Edition } from "@features/edition";
import type { Issue } from "@features/issue";
import type { ImageType } from "../../../types/image";
import type { Short } from "../types";

const WORK_TYPES: Record<number, string> = { 1: "Romaani", 2: "Kokoelma", 3: "Sarjakuva", 4: "Tietokirja", 5: "Vihko", 6: "Kokoomateos" };

const EDITOR = /\s*\(toim\.\)$/;
/** "Helttunen, Anne & Uusi-Hallila, Tuula (toim.)" → "Anne Helttunen & Tuula Uusi-Hallila (toim.)" */
const naturalAuthors = (s: string | null | undefined) => {
    if (!s) return "";
    const people = s.replace(EDITOR, "").split(" & ").map(p => (p.includes(", ") ? p.split(", ").reverse().join(" ") : p)).join(" & ");
    return people + (EDITOR.test(s) ? " (toim.)" : "");
};

export interface Printing { id: number; year: number; num: number; edition: Edition }
export type PublicationRow =
    | { kind: "book"; key: string; title: string; first: number; by: string; publisher: string; type: string; printings: Printing[]; cover?: ImageType }
    | { kind: "issue"; key: string; id: number; title: string; first: number; cover?: ImageType };

const issueTitle = (i: Issue) => [i.magazine?.name, i.cover_number].filter(Boolean).join(" ");

/** One row per book (its printings oldest first) and one per magazine issue, oldest first: where this translation can be read. */
export const publicationRows = (s: Pick<Short, "editions" | "issues">): PublicationRow[] => {
    const books = new Map<number | string, Edition[]>();
    for (const e of s.editions ?? []) {
        const key = e.work?.id ?? `e${e.id}`;
        books.set(key, [...(books.get(key) ?? []), e]);
    }
    const rows: PublicationRow[] = [...books.entries()].map(([key, eds]) => {
        const sorted = [...eds].sort((a, b) => Number(a.pubyear) - Number(b.pubyear) || Number(a.editionnum) - Number(b.editionnum));
        const w = sorted[0].work;
        return {
            kind: "book", key: `w${key}`, title: w?.title ?? sorted[0].title, first: Number(sorted[0].pubyear),
            by: naturalAuthors(w?.author_str), publisher: sorted[0].publisher?.name ?? "",
            type: WORK_TYPES[Number((w as { type?: number } | null)?.type)] ?? "",
            printings: sorted.map(e => ({ id: e.id, year: Number(e.pubyear), num: Number(e.editionnum), edition: e })),
            cover: sorted.flatMap(e => e.images ?? []).find(i => i.image_src),
        };
    });
    for (const i of s.issues ?? []) {
        rows.push({ kind: "issue", key: `i${i.id}`, id: i.id, title: issueTitle(i), first: Number(i.year), cover: i.images?.find(img => img.image_src) });
    }
    return rows.sort((a, b) => a.first - b.first || a.title.localeCompare(b.title, "fi"));
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** "3 kirjaa, 4 painosta" or "1 kirja, 1 lehti": printings only when a book has several. */
export const publishedCount = (rows: PublicationRow[]) => {
    const books = rows.filter(r => r.kind === "book");
    const printings = books.reduce((n, r) => n + (r.kind === "book" ? r.printings.length : 0), 0);
    const issues = rows.length - books.length;
    return [
        books.length > 0 && plural(books.length, "kirja", "kirjaa"),
        printings > books.length && plural(printings, "painos", "painosta"),
        issues > 0 && plural(issues, "lehti", "lehteä"),
    ].filter(Boolean).join(", ");
};

export interface TranslationRow {
    id: number;
    title: string;
    translators: { id: number; name: string }[];
    first: number | null;
    places: string[];
    count: number;
    current: boolean;
}

const translationRow = (s: Short, current: boolean): TranslationRow => {
    const rows = publicationRows(s);
    return {
        id: s.id, title: s.title, current,
        translators: (s.contributors ?? []).filter(c => c.role.id === 2)
            .map(c => ({ id: c.person.id, name: c.person.alt_name || naturalAuthors(c.person.name) })),
        first: rows.length ? rows[0].first : null,
        places: [...new Set(rows.map(r => r.title))],
        count: (s.editions?.length ?? 0) + (s.issues?.length ?? 0),
    };
};

/** Every Finnish translation of the story, the current one included, oldest first; empty when there is only this one. */
export const translationRows = (current: Short, similar: Short[]): TranslationRow[] => {
    if (similar.length === 0) return [];
    return [translationRow(current, true), ...similar.map(s => translationRow(s, false))]
        .sort((a, b) => (a.first ?? Infinity) - (b.first ?? Infinity) || a.id - b.id);
};

/** For admins: the original years the translations give, when they disagree (to be checked, short.md). */
export const origYearMismatch = (current: Short, similar: Short[]) => {
    const byYear = new Map<string, string[]>();
    for (const s of [current, ...similar]) {
        const year = String(s.pubyear ?? "").trim();
        if (!year) continue;
        const titles = byYear.get(year) ?? [];
        if (!titles.includes(s.title)) titles.push(s.title);
        byYear.set(year, titles);
    }
    if (byYear.size < 2) return null;
    return [...byYear.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([year, titles]) => ({ year, titles }));
};
