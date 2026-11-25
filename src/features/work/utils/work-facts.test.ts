import { describe, expect, it } from "vitest";

import fixtures from "../../../test/fixtures/works.json";
import { Edition } from "@features/edition";
import { Work } from "../types";
import {
    editionLabel, groupLabel, laitosGroups, mergeGroupForRow, ownershipSummary, printingsSummary, seriesPosition,
    spineSizes, tagsByType, titleFit, yearRange,
} from "./work-facts";

// Real API responses, trimmed (src/test/fixtures/works.json, captured 2026-11-24).
const work = (name: keyof typeof fixtures) => fixtures[name] as unknown as Work;
const tolkien = work("tolkien");
const leGuin = work("leguin");
const jansson = work("jansson");

describe("printing labels", () => {
    it("names a printing by its number, or as unnumbered", () => {
        expect(editionLabel(tolkien.editions[0])).toBe("1. painos");
        expect(editionLabel(jansson.editions.find(e => !e.editionnum)!)).toBe("Numeroton painos");
    });

    it("names a merged row by its number range, never 'null. painos'", () => {
        const [first] = laitosGroups(tolkien.editions, "condensed");
        expect(groupLabel(first.groups[0])).toBe("1.–36. painos");
        const v2 = laitosGroups(jansson.editions, "brief").find(l => l.version === 2)!;
        expect(groupLabel(v2.groups[0])).toBe("Numerottomat painokset");
        const mixed = [...v2.groups[0], jansson.editions.find(e => e.editionnum === 23)!];
        expect(groupLabel(mixed)).toBe("23. painos ja numerottomat");
    });

    it("writes a year range only when the years differ", () => {
        expect(yearRange([1985, 2023, 1990])).toBe("1985–2023");
        expect(yearRange([1976, 1976])).toBe("1976");
    });
});

describe("laitosGroups", () => {
    it("splits Tolkien's 20 printings into three laitos of 17, 2 and 1", () => {
        const laitos = laitosGroups(tolkien.editions, "all");
        expect(laitos.map(l => [l.version, l.editions.length])).toEqual([[1, 17], [2, 2], [3, 1]]);
        expect(laitos[0].groups).toHaveLength(17);
    });

    it("keeps today's grouping modes inside each laitos", () => {
        expect(laitosGroups(tolkien.editions, "condensed")[0].groups).toHaveLength(1);
        // Jansson's 2nd laitos: 132 and 144 pages are not alike, but one row per laitos merges them.
        const condensed = laitosGroups(jansson.editions, "condensed").find(l => l.version === 2)!;
        expect(condensed.groups.map(g => g.length)).toEqual([1, 2]);
        expect(laitosGroups(jansson.editions, "brief").find(l => l.version === 2)!.groups).toHaveLength(1);
    });

    it("sorts numbered printings first, then the unnumbered by year", () => {
        const all = laitosGroups(jansson.editions, "all").flatMap(l => l.editions);
        expect(all.slice(-3).map(e => [e.editionnum, e.pubyear])).toEqual([[null, 2014], [null, 2018], [null, 2019]]);
    });
});

describe("mergeGroupForRow", () => {
    it("collects the unique values of a merged row", () => {
        const row = mergeGroupForRow(laitosGroups(tolkien.editions, "condensed")[0].groups[0]);
        expect(row.label).toBe("1.–36. painos");
        expect(row.years).toBe("1985–2002");
        expect(row.pages).toEqual([981]);
        expect(row.publishers.map(p => p.publisher?.name)).toContain("WSOY");
        expect(new Set(row.isbns).size).toBe(row.isbns.length);
    });
});

describe("printingsSummary", () => {
    it("sums up printings, years, publishers and translators", () => {
        expect(printingsSummary(leGuin.editions)).toBe("3 painosta vuosina 1976–1992, WSOY. Suomentanut Kalevi Nyytäjä.");
        const one = work("sparse");
        expect(printingsSummary(one.editions)).toMatch(/^1 painos vuonna \d{4}, /);
    });
});

describe("ownershipSummary", () => {
    const group = laitosGroups(tolkien.editions, "condensed")[0].groups[0] as Edition[];
    it("counts owned printings out of the group and the wishlisted ones", () => {
        const owned = new Set(group.slice(0, 3).map(e => e.id));
        const wished = new Set(group.slice(5, 7).map(e => e.id));
        expect(ownershipSummary(group, owned, wished)).toBe("Omistat 3/17, muistilistalla 2");
    });
    it("says so when the user owns none", () => {
        expect(ownershipSummary(group, new Set(), new Set())).toBe("Et omista");
        expect(ownershipSummary(group, new Set(), new Set([group[0].id]))).toBe("Et omista, muistilistalla 1");
    });
});

