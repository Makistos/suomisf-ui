import { describe, expect, it } from "vitest";

import { apiQuery, groupByAuthor, hasFilters, parseIndexState, withIndexState, WORK_TYPES } from "./bookindex-state";

const parse = (q: string) => parseIndexState(new URLSearchParams(q));

describe("parseIndexState", () => {
    it("reads readable values from the URL", () => {
        const s = parse("tekija=le+guin&nimi=vasen&alkunimi=left&alkuteos=1960-1969&painettu=2000-&kansallisuus=3"
            + "&tyyppi=romaani,kokoelma&genre=SF,F&kirjain=L&jarjestys=nimi&ryhmittely=ei&nakyma=kannet&sivu=3&riveja=100");
        expect(s).toEqual({
            tekija: "le guin", nimi: "vasen", alkunimi: "left", alkuteos: { from: 1960, to: 1969 }, painettu: { from: 2000, to: null },
            kansallisuus: 3, tyyppi: ["romaani", "kokoelma"], genre: ["SF", "F"], kirjain: "L", jarjestys: "nimi",
            ryhmittely: false, nakyma: "kannet", sivu: 3, riveja: 100,
        });
    });

    it("defaults to every work grouped by author, 200 a page, and drops what it can't use", () => {
        // Grouped and 200 a page are the defaults (owner, 2026-11-26), as the old list grouped by author.
        expect(parse("")).toMatchObject({ ryhmittely: true, riveja: 200 });
        const s = parse("tyyppi=romaani,lehti&jarjestys=x&nakyma=y&sivu=0&riveja=7&kirjain=LL&alkuteos=abc&kansallisuus=x&ryhmittely=x");
        expect(s).toMatchObject({
            tyyppi: ["romaani"], jarjestys: "tekija", nakyma: "lista", sivu: 1, riveja: 200, kirjain: null, alkuteos: null, kansallisuus: null,
            ryhmittely: true,
        });
        expect(hasFilters(parse(""))).toBe(false);
        expect(hasFilters(s)).toBe(true);
    });

    it("reads Finnish letters", () => {
        expect(parse("kirjain=%C3%84").kirjain).toBe("Ä");
    });
});

describe("withIndexState", () => {
    it("writes only what differs from the defaults and keeps other parameters", () => {
        const p = withIndexState(new URLSearchParams("x=1"), { tekija: "Le Guin", tyyppi: ["romaani"], alkuteos: { from: null, to: 1969 } });
        expect(p.toString()).toBe("x=1&tekija=Le+Guin&tyyppi=romaani&alkuteos=-1969");
        expect(withIndexState(p, { tekija: "", tyyppi: [], alkuteos: null }).toString()).toBe("x=1");
        // Ungrouped and fewer rows are written out; the defaults are not.
        expect(withIndexState(new URLSearchParams(), { ryhmittely: false, riveja: 50 }).toString()).toBe("ryhmittely=ei&riveja=50");
        expect(withIndexState(new URLSearchParams("ryhmittely=ei&riveja=50"), { ryhmittely: true, riveja: 200 }).toString()).toBe("");
    });

    it("goes back to the first page when a filter changes, but not when only the page or view does", () => {
        const p = new URLSearchParams("sivu=4&genre=SF");
        expect(withIndexState(p, { genre: ["SF", "K"] }).get("sivu")).toBeNull();
        expect(withIndexState(p, { nakyma: "kannet" }).get("sivu")).toBe("4");
        expect(withIndexState(p, { sivu: 5 }).get("sivu")).toBe("5");
        expect(withIndexState(p, { sivu: 1 }).get("sivu")).toBeNull();
    });

    it("round-trips", () => {
        const q = "tekija=a&alkuteos=1900-1950&tyyppi=vihko&genre=K&kirjain=%C3%96&jarjestys=uusin&ryhmittely=ei&riveja=100";
        const s = parse(q);
        expect(parseIndexState(withIndexState(new URLSearchParams(), s))).toEqual(s);
    });
});

describe("apiQuery", () => {
    it("maps the URL state to the API's parameters", () => {
        const q = apiQuery(parse("tekija=le+guin&alkuteos=1960-1969&painettu=-2000&kansallisuus=3&tyyppi=romaani,kokoomateos"
            + "&genre=SF,F&kirjain=L&jarjestys=vuosi&sivu=2&riveja=100"));
        expect(Object.fromEntries(new URLSearchParams(q))).toEqual({
            author: "le guin", origyear_min: "1960", origyear_max: "1969", printyear_max: "2000", nationality: "3",
            type: `${WORK_TYPES.romaani.id},${WORK_TYPES.kokoomateos.id}`, genre: "SF,F", initial: "L", sort: "year", page: "2", rows: "100",
        });
        expect(apiQuery(parse(""))).toBe("sort=author&page=1&rows=200");
        expect(new URLSearchParams(apiQuery(parse("jarjestys=uusin"))).get("sort")).toBe("newest");
    });
});

describe("groupByAuthor", () => {
    const w = (id: number, authorId: number | null, author_str: string) =>
        ({ id, authors: authorId ? [{ id: authorId, name: author_str, alt_name: null }] : [], author_str });

    it("starts a group whenever the first author changes, in the order the rows came", () => {
        const groups = groupByAuthor([w(1, 7, "A"), w(2, 7, "A"), w(3, 8, "B")]);
        expect(groups.map(g => g.rows.map(r => r.id))).toEqual([[1, 2], [3]]);
        expect(groups[0]).toMatchObject({ name: "A", id: 7 });
    });

    it("gives every group its own key when an author comes back later on the page", () => {
        // Sorted by the author string, a solo book and a co-written one can put the same first author in two places.
        const groups = groupByAuthor([w(1, 7, "A"), w(2, 8, "A & B"), w(3, 7, "A")]);
        expect(groups).toHaveLength(3);
        expect(new Set(groups.map(g => g.key)).size).toBe(3);
    });

    it("names a work without a linked author by its author string", () => {
        expect(groupByAuthor([w(1, null, "Halme, Jukka (toim.)")])[0]).toMatchObject({ name: "Jukka Halme (toim.)", id: undefined });
        expect(groupByAuthor([w(1, null, "")])[0].name).toBe("Tekijä ei tiedossa");
    });
});
