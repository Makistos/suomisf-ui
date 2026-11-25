import { describe, expect, it } from "vitest";

import {
    filterRows, groupRows, parseListState, sortRows, typeFacets, typeSlug, withListState, type ListRow,
} from "./list-state";

const row = (fields: Partial<ListRow>): ListRow => ({
    id: 1, title: "Teos", origTitle: "", origYear: null, firstYear: null, type: "Romaani",
    years: [], series: null, ...fields,
});

const rows: ListRow[] = [
    row({ id: 1, title: "Maameren velho", origTitle: "A Wizard of Earthsea", origYear: 1968, firstYear: 1976, years: [1976, 1984], series: "Maameren tarinat" }),
    row({ id: 2, title: "Pimeälipas", origYear: 1975, firstYear: 2006, type: "Kokoelma", years: [2006] }),
    row({ id: 3, title: "Lavinia", origYear: 2008, firstYear: 2009, years: [2009] }),
    row({ id: 4, title: "Ääniä", origYear: null, firstYear: 1990, years: [1990] }),
    row({ id: 5, title: "Nimetön" }),
];

describe("parseListState / withListState", () => {
    it("reads every part of the view from the URL, with defaults", () => {
        const s = parseListState(new URLSearchParams("osio=novellit&rooli=kaantaja&tyyppi=romaanit&haku=maa&vuosi=1980-1984&jarjestys=suomivuosi&nakyma=kannet&sarjoittain=1"));
        expect(s).toEqual({ osio: "novellit", rooli: "kaantaja", tekija: null, tyyppi: "romaanit", haku: "maa",
            vuosi: { from: 1980, to: 1984 }, jarjestys: "suomivuosi", nakyma: "kannet", sarjoittain: true });
        expect(parseListState(new URLSearchParams(""))).toEqual({ osio: null, rooli: null, tekija: null, tyyppi: null, haku: "",
            vuosi: null, jarjestys: "nimi", nakyma: "lista", sarjoittain: false });
    });

    it("leaves defaults out of the URL", () => {
        const p = withListState(new URLSearchParams("vuosi=1984"), { jarjestys: "nimi", nakyma: "lista", vuosi: null });
        expect(p.toString()).toBe("");
        // Title is the default order (decided 2026-11-24); the original year is a choice.
        expect(withListState(new URLSearchParams(), { jarjestys: "alkuvuosi" }).toString()).toBe("jarjestys=alkuvuosi");
    });

    it("clears the tab's filters when the tab changes, and keeps sort and view", () => {
        const p = withListState(new URLSearchParams("osio=teokset&rooli=kaantaja&tyyppi=romaanit&haku=maa&vuosi=1984&jarjestys=nimi&nakyma=kannet"),
            { osio: "novellit" });
        expect(Object.fromEntries(p)).toEqual({ osio: "novellit", jarjestys: "nimi", nakyma: "kannet" });
    });

    it("writes a year range as from-to and a single year as one number", () => {
        expect(withListState(new URLSearchParams(), { vuosi: { from: 1980, to: 1984 } }).get("vuosi")).toBe("1980-1984");
        expect(withListState(new URLSearchParams(), { vuosi: { from: 1984, to: 1984 } }).get("vuosi")).toBe("1984");
    });
});

describe("filterRows and typeFacets", () => {
    const base = parseListState(new URLSearchParams(""));

    it("filters by type, by name (Finnish or original title) and by printing year, together", () => {
        expect(filterRows(rows, { ...base, haku: "earth" }).map(r => r.id)).toEqual([1]);
        expect(filterRows(rows, { ...base, tyyppi: typeSlug("Kokoelma") }).map(r => r.id)).toEqual([2]);
        expect(filterRows(rows, { ...base, vuosi: { from: 1980, to: 1989 } }).map(r => r.id)).toEqual([1]);
        expect(filterRows(rows, { ...base, haku: "a", vuosi: { from: 2005, to: 2009 } }).map(r => r.id)).toEqual([2, 3]);
    });

    it("counts each type under the other active filters", () => {
        expect(typeFacets(rows, { ...base, vuosi: { from: 2000, to: 2010 } })).toEqual([["Romaani", 1], ["Kokoelma", 1]]);
        expect(typeFacets(rows, base)).toEqual([["Romaani", 4], ["Kokoelma", 1]]);
    });

    it("makes ascii slugs of type names for the URL", () => {
        expect(typeSlug("Pitkä novelli")).toBe("pitka-novelli");
        expect(typeSlug("Jälkisanat")).toBe("jalkisanat");
    });
});

describe("sortRows and groupRows", () => {
    it("sorts by original year (else the first Finnish one) with unknown years last, by Finnish year, or by name", () => {
        expect(sortRows(rows, "alkuvuosi").map(r => r.id)).toEqual([1, 2, 4, 3, 5]);
        expect(sortRows(rows, "suomivuosi").map(r => r.id)).toEqual([1, 4, 2, 3, 5]);
        expect(sortRows(rows, "nimi").map(r => r.title)).toEqual(["Lavinia", "Maameren velho", "Nimetön", "Pimeälipas", "Ääniä"]);
    });

    it("groups by decade when sorted by year, by series when asked, and not at all by name", () => {
        const s = parseListState(new URLSearchParams("jarjestys=alkuvuosi"));
        expect(groupRows(sortRows(rows, "alkuvuosi"), s).map(g => [g.label, g.rows.length]))
            .toEqual([["1960-luku", 1], ["1970-luku", 1], ["1990-luku", 1], ["2000-luku", 1], ["Vuosi ei tiedossa", 1]]);
        expect(groupRows(sortRows(rows, "alkuvuosi"), { ...s, sarjoittain: true }).map(g => g.label))
            .toEqual(["Maameren tarinat", "Ei sarjaa"]);
        expect(groupRows(sortRows(rows, "nimi"), { ...s, jarjestys: "nimi" }).map(g => g.label)).toEqual([null]);
    });
});

describe("tekija", () => {
    it("is read from and written to the URL, and cleared with the tab and the role", () => {
        expect(parseListState(new URLSearchParams("tekija=2370-5521")).tekija).toBe("2370-5521");
        expect(parseListState(new URLSearchParams()).tekija).toBeNull();
        expect(withListState(new URLSearchParams(), { tekija: "2712" }).toString()).toBe("tekija=2712");
        expect(withListState(new URLSearchParams("tekija=2712"), { osio: "novellit" }).get("tekija")).toBeNull();
        expect(withListState(new URLSearchParams("tekija=2712"), { rooli: "kaantaja" }).get("tekija")).toBeNull();
    });

    it("groups by credit when sorted by title and there is more than one credit", () => {
        const s = parseListState(new URLSearchParams());
        const row = (id: number, title: string, label: string, rank: number) =>
            ({ id, title, origTitle: "", origYear: null, firstYear: null, type: "Romaani", years: [], series: null, credit: { key: label, label, rank } });
        const rs = [row(1, "B", "Anne Leinonen & Eija Lappalainen", 2), row(2, "A", "Anne Leinonen", 0), row(3, "C", "Anne Leinonen", 0)];
        expect(groupRows(sortRows(rs, "nimi"), s).map(g => [g.label, g.rows.map(r => r.title)]))
            .toEqual([["Anne Leinonen", ["A", "C"]], ["Anne Leinonen & Eija Lappalainen", ["B"]]]);
        expect(groupRows(sortRows(rs.slice(1), "nimi"), s).map(g => g.label)).toEqual([null]);
    });
});