describe("seriesPosition", () => {
    it("falls back to original years when the series has no order or numbers, and says so", () => {
        const pos = seriesPosition(leGuin)!;
        expect(pos.label).toBe("4/9 alkuteosten ilmestymisjärjestyksessä");
        expect(pos.prev?.title).toBe("Harhakaupunki");
        expect(pos.next?.title).toBe("Maailma, vihreä metsä");
    });

    it("uses the series order and numbers when there are any", () => {
        const numbered = {
            id: 2, bookseries: {
                id: 1, name: "S", works: [
                    { id: 1, title: "B", pubyear: 1990, bookseriesnum: "2", bookseriesorder: null },
                    { id: 2, title: "A", pubyear: 1980, bookseriesnum: "3", bookseriesorder: null },
                    { id: 3, title: "C", pubyear: 1970, bookseriesnum: "1", bookseriesorder: null },
                ],
            },
        } as unknown as Work;
        const pos = seriesPosition(numbered)!;
        expect(pos.label).toBe("osa 3/3");
        expect(pos.prev?.title).toBe("B");
        expect(pos.next).toBeNull();
    });

    it("is null without a series", () => {
        expect(seriesPosition(tolkien)).toBeNull();
    });
});

describe("tagsByType", () => {
    it("groups subject headings by type, in the catalogue's order, with written labels", () => {
        const groups = tagsByType(leGuin.tags);
        expect(groups.map(g => g.label)).toEqual(["Alalaji", "Tyyli", "Aiheet", "Hahmot ja olennot", "Paikat", "Aika", "Listat ja sovitukset"]);
        expect(groups[0].tags.map(t => t.name)).toEqual(["yhteiskunnallinen scifi", "antropologinen scifi"]);
    });
});

describe("spineSizes", () => {
    it("draws each printing to scale: height from cm, thickness from pages at 10 pages a millimetre", () => {
        const shelf = spineSizes(tolkien.editions)!;
        const first = shelf.spines.get(tolkien.editions[0].id)!;
        expect([first.width, first.height]).toEqual([62.8, 147.2]); // 981 pages = 98 mm, 23 cm
        const v2 = tolkien.editions.find(e => e.version === 2)!;
        expect(shelf.spines.get(v2.id)!.width).toBe(75.6); // 1,182 pages
        const v3 = tolkien.editions.find(e => e.version === 3)!;
        expect(shelf.spines.get(v3.id)!.height).toBe(160); // 25 cm
    });

    it("keeps a book's real proportions, not only its siblings': 400 pages and 20 cm is 20:4", () => {
        const book = (id: number, pages: number, size: number) =>
            ({ id, pages, size, version: 1, editionnum: id, pubyear: 2000, images: [] }) as unknown as Edition;
        const s = spineSizes([book(1, 400, 20), book(2, 400, 20)])!.spines.get(1)!;
        expect(s.height / s.width).toBeCloseTo(20 / 4, 1);
        // Two thick printings stay thick even with nothing thinner beside them.
        const thick = spineSizes([book(1, 600, 21), book(2, 620, 21)])!.spines.get(1)!;
        expect(thick.height / thick.width).toBeCloseTo(21 / 6, 1);
    });

    it("draws a missing size from the median of the work's known sizes and flags it", () => {
        const shelf = spineSizes(tolkien.editions)!;
        const missing = tolkien.editions.filter(e => !e.size);
        expect(missing).toHaveLength(4);
        for (const e of missing) {
            const s = shelf.spines.get(e.id)!;
            expect(s.height).toBe(147.2);
            expect(s.estHeight).toBe(true);
            expect(s.name).toContain("korkeus ei tiedossa");
        }
        expect(shelf.note).toContain("Korkeus puuttuu; se on piirretty tämän teoksen muiden painosten mukaan.");
    });

    it("names each spine in full", () => {
        const s = spineSizes(leGuin.editions)!.spines.get(leGuin.editions[0].id)!;
        expect(s.name).toBe("1. painos 1976, WSOY, sidottu, 302 sivua, 21 cm");
    });

    it("leaves the shelf out when fewer than two printings have a size, a page count or a cover", () => {
        expect(spineSizes(work("tuulen").editions)).toBeNull();
        expect(spineSizes(work("sparse").editions)).toBeNull();
    });
});

describe("titleFit", () => {
    it("keeps the full size for ordinary words and shrinks it for a long one", () => {
        expect(titleFit("Pimeyden vasen käsi")).toBe(1);
        expect(titleFit("Taru sormusten herrasta")).toBe(1);
        expect(titleFit("Tapahtumapaikkana Duma Key")).toBeCloseTo(13 / 17, 2);
        expect(titleFit("Houkutus: kymmenvuotisjuhlakirja")).toBeCloseTo(13 / 22, 2);
    });
    it("never goes below half size", () => {
        expect(titleFit("a".repeat(60))).toBe(0.5);
    });
});
