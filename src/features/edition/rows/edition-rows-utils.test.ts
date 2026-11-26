import { describe, expect, it } from "vitest";

import { EditionRow, printingNote, yearGroups, isForeign } from "./edition-rows-utils";

const row = (id: number, pubyear: number | null, version: number | null, editionnum: number | null, extra: Partial<EditionRow> = {}): EditionRow => ({
    id, title: "Säätiö", subtitle: null, pubyear, version, editionnum, pubseries: null, pubseriesnum: null, translators: [],
    work: { id: 1, title: "Säätiö", orig_title: "Foundation", pubyear: 1951, author_str: "Asimov, Isaac", type: 1, authors: [], genres: [] },
    cover: null, owned: false, wishlisted: false, ...extra,
});

describe("printingNote", () => {
    it("says nothing for a first printing and names the others as the old list did", () => {
        expect(printingNote(row(1, 1976, 1, 1))).toBe("");
        expect(printingNote(row(1, 1976, null, 1))).toBe("");
        expect(printingNote(row(1, 1976, 1, 2))).toBe("2. painos");
        expect(printingNote(row(1, 1976, 2, 1))).toBe("2. laitos");
        expect(printingNote(row(1, 1976, 2, 3))).toBe("2. laitos, 3. painos");
        expect(printingNote(row(1, 1976, 1, null))).toBe("");
    });
});

describe("yearGroups", () => {
    it("groups consecutive rows by year in the order they came, a year without a number last as '?'", () => {
        const groups = yearGroups([row(1, 1976, 1, 1), row(2, 1976, 1, 1), row(3, 1977, 1, 1), row(4, null, 1, 1)]);
        expect(groups.map(g => [g.year, g.rows.map(r => r.id)])).toEqual([[1976, [1, 2]], [1977, [3]], [null, [4]]]);
    });

    it("keeps a year that comes back later as its own group with its own key", () => {
        const groups = yearGroups([row(1, 1976, 1, 1), row(2, 1977, 1, 1), row(3, 1976, 1, 1)]);
        expect(new Set(groups.map(g => g.key)).size).toBe(3);
    });
});

describe("isForeign", () => {
    it("is a translation when the original title differs from the work's", () => {
        expect(isForeign(row(1, 1976, 1, 1))).toBe(true);
        expect(isForeign(row(1, 1976, 1, 1, { work: { ...row(1, 1, 1, 1).work!, orig_title: "Säätiö" } }))).toBe(false);
        expect(isForeign(row(1, 1976, 1, 1, { work: { ...row(1, 1, 1, 1).work!, orig_title: null } }))).toBe(false);
    });
});
