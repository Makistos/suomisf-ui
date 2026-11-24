import { describe, expect, it } from "vitest";

import { contribution, edition, short, work } from "../../../test/factories";
import type { Person } from "../types";
import type { Awarded } from "../../award";
import {
    aboutItems, binYears, booksByRole, byPenName, derivePersonRoles, editionsByYear, FICTION_TYPES, outputSummary, penNameFacets,
    personTabs, visibleLinks,
} from "./person-facts";

const ME = 10;
const ALIAS = 11;
const OTHER = 99;

const genre = (abbr: string) => ({ id: abbr.length, name: abbr, abbr });
const type = (id: number, name = `Type ${id}`) => ({ id, name });

const person = (fields: Partial<Person> = {}): Person => ({
    id: ME, name: "Testaaja, Taina", alt_name: "Taina Testaaja", fullname: "", other_names: "",
    aliases: [], real_names: [], images: [], links: [], works: [], stories: [], editions: [], edits: [],
    ...fields,
} as unknown as Person);

// A novel the person wrote, and Esko Miettinen's non-fiction book Le Guin only appears in.
const novel = work({ id: 1, title: "Maameren velho", work_type: type(1, "Romaani"), genres: [genre("F")],
    contributions: [contribution(ME, 1)],
    editions: [edition({ id: 101, pubyear: 1976 }), edition({ id: 102, pubyear: 1984, editionnum: 2 })] });
const appearsIn = work({ id: 2, title: "Velhot, örkit, sankarit", work_type: type(4, "Tietokirja"), genres: [],
    contributions: [contribution(OTHER, 1), contribution(ME, 6, "Testaaja", "Esiintyy")],
    editions: [edition({ id: 201, pubyear: 2004 })] });

describe("derivePersonRoles", () => {
    it("doesn't make someone a tietokirjailija for a non-fiction book they only appear in", () => {
        expect(derivePersonRoles(person({ works: [novel, appearsIn] }), [])).toEqual(["Kirjailija"]);
    });

    it("gives tietokirjailija to the author of a non-fiction book", () => {
        const nonfiction = work({ id: 3, work_type: type(4), contributions: [contribution(ME, 1)] });
        expect(derivePersonRoles(person({ works: [nonfiction] }), [])).toEqual(["Tietokirjailija"]);
    });

    it("doesn't make someone a kirjailija for a novel they only appear in", () => {
        const subject = work({ id: 4, work_type: type(1), contributions: [contribution(OTHER, 1), contribution(ME, 6)] });
        expect(derivePersonRoles(person({ works: [subject] }), [])).toEqual([]);
    });

    it("counts books published under the person's pen name", () => {
        const asAlias = work({ id: 5, work_type: type(1), contributions: [contribution(ALIAS, 1)] });
        expect(derivePersonRoles(person({ works: [asAlias], aliases: [{ id: ALIAS } as Person] }), [])).toEqual(["Kirjailija"]);
    });

    it("derives story roles from the story type and never from Esiintyy", () => {
        const stories = [
            short({ id: 1, type: type(1, "Novelli"), contributors: [contribution(ME, 1)] }),
            short({ id: 2, type: type(4, "Runo"), contributors: [contribution(ME, 1)] }),
            short({ id: 3, type: type(7, "Artikkeli"), contributors: [contribution(OTHER, 1), contribution(ME, 6)] }),
        ];
        expect(derivePersonRoles(person({ stories }), [])).toEqual(["Novellisti", "Runoilija"]);
    });

    it("lists roles in the live page's order", () => {
        const stories = [short({ id: 1, type: type(7), contributors: [contribution(ME, 1)] }),
            short({ id: 2, type: type(1), contributors: [contribution(ME, 1)] })];
        const editions = [edition({ id: 9, contributions: [contribution(ME, 2)] })];
        expect(derivePersonRoles(person({ works: [novel], stories, editions }), []))
            .toEqual(["Kirjailija", "Kirjoittaja", "Kääntäjä", "Novellisti"]);
    });
});

