import { describe, expect, it } from "vitest";

import { apiQuery, groupByAuthor, hasFilters, parseIndexState, printingLabel, printingLines, statsQuery, withIndexState, WORK_TYPES } from "./bookindex-state";

const parse = (q: string) => parseIndexState(new URLSearchParams(q));

describe("parseIndexState", () => {
    it("reads readable values from the URL", () => {
        const s = parse("tekija=le+guin&nimi=vasen&alkunimi=left&alkuteos=1960-1969&painettu=2000-&kansallisuus=3"
            + "&tyyppi=romaani,kokoelma&genre=SF,F&kirjain=L&jarjestys=nimi&ryhmittely=ei&sivu=3&riveja=100");
        expect(s).toEqual({
            tekija: "le guin", nimi: "vasen", alkunimi: "left", alkuteos: { from: 1960, to: 1969 }, painettu: { from: 2000, to: null },
            kansallisuus: 3, tyyppi: ["romaani", "kokoelma"], genre: ["SF", "F"], kirjain: "L", jarjestys: "nimi",
            ryhmittely: false, sivu: 3, riveja: 100, tilastot: false,
        });
    });

    it("defaults to every work grouped by author, 200 a page, and drops what it can't use", () => {
        // Grouped and 200 a page are the defaults (owner, 2026-11-26), as the old list grouped by author.
        expect(parse("")).toMatchObject({ ryhmittely: true, riveja: 200 });
        const s = parse("tyyppi=romaani,lehti&jarjestys=x&sivu=0&riveja=7&kirjain=LL&alkuteos=abc&kansallisuus=x&ryhmittely=x");
        expect(s).toMatchObject({
            tyyppi: ["romaani"], jarjestys: "tekija", sivu: 1, riveja: 200, kirjain: null, alkuteos: null, kansallisuus: null,
            ryhmittely: true,
        });
        expect(hasFilters(parse(""))).toBe(false);
        expect(hasFilters(s)).toBe(true);
    });

    it("reads Finnish letters", () => {
        expect(parse("kirjain=%C3%84").kirjain).toBe("Ä");
    });
});

describe("statistics panel", () => {
    it("is open when the URL says so, is not a filter, and changing it keeps the page", () => {
        expect(parse("").tilastot).toBe(false);
        expect(parse("tilastot=1").tilastot).toBe(true);
        expect(hasFilters(parse("tilastot=1"))).toBe(false);
        expect(withIndexState(new URLSearchParams("sivu=3"), { tilastot: true }).toString()).toBe("sivu=3&tilastot=1");
        expect(withIndexState(new URLSearchParams("tilastot=1"), { tilastot: false }).toString()).toBe("");
    });

    it("asks for the whole search: the filters without page, rows or sort", () => {
        const q = new URLSearchParams(statsQuery(parse("tekija=le+guin&genre=SF&sivu=3&riveja=50&jarjestys=nimi&tilastot=1")));
        expect(Object.fromEntries(q)).toEqual({ author: "le guin", genre: "SF" });
    });
});

