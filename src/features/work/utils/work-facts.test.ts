import { describe, expect, it } from "vitest";

import fixtures from "../../../test/fixtures/works.json";
import { Edition } from "@features/edition";
import { Work } from "../types";
import {
    editionLabel, groupLabel, laitosGroups, mergeGroupForRow, ownershipSummary, printingsSummary, seriesPosition,
    subjectGroups, tagsByType, titleFit, yearRange, originFact, workCovers, mainCover,
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

describe("subjectGroups", () => {
    it("takes the subgenre to the record and leaves the other types for the section below the printings", () => {
        const { subgenre, rest } = subjectGroups(leGuin.tags);
        expect(subgenre.map(t => t.name)).toEqual(["yhteiskunnallinen scifi", "antropologinen scifi"]);
        expect(rest.map(g => g.label)).toEqual(["Tyyli", "Aiheet", "Hahmot ja olennot", "Paikat", "Aika", "Listat ja sovitukset"]);
    });

    it("is empty without subject headings", () => {
        expect(subjectGroups([])).toEqual({ subgenre: [], rest: [] });
        expect(subjectGroups(undefined)).toEqual({ subgenre: [], rest: [] });
    });
});

describe("originFact", () => {
    it("is the original's language and year for a translation", () => {
        expect(originFact(leGuin)).toEqual({ label: "Alkuteos", value: "englanti, 1969" });
    });

    it("is the publication year for a Finnish original", () => {
        const finnish = { ...leGuin, language_name: { id: 7, name: "suomi" }, pubyear: 1999 } as unknown as Work;
        expect(originFact(finnish)).toEqual({ label: "Julkaistu", value: "1999" });
    });

    it("leaves out what is missing, and is null with nothing to say", () => {
        expect(originFact({ ...leGuin, language_name: null } as unknown as Work)).toEqual({ label: "Alkuteos", value: "1969" });
        expect(originFact({ ...leGuin, language_name: null, pubyear: null } as unknown as Work)).toBeNull();
    });
});

describe("workCovers", () => {
    it("lists every printing's covers in printing order, each with its printing", () => {
        const covers = workCovers(leGuin.editions);
        expect(covers.map(c => c.image.id)).toEqual([187, 392]);
        expect(covers.map(c => c.caption)).toEqual(["1. painos 1976, WSOY", "2. painos 1986, WSOY"]);
        expect(covers[1].edition.id).toBe(4574);
    });

    it("keeps every cover of a printing with several, each once", () => {
        const e = { ...leGuin.editions[0], images: [{ id: 1, image_src: "/a.jpg" }, { id: 2, image_src: "/b.jpg" }, { id: 1, image_src: "/a.jpg" }] } as unknown as Edition;
        expect(workCovers([e]).map(c => c.image.id)).toEqual([1, 2]);
    });

    it("is empty when no printing has a cover", () => {
        expect(workCovers(work("sparse").editions)).toEqual([]);
    });
});

describe("mainCover", () => {
    const covers = workCovers(leGuin.editions);

    it("is the first printing's cover by default", () => {
        expect(mainCover(covers, null, null)).toBe(0);
    });

    it("is the cover the admin chose", () => {
        expect(mainCover(covers, 392, null)).toBe(1);
    });

    it("is a picked printing's own cover, before the admin's choice", () => {
        expect(mainCover(covers, 187, 4574)).toBe(1);
        // A picked printing without a cover leaves the choice in place.
        expect(mainCover(covers, 392, 6193)).toBe(1);
    });

    it("ignores a choice that is no longer one of the covers", () => {
        expect(mainCover(covers, 99999, null)).toBe(0);
    });

    it("is -1 without covers", () => {
        expect(mainCover([], null, null)).toBe(-1);
    });
});
