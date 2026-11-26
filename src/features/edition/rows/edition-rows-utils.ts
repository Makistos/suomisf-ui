// One printing a row: the publisher page's edition list (owner, 2026-11-26: a publisher publishes editions, not works).
// Shared so other edition lists (a publisher's series, a person's translations) can use the same rows.

type PersonBrief = { id: number; name: string; alt_name: string | null };

/** One printing as GET /api/publishers/:id/editions gives it. */
export interface EditionRow {
    id: number;
    title: string;
    subtitle: string | null;
    pubyear: number | null;
    version: number | null;
    editionnum: number | null;
    pubseries: { id: number; name: string } | null;
    pubseriesnum: number | null;
    translators: PersonBrief[];
    work: {
        id: number; title: string; orig_title: string | null; pubyear: number | null; author_str: string | null; type: number;
        authors: PersonBrief[]; genres: { id: number; abbr: string; name: string }[];
    } | null;
    cover: { image_src: string; thumb_src?: string | null } | null;
    owned: boolean;
    wishlisted: boolean;
}

/** "2. painos", "2. laitos", "2. laitos, 3. painos"; nothing for a first printing or an unknown number (EditionString's rules). */
export const printingNote = (e: Pick<EditionRow, "version" | "editionnum">) => {
    const version = (e.version ?? 1) > 1 ? `${e.version}. laitos` : "";
    const printing = e.editionnum !== null && e.editionnum > 1 ? `${e.editionnum}. painos` : "";
    return [version, printing].filter(Boolean).join(", ");
};

/** A translation: the original title differs from the work's Finnish one (the old list's isForeign). */
export const isForeign = (e: EditionRow) => !!e.work?.orig_title && e.work.orig_title !== e.work.title;

/** Consecutive rows of the same year, in the order the server sorted them; the key carries the position. */
export const yearGroups = (rows: EditionRow[]) =>
    rows.reduce<{ key: string; year: number | null; rows: EditionRow[] }[]>((groups, r) => {
        const last = groups[groups.length - 1];
        if (last && last.year === r.pubyear) last.rows.push(r);
        else groups.push({ key: `${groups.length}:${r.pubyear}`, year: r.pubyear, rows: [r] });
        return groups;
    }, []);