describe("aboutItems", () => {
    it("lists books and articles the person only appears in, apart", () => {
        const own = short({ id: 1, title: "Oma artikkeli", type: type(7), contributors: [contribution(ME, 1)] });
        const about = short({ id: 2, title: "Haastattelu", type: type(7), pubyear: "2007", contributors: [contribution(OTHER, 1), contribution(ME, 6)] });
        const both = short({ id: 3, title: "Hylyntyhjentäjien laulu", type: type(7), contributors: [contribution(ME, 6), contribution(ME, 1)] });
        const result = aboutItems(person({ works: [novel, appearsIn], stories: [own, about, both] }));
        expect(result.books.map(w => w.title)).toEqual(["Velhot, örkit, sankarit"]);
        expect(result.articles.map(s => s.title)).toEqual(["Haastattelu"]);
    });
});

describe("editionsByYear", () => {
    it("counts each printing in a production role once and leaves out books the person only appears in", () => {
        const translated = edition({ id: 301, pubyear: 1984, editionnum: 1, contributions: [contribution(ME, 2), contribution(ME, 4)] });
        const byYear = editionsByYear(person({ works: [novel, appearsIn], editions: [translated] }));
        expect(byYear).toEqual({ 1976: { all: 1, first: 1 }, 1984: { all: 2, first: 1 } });
    });

    it("counts a new version (laitos) as not a first printing", () => {
        const w = work({ id: 6, work_type: type(1), contributions: [contribution(ME, 1)],
            editions: [edition({ id: 1, pubyear: 1990 }), edition({ id: 2, pubyear: 2000, version: 2, editionnum: 1 })] });
        expect(editionsByYear(person({ works: [w] }))).toEqual({ 1990: { all: 1, first: 1 }, 2000: { all: 1, first: 0 } });
    });
});

describe("binYears", () => {
    it("uses one bar a year when every bar gets at least 6 px", () => {
        const r = binYears({ 1976: { all: 2, first: 1 }, 1984: { all: 4, first: 2 } }, 700);
        expect(r.bin).toBe(1);
        expect(r.bins).toHaveLength(9);
        expect(r.max).toBe(4);
        expect(r.bins[8]).toEqual({ from: 1984, to: 1984, all: 4, first: 2 });
    });

    it("widens bars to 2, 5 or 10 years for long spans on a narrow chart", () => {
        const verne = { 1879: { all: 1, first: 1 }, 2024: { all: 3, first: 0 } };
        expect(binYears(verne, 860).bin).toBe(2);
        expect(binYears(verne, 345).bin).toBe(5);
        const r = binYears(verne, 345);
        expect(r.bins[0].from).toBe(1875);
        expect(r.bins.at(-1)).toMatchObject({ from: 2020, to: 2024, all: 3 });
    });
});

describe("outputSummary", () => {
    const awards = [{}, {}, {}] as Awarded[];

    it("counts the person's own books, printings, stories and every award", () => {
        const stories = [short({ id: 1, type: type(1), contributors: [contribution(ME, 1)] }),
            short({ id: 2, type: type(7), contributors: [contribution(OTHER, 1), contribution(ME, 6)] })];
        expect(outputSummary(person({ works: [novel, appearsIn], stories }), awards))
            .toBe("1 kirja, 2 painosta, 1 novelli tai artikkeli, 3 palkintoa");
    });

    it("tells own books apart from translations and covers", () => {
        const translations = [1, 2].map(i => edition({ id: 400 + i, pubyear: 2000 + i,
            work: work({ id: 40 + i, work_type: type(1) }), contributions: [contribution(ME, 2)] }));
        const cover = edition({ id: 500, pubyear: 2010, work: work({ id: 50, work_type: type(1) }), contributions: [contribution(ME, 4)] });
        expect(outputSummary(person({ works: [novel], editions: [...translations, cover] }), []))
            .toBe("1 oma kirja, 2 suomennosta, 1 kansikuva, 5 painosta");
    });

    it("says nothing about a kind of output the person doesn't have", () => {
        expect(outputSummary(person(), [])).toBe("");
    });
});

