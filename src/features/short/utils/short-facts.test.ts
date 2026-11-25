import { describe, expect, it } from "vitest";

import { edition, short, work } from "../../../test/factories";
import type { Issue } from "@features/issue";
import { origYearMismatch, publicationRows, publishedCount, translationRows } from "./short-facts";

const wsoy = { id: 387, name: "WSOY" };
const rueMorgue = work({ id: 2268, title: "Rue Morguen murhat ja muita kertomuksia", author_str: "Poe, Edgar Allan", type: 2 } as never);
const majatalo = work({ id: 2936, title: "Majatalo ja muita kauhutarinoita", author_str: "Helttunen, Anne & Uusi-Hallila, Tuula (toim.)", type: 2 } as never);
const issue = (fields: Partial<Issue>) => ({ id: 5, year: 1983, cover_number: "Vol.2 No.1", magazine: { id: 3, name: "Aikakone" }, images: [], ...fields } as Issue);

// Poe, Kielivä sydän (/shorts/714): Rue Morguen murhat in 1975 and 2000 is one book.
const poe = short({
    id: 714, title: "Kielivä sydän", pubyear: "1850",
    contributors: [{ person: { id: 712, name: "Lehtonen, Paavo", alt_name: "Paavo Lehtonen" }, role: { id: 2, name: "Kääntäjä" } }] as never,
    editions: [
        edition({ id: 3367, title: majatalo.title, pubyear: 2000, editionnum: 1, publisher: wsoy, work: majatalo } as never),
        edition({ id: 7419, title: rueMorgue.title, pubyear: 2000, editionnum: 2, publisher: wsoy, work: rueMorgue } as never),
        edition({ id: 2606, title: rueMorgue.title, pubyear: 1975, editionnum: 1, publisher: wsoy, work: rueMorgue,
            images: [{ id: 1, image_src: "/rue.jpg" }] } as never),
    ],
    issues: [],
});

describe("publicationRows", () => {
    it("makes one row per book with its printings oldest first, and orders books and magazines by year", () => {
        const rows = publicationRows(poe);
        expect(rows.map(r => r.title)).toEqual(["Rue Morguen murhat ja muita kertomuksia", "Majatalo ja muita kauhutarinoita"]);
        const rue = rows[0];
        expect(rue.kind).toBe("book");
        expect(rue.kind === "book" && rue.printings.map(p => [p.id, p.year, p.num])).toEqual([[2606, 1975, 1], [7419, 2000, 2]]);
        expect(rue.kind === "book" && rue.by).toBe("Edgar Allan Poe");
        expect(rue.kind === "book" && rue.publisher).toBe("WSOY");
        expect(rue.kind === "book" && rue.type).toBe("Kokoelma");
        expect(rue.cover?.image_src).toBe("/rue.jpg");
        expect(rows[1].kind === "book" && rows[1].by).toBe("Anne Helttunen & Tuula Uusi-Hallila (toim.)");
    });

    it("puts magazine issues in the same list by year", () => {
        const s = short({ ...poe, issues: [issue({ year: 1983 })] });
        const rows = publicationRows(s);
        expect(rows.map(r => r.kind)).toEqual(["book", "issue", "book"]);
        expect(rows[1].title).toBe("Aikakone Vol.2 No.1");
        expect(rows[1].kind === "issue" && rows[1].id).toBe(5);
    });

    it("uses the first printing's cover that exists, and works without any", () => {
        const rows = publicationRows(short({ ...poe, editions: [poe.editions[0]] }));
        expect(rows[0].cover).toBeUndefined();
    });
});

describe("publishedCount", () => {
    it("counts books, printings when there are more than books, and magazines", () => {
        expect(publishedCount(publicationRows(poe))).toBe("2 kirjaa, 3 painosta");
        expect(publishedCount(publicationRows(short({ ...poe, editions: [poe.editions[0]], issues: [issue({})] })))).toBe("1 kirja, 1 lehti");
        expect(publishedCount(publicationRows(short({ ...poe, editions: [], issues: [issue({}), issue({ id: 6 })] })))).toBe("2 lehteä");
        expect(publishedCount([])).toBe("");
    });
});

const translation = (id: number, title: string, pubyear: string, translator: string, eds: [string, number][], issues: Issue[] = []) => short({
    id, title, pubyear,
    contributors: [
        { person: { id: id + 1, name: translator, alt_name: translator.split(", ").reverse().join(" ") }, role: { id: 2, name: "Kääntäjä" } },
        { person: { id: 1531, name: "Poe, Edgar Allan", alt_name: "Edgar Allan Poe" }, role: { id: 1, name: "Kirjoittaja" } },
    ] as never,
    editions: eds.map(([t, y], i) => edition({ id: id * 10 + i, title: t, pubyear: y, work: work({ id: id * 10 + i, title: t }) } as never)),
    issues,
});

describe("translationRows", () => {
    const similar = [
        translation(7850, "Paljastava sydän", "1843", "Kivimäki, Mika", [["Haamutarinoita", 2006], ["Haamutarinoita", 2006]]),
        translation(14398, "Kielivä sydän", "1850", "Nopsanen, Aulis", [["Punaisen surman naamio", 1954], ["Punaisen surman naamio", 1981]]),
        translation(13985, "Kielivä sydän", "1850", "Kapari-Jatta, Jaana", [["Kootut kertomukset", 2017], ["Kootut kertomukset", 2006]]),
    ];

    it("lists every translation oldest first with the current one flagged", () => {
        const rows = translationRows(poe, similar);
        expect(rows.map(r => [r.id, r.first, r.current])).toEqual([
            [14398, 1954, false], [714, 1975, true], [7850, 2006, false], [13985, 2006, false],
        ]);
        expect(rows[0].translators).toEqual([{ id: 14399, name: "Aulis Nopsanen" }]);
        expect(rows[1].places).toEqual(["Rue Morguen murhat ja muita kertomuksia", "Majatalo ja muita kauhutarinoita"]);
        expect(rows[1].count).toBe(3);
        expect(rows[2].places).toEqual(["Haamutarinoita"]);
        expect(rows[2].count).toBe(2);
    });

    it("is empty when there is no other translation", () => {
        expect(translationRows(poe, [])).toEqual([]);
    });

    it("counts magazines among the places", () => {
        const rows = translationRows(poe, [translation(9, "Sydän", "1850", "X, Y", [], [issue({ year: 1990 })])]);
        expect(rows.find(r => r.id === 9)).toMatchObject({ first: 1990, places: ["Aikakone Vol.2 No.1"], count: 1 });
    });
});

describe("origYearMismatch", () => {
    it("lists the differing original years with the translations that give them", () => {
        const similar = [translation(7850, "Paljastava sydän", "1843", "Kivimäki, Mika", [])];
        expect(origYearMismatch(poe, similar)).toEqual([
            { year: "1843", titles: ["Paljastava sydän"] },
            { year: "1850", titles: ["Kielivä sydän"] },
        ]);
    });

    it("is null when the years agree or are missing", () => {
        expect(origYearMismatch(poe, [translation(14398, "Kielivä sydän", "1850", "Nopsanen, Aulis", [])])).toBeNull();
        expect(origYearMismatch(poe, [translation(1, "X", "", "A, B", [])])).toBeNull();
    });
});