describe("non-fiction (/nonfiction)", () => {
    const nf = (q: string) => parseIndexState(new URLSearchParams(q), "tietokirjat");

    it("is always Tietokirja whatever the URL says, and that alone is not a filter", () => {
        expect(nf("").tyyppi).toEqual(["tietokirja"]);
        expect(nf("tyyppi=romaani").tyyppi).toEqual(["tietokirja"]);
        expect(hasFilters(nf(""), "tietokirjat")).toBe(false);
        expect(hasFilters(nf("genre=F"), "tietokirjat")).toBe(true);
        expect(new URLSearchParams(apiQuery(nf(""))).get("type")).toBe(String(WORK_TYPES.tietokirja.id));
        expect(new URLSearchParams(statsQuery(nf(""))).get("type")).toBe(String(WORK_TYPES.tietokirja.id));
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

    it("goes back to the first page when a filter changes, but not when only the page or sort does", () => {
        const p = new URLSearchParams("sivu=4&genre=SF");
        expect(withIndexState(p, { genre: ["SF", "K"] }).get("sivu")).toBeNull();
        expect(withIndexState(p, { jarjestys: "uusin" }).get("sivu")).toBe("4");
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

describe("printingLabel", () => {
    it("names a printing as the old list did", () => {
        expect(printingLabel({ version: 1, editionnum: 2 })).toBe("2. painos");
        expect(printingLabel({ version: null, editionnum: 3 })).toBe("3. painos");
        expect(printingLabel({ version: 2, editionnum: 1 })).toBe("2. laitos");
        expect(printingLabel({ version: 2, editionnum: 3 })).toBe("2. laitos, 3. painos");
        expect(printingLabel({ version: 1, editionnum: null })).toBe("?. painos");
    });
});

describe("printingLines", () => {
    // Stoker's Kammoittava kreivi as in the dev data, by laitos and printing (owner's example, 2026-11-26).
    const laine = [{ id: 2 }], otava = { id: 10 };
    const p = (id: number, version: number, editionnum: number, title: string, translators: { id: number }[],
        pubseries: number | null, publisher = otava) =>
        ({ id, version, editionnum, title, translators, publisher, pubseries: pubseries === null ? null : { id: pubseries }, owned: false, wishlisted: false });
    const dracula = [
        p(1529, 1, 1, "Kammoittava kreivi", [{ id: 1 }], null, { id: 20 }),
        p(1530, 2, 1, "Dracula", laine, null),
        p(6892, 2, 2, "Dracula", laine, null),
        p(6893, 2, 3, "Dracula", laine, null),
        p(1531, 2, 4, "Dracula", laine, 31),
        p(1532, 2, 5, "Dracula", laine, 32),
        p(1533, 2, 6, "Dracula", laine, 33),
        p(10178, 2, 7, "Dracula", laine, 33),
        p(8004, 2, 7, "Dracula", laine, 34),
        p(10177, 2, 8, "Dracula", laine, 34),
        p(10179, 2, 9, "Dracula", laine, 34),
        p(8005, 3, 1, "Dracula", [{ id: 3 }, { id: 4 }], null, { id: 30 }),
    ];

    it("leaves out a printing that differs from the one before only by number and year", () => {
        expect(printingLines(dracula).map(l => l.edition.id)).toEqual([1529, 1530, 1531, 1532, 1533, 8004, 8005]);
    });

    it("names the translators only when they change from the line above", () => {
        expect(printingLines(dracula).map(l => l.showTranslators)).toEqual([true, true, false, false, false, false, true]);
    });

    it("keeps a reprint the reader owns or has on the wishlist, so the mark shows", () => {
        const marked = dracula.map(e => (e.id === 6892 ? { ...e, owned: true } : e.id === 10177 ? { ...e, wishlisted: true } : e));
        expect(printingLines(marked).map(l => l.edition.id)).toEqual([1529, 1530, 6892, 1531, 1532, 1533, 8004, 10177, 8005]);
    });

    it("compares with every line shown in the laitos, ignores translator order and a printing with no translator recorded", () => {
        // Tolkien's Hobitti, 4. laitos in the dev data (owner, 2026-11-26): the 3. painos has no translator recorded,
        // the 5. painos is in the Bon series, and the 4. and 6. are the same as the first.
        const juva = [{ id: 163 }], wsoy = { id: 387 };
        const hobitti = [
            p(1734, 4, 1, "Hobitti", juva, null, wsoy),
            p(6747, 4, 2, "Hobitti", juva, null, wsoy),
            p(6748, 4, 3, "Hobitti", [], null, wsoy),
            p(1735, 4, 4, "Hobitti", juva, null, wsoy),
            p(1736, 4, 5, "Hobitti", juva, 50, wsoy),
            p(1737, 4, 6, "Hobitti", juva, null, wsoy),
            p(6731, 5, 1, "Hobitti", [{ id: 163 }, { id: 7 }], null, wsoy),
        ];
        expect(printingLines(hobitti).map(l => l.edition.id)).toEqual([1734, 1736, 6731]);
        expect(printingLines(hobitti).map(l => l.showTranslators)).toEqual([true, false, true]);
        // Taru sormusten herrasta: the same three translators in another order are not a new translation.
        const taru = [p(1, 1, 1, "Taru", [{ id: 1 }, { id: 2 }, { id: 3 }], null, wsoy), p(2, 1, 2, "Taru", [{ id: 3 }, { id: 1 }, { id: 2 }], null, wsoy)];
        expect(printingLines(taru).map(l => l.edition.id)).toEqual([1]);
    });

    it("keeps a new laitos even when nothing else changes", () => {
        const same = [p(1, 1, 1, "A", laine, null), p(2, 2, 1, "A", laine, null)];
        expect(printingLines(same).map(l => l.edition.id)).toEqual([1, 2]);
    });
});
