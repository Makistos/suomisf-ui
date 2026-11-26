import { describe, expect, it } from "vitest";

import { filterPublishers, ListRow, parseListState, sortPublishers, withListState, yearAxis } from "./publisher-list-state";

const parse = (q: string) => parseListState(new URLSearchParams(q));
const row = (id: number, name: string, editions: number, first: number | null, last: number | null, fullname = name): ListRow =>
    ({ id, name, fullname, editions, first_year: first, last_year: last, magazines: [] });
// Real rows from the dev data (2026-11-26).
const wsoy = row(387, "WSOY", 2260, 1889, 2026, "Werner Söderström Oy");
const tammi = row(10, "Tammi", 1148, 1943, 2026);
const aikakone = { ...row(6, "Aikakone ry", 0, null, null, "Aikakone Ry"), magazines: [{ id: 3, name: "Aikakone", issues: 50 }] };
const ahjo = row(5, "Ahjo", 1, 1920, 1920);
const all = [wsoy, tammi, aikakone, ahjo];

describe("parseListState", () => {
    it("reads every key with readable values", () => {
        expect(parse("nimi=werner&toiminut=1950-1980&piilota=tyhjat&jarjestys=painoksia&suunta=nouseva")).toEqual({
            nimi: "werner", toiminut: { from: 1950, to: 1980 }, piilota: true, jarjestys: "painoksia", suunta: "nouseva",
        });
    });

    it("falls back to the defaults for missing or broken values, each column's own direction", () => {
        expect(parse("toiminut=abc&jarjestys=x&suunta=y")).toEqual({ nimi: "", toiminut: null, piilota: false, jarjestys: "nimi", suunta: "nouseva" });
        expect(parse("jarjestys=painoksia").suunta).toBe("laskeva");
        expect(parse("toiminut=1990-").toiminut).toEqual({ from: 1990, to: null });
    });
});

describe("withListState", () => {
    it("leaves the defaults out of the URL", () => {
        expect(withListState(new URLSearchParams("nimi=a"), { nimi: "", jarjestys: "nimi", suunta: "nouseva" }).toString()).toBe("");
        expect(withListState(new URLSearchParams(), { jarjestys: "painoksia", suunta: "laskeva" }).toString()).toBe("jarjestys=painoksia");
        expect(withListState(new URLSearchParams(), { jarjestys: "painoksia", suunta: "nouseva" }).toString()).toBe("jarjestys=painoksia&suunta=nouseva");
        expect(withListState(new URLSearchParams(), { toiminut: { from: null, to: 1950 }, piilota: true }).toString()).toBe("toiminut=-1950&piilota=tyhjat");
        expect(withListState(new URLSearchParams("nimi=a"), { nimi: "   " }).toString()).toBe("");
    });
});

describe("filterPublishers", () => {
    it("matches the name or the full name from any word, ignoring case", () => {
        expect(filterPublishers(all, parse("nimi=söderström")).map(p => p.id)).toEqual([387]);
        expect(filterPublishers(all, parse("nimi=AIKA")).map(p => p.id)).toEqual([6]);
    });

    it("keeps publishers active at any time in the span and drops those without editions", () => {
        expect(filterPublishers(all, parse("toiminut=1900-1930")).map(p => p.id)).toEqual([387, 5]);
        expect(filterPublishers(all, parse("toiminut=1950-")).map(p => p.id)).toEqual([387, 10]);
    });

    it("hides publishers without editions on request", () => {
        expect(filterPublishers(all, parse("piilota=tyhjat")).map(p => p.id)).toEqual([387, 10, 5]);
    });
});

describe("sortPublishers", () => {
    it("sorts by name in Finnish order by default", () => {
        const ä = row(1, "Äänekoski", 1, 2000, 2000), a = row(2, "Aamu", 1, 2000, 2000), z = row(3, "Zeta", 1, 2000, 2000);
        expect(sortPublishers([ä, z, a], parse("")).map(p => p.name)).toEqual(["Aamu", "Zeta", "Äänekoski"]);
    });

    it("sorts by editions, biggest first by default, and by years with empty years last in either direction", () => {
        expect(sortPublishers(all, parse("jarjestys=painoksia")).map(p => p.id)).toEqual([387, 10, 5, 6]);
        expect(sortPublishers(all, parse("jarjestys=vuodet")).map(p => p.id)).toEqual([387, 5, 10, 6]);
        expect(sortPublishers(all, parse("jarjestys=vuodet&suunta=laskeva")).map(p => p.id)).toEqual([10, 5, 387, 6]);
    });
});

describe("yearAxis", () => {
    it("spans the earliest and latest years of the data", () => {
        expect(yearAxis(all)).toEqual({ from: 1889, to: 2026 });
    });
});
