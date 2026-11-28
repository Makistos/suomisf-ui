import { describe, expect, it } from "vitest";

import { GROUPS, groupOf, parseTagsState, tagFacts, tagIndexQuery, writeTagsState } from "./tags-state";

const parse = (q: string) => parseTagsState(new URLSearchParams(q));

describe("parseTagsState", () => {
    it("opens on Alalajit with every tag, sorted by name", () => {
        expect(parse("")).toEqual({ ryhma: GROUPS[0], kirjain: null, haku: "", jarjestys: "nimi" });
    });

    it("opens a big group at A, and reads letters, 'kaikki', search and sort", () => {
        expect(parse("ryhma=aiheet").kirjain).toBe("A");
        expect(parse("ryhma=aiheet&kirjain=%C3%A4").kirjain).toBe("Ä");
        expect(parse("ryhma=aiheet&kirjain=0").kirjain).toBe("0");
        expect(parse("ryhma=aiheet&kirjain=kaikki").kirjain).toBeNull();
        expect(parse("ryhma=paikat&haku=+suo+&jarjestys=maara")).toMatchObject({ haku: "suo", jarjestys: "maara" });
    });

    it("drops what it can't use; small groups have no letter", () => {
        expect(parse("ryhma=x&jarjestys=y")).toMatchObject({ ryhma: GROUPS[0], jarjestys: "nimi" });
        expect(parse("ryhma=aiheet&kirjain=ZZ").kirjain).toBe("A");
        expect(parse("ryhma=tyylit&kirjain=B").kirjain).toBeNull();
    });
});

describe("writeTagsState", () => {
    it("round-trips and leaves the defaults out", () => {
        for (const q of ["", "ryhma=aiheet", "ryhma=aiheet&kirjain=B", "ryhma=hahmot&kirjain=kaikki", "ryhma=tyylit&haku=punk&jarjestys=maara"]) {
            expect(writeTagsState(parse(q)).toString()).toBe(q);
        }
    });
});

describe("tagIndexQuery", () => {
    it("asks for the group and letter, or the search instead of the letter", () => {
        expect(tagIndexQuery(parse("ryhma=aiheet&kirjain=B"), false)).toBe("type=1&letter=B");
        expect(tagIndexQuery(parse("ryhma=aiheet&kirjain=B&haku=aika&jarjestys=maara"), true)).toBe("type=1&q=aika&sort=count&unused=1");
        expect(tagIndexQuery(parse(""), false)).toBe("type=2");
    });
});

describe("groupOf and tagFacts", () => {
    it("treats a tag without a type as Aihe, as the current page does", () => {
        expect(groupOf(null).slug).toBe("aiheet");
        expect(groupOf(4).one).toBe("Hahmo tai olento");
    });

    it("writes the counts in words, leaving out empty ones", () => {
        expect(tagFacts(40, 12, 10)).toBe("40 teosta, 12 novellia, 10 artikkelia");
        expect(tagFacts(1, 0, 1)).toBe("1 teos, 1 artikkeli");
        expect(tagFacts(0, 0, 0)).toBe("");
    });
});