describe("personTabs", () => {
    const tabs = (p: Person, awards: Awarded[] = [], issues = 0) =>
        personTabs(p, awards, issues).map(t => [t.label, t.count]);

    it("shows only tabs with content, Henkilöstä last", () => {
        const sfStory = short({ id: 1, type: type(1), genres: [genre("SF")], contributors: [contribution(ME, 1)] });
        const about = short({ id: 2, type: type(7), contributors: [contribution(OTHER, 1), contribution(ME, 6)] });
        expect(tabs(person({ works: [novel, appearsIn], stories: [sfStory, about] }), [{} as Awarded]))
            .toEqual([["Teokset", 1], ["Novellit ja artikkelit", 1], ["Palkinnot", 1], ["Henkilöstä", 2]]);
    });

    it("lists non-SF books and stories under Muu tuotanto, not Teokset", () => {
        const nonSf = work({ id: 7, work_type: type(1), genres: [genre("eiSF")], contributions: [contribution(ME, 1)] });
        const nonSfStory = short({ id: 3, type: type(1), genres: [genre("eiSF")], contributors: [contribution(ME, 1)] });
        expect(tabs(person({ works: [novel, nonSf], stories: [nonSfStory] })))
            .toEqual([["Teokset", 1], ["Muu tuotanto", 2]]);
    });

    it("counts series of the person's own books, non-SF ones included, as the live page does", () => {
        const series = (id: number) => ({ id, name: `Sarja ${id}` });
        const a = work({ id: 8, work_type: type(1), genres: [genre("F")], bookseries: series(1), contributions: [contribution(ME, 1)] } as never);
        const b = work({ id: 9, work_type: type(1), genres: [genre("eiSF")], bookseries: series(2), contributions: [contribution(ME, 1)] } as never);
        expect(tabs(person({ works: [a, b] }))).toEqual([["Teokset", 1], ["Sarjat", 2], ["Muu tuotanto", 1]]);
    });

    it("counts Teokset across roles: own books, translations and covers, each work once per role", () => {
        const translated = edition({ id: 601, work: work({ id: 60, work_type: type(1), genres: [genre("SF")] }), contributions: [contribution(ME, 2)] });
        const translated2 = edition({ id: 602, work: work({ id: 60, work_type: type(1), genres: [genre("SF")] }), contributions: [contribution(ME, 2)] });
        const teokset = personTabs(person({ works: [novel], editions: [translated, translated2] }), [], 0)[0];
        expect(teokset.count).toBe(2);
        expect(teokset.roles).toEqual([["Kirjoittanut", 1], ["Kääntänyt", 1]]);
    });
});

describe("visibleLinks", () => {
    it("leaves out link rows without an address", () => {
        const links = [{ link: "", description: "" }, { link: "https://example.org/", description: "Koti" }];
        expect(visibleLinks(links as never)).toEqual([{ link: "https://example.org/", description: "Koti" }]);
    });
});

describe("penNameFacets / byPenName", () => {
    // Stephen King and his pen name Richard Bachman (ALIAS).
    const own = work({ id: 1, title: "Hohto", work_type: type(1, "Romaani"), contributions: [contribution(ME, 1)], editions: [] });
    const both = work({ id: 3, title: "Yhdessä", work_type: type(1, "Romaani"), contributions: [contribution(ME, 1), contribution(ALIAS, 1)], editions: [] });
    const bachman = work({ id: 2, title: "Kirous", work_type: type(1, "Romaani"), contributions: [contribution(ALIAS, 1)], editions: [] });
    const king = person({ alt_name: "Stephen King", aliases: [{ id: ALIAS, name: "Bachman, Richard", alt_name: "Richard Bachman" }],
        works: [own, bachman, both] } as Partial<Person>);
    const entries = () => booksByRole(king, FICTION_TYPES, () => true).kirjoittaja;

    it("offers the own name and each pen name with its count, only when a pen name has books", () => {
        expect(penNameFacets(entries(), king)).toEqual([
            { key: "oma", label: "Stephen King", count: 2 },
            { key: String(ALIAS), label: "Richard Bachman", count: 1 },
        ]);
        expect(penNameFacets(booksByRole(person({ works: [own] }), FICTION_TYPES, () => true).kirjoittaja, person())).toBeNull();
    });

    it("keeps only the books published under the chosen name", () => {
        expect(byPenName(entries(), String(ALIAS)).map(e => e.work.title)).toEqual(["Kirous"]);
        expect(byPenName(entries(), "oma").map(e => e.work.title)).toEqual(["Hohto", "Yhdessä"]);
        expect(byPenName(entries(), null)).toHaveLength(3);
    });
});
