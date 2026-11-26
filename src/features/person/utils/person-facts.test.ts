import { describe, expect, it } from "vitest";

import { contribution, edition, short, work } from "../../../test/factories";
import type { Person } from "../types";
import type { Awarded } from "../../award";
import {
    aboutItems, booksByRole, byCredit, creditFacets, derivePersonRoles, FICTION_TYPES, outputSummary, writerCredit,
    personTabs, personWorks, visibleLinks,
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

describe("writerCredit / creditFacets / byCredit", () => {
    // Stephen King, his pen name Richard Bachman (ALIAS), and a co-author (OTHER).
    const king = person({ alt_name: "Stephen King", aliases: [{ id: ALIAS, name: "Bachman, Richard", alt_name: "Richard Bachman" }] } as Partial<Person>);
    const writers = (...ids: number[]) => ids.map(id => contribution(id, 1, id === OTHER ? "Straub, Peter" : id === ALIAS ? "Bachman, Richard" : "King, Stephen"));

    it("says who a book is credited to: the person, a pen name, or the person with co-authors", () => {
        expect(writerCredit(writers(ME), king)).toMatchObject({ key: String(ME), label: "Stephen King", coAuthors: [], rank: 0 });
        expect(writerCredit(writers(ALIAS), king)).toMatchObject({ key: String(ALIAS), label: "Richard Bachman", penName: "Richard Bachman", rank: 1 });
        const together = writerCredit(writers(OTHER, ME), king);
        expect(together).toMatchObject({ key: `${ME}-${OTHER}`, label: "Stephen King & Peter Straub", rank: 2 });
        expect(together.coAuthors.map(c => c.name)).toEqual(["Peter Straub"]);
        // Credited under both his own name and the pen name: his own name wins.
        expect(writerCredit(writers(ME, ALIAS), king).key).toBe(String(ME));
    });

    it("lists each credit with its count: own name first, pen names, then collaborations; null with only one", () => {
        const credits = [writers(ME), writers(ME), writers(ALIAS), writers(ME, OTHER)].map(w => writerCredit(w, king));
        expect(creditFacets(credits)).toEqual([
            { key: String(ME), label: "Stephen King", count: 2 },
            { key: String(ALIAS), label: "Richard Bachman", count: 1 },
            { key: `${ME}-${OTHER}`, label: "Stephen King & Peter Straub", count: 1 },
        ]);
        expect(creditFacets([writerCredit(writers(ME), king)])).toBeNull();
    });

    it("folds many collaborations into one button, so the row stays short", () => {
        const co = (n: number) => writerCredit([...writers(ME), contribution(500 + n, 1, `Kirjoittaja ${n}, Testi`)], king);
        const credits = [writerCredit(writers(ME), king), co(1), co(2), co(3), co(4), co(5), co(5)];
        expect(creditFacets(credits)).toEqual([
            { key: String(ME), label: "Stephen King", count: 1 },
            { key: "yhdessa", label: "Yhdessä muiden kanssa", count: 6 },
        ]);
        expect(creditFacets(credits.slice(0, 5))!.map(f => f.key)).toEqual([String(ME), `${ME}-501`, `${ME}-502`, `${ME}-503`, `${ME}-504`]);
        const items = credits.map((credit, id) => ({ id, credit }));
        expect(byCredit(items, "yhdessa").map(x => x.id)).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it("keeps only the items under the chosen credit", () => {
        const items = [writers(ME), writers(ALIAS), writers(ME, OTHER)].map((w, i) => ({ id: i, credit: writerCredit(w, king) }));
        expect(byCredit(items, `${ME}-${OTHER}`).map(x => x.id)).toEqual([2]);
        expect(byCredit(items, null)).toHaveLength(3);
    });

    it("gives every written book its credit, and King's Bachman books say so", () => {
        const own = work({ id: 1, title: "Hohto", work_type: type(1, "Romaani"), contributions: writers(ME), editions: [] });
        const bachman = work({ id: 2, title: "Kirous", work_type: type(1, "Romaani"), contributions: writers(ALIAS), editions: [] });
        const entries = booksByRole({ ...king, works: [own, bachman] } as Person, FICTION_TYPES, () => true).kirjoittaja;
        expect(entries.map(e => [e.work.title, e.credit?.label, e.asName])).toEqual([["Hohto", "Stephen King", undefined], ["Kirous", "Richard Bachman", "Richard Bachman"]]);
    });
});

describe("personWorks: a pen name several writers share", () => {
    // The person and another writer both write as ALIAS; each work's credit names its real writer.
    const credit = (realId: number | null) =>
        ({ ...contribution(ALIAS, 1), real_person: realId ? { id: realId, name: "", alt_name: "" } : undefined }) as ReturnType<typeof contribution>;
    const mine = work({ id: 21, title: "Minun", work_type: type(1, "Romaani"), genres: [genre("F")], contributions: [credit(ME)],
        editions: [edition({ id: 2101 })] });
    const theirs = work({ id: 22, title: "Toisen", work_type: type(1, "Romaani"), genres: [genre("F")], contributions: [credit(OTHER)],
        editions: [edition({ id: 2201 })] });
    const unknown = work({ id: 23, title: "Tuntematon", work_type: type(1, "Romaani"), genres: [genre("F")], contributions: [credit(null)],
        editions: [edition({ id: 2301 })] });
    const p = person({ aliases: [{ id: ALIAS, name: "Hunter, Erin", alt_name: "Erin Hunter" }] as never, works: [novel, mine, theirs, unknown] });

    it("leaves out a work another writer wrote under the shared name (as the old page does)", () => {
        expect(personWorks(p).map(w => w.id)).toEqual([1, 21, 23]);
    });

    it("keeps a work under the shared name when the real writer is one of the person's real names", () => {
        const viaRealName = person({ ...p, real_names: [{ id: OTHER, name: "", alt_name: "" }] as never });
        expect(personWorks(viaRealName).map(w => w.id)).toEqual([1, 21, 22, 23]);
    });

    it("keeps the other writer's book out of the lists and the counts", () => {
        const teokset = booksByRole(p, FICTION_TYPES, () => true).kirjoittaja.map(e => e.work.id);
        expect(teokset).toEqual([1, 21, 23]);
        expect(outputSummary(p, [])).toMatch(/^3 kirjaa, 4 painosta/);
    });
});
