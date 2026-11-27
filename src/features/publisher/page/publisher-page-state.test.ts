import { describe, expect, it } from "vitest";

import { apiQuery, parsePageState, sortSeries, withPageState } from "./publisher-page-state";

const parse = (q: string) => parsePageState(new URLSearchParams(q));

describe("parsePageState", () => {
    it("reads every key with readable values", () => {
        expect(parse("valilehti=sarjat&haku=le+guin&vuodet=1970-1979&jarjestys=uusin&sivu=3&riveja=200&nakyma=kannet&sarjat=painoksia&suunta=nouseva"))
            .toEqual({
                valilehti: "sarjat", haku: "le guin", vuodet: { from: 1970, to: 1979 }, jarjestys: "uusin", sivu: 3, riveja: 200,
                kannet: true, sarjat: "painoksia", suunta: "nouseva", ensipainokset: false,
            });
    });

    it("falls back to the defaults: printings, oldest first, 100 a page, list, series by name", () => {
        expect(parse("valilehti=x&jarjestys=y&sivu=0&riveja=7&vuodet=abc&sarjat=z")).toEqual({
            valilehti: "painokset", haku: "", vuodet: null, jarjestys: "vanhin", sivu: 1, riveja: 100, kannet: false, sarjat: "nimi", suunta: "nouseva",
            ensipainokset: false,
        });
        expect(parse("sarjat=painoksia").suunta).toBe("laskeva");
    });
});

describe("withPageState", () => {
    it("leaves the defaults out and goes back to page 1 when a filter or the order changes", () => {
        const p = new URLSearchParams("sivu=4&haku=asimov");
        expect(withPageState(p, { haku: "" }).toString()).toBe("");
        expect(withPageState(p, { jarjestys: "uusin" }).toString()).toBe("haku=asimov&jarjestys=uusin");
        expect(withPageState(p, { kannet: true }).toString()).toBe("sivu=4&haku=asimov&nakyma=kannet");
        expect(withPageState(p, { sivu: 5 }).get("sivu")).toBe("5");
        expect(withPageState(p, { riveja: 50 }).toString()).toBe("haku=asimov&riveja=50");
        expect(withPageState(new URLSearchParams(), { vuodet: { from: 1970, to: null } }).toString()).toBe("vuodet=1970-");
        expect(withPageState(new URLSearchParams(), { valilehti: "lehdet" }).toString()).toBe("valilehti=lehdet");
    });
});

describe("first editions only (#89)", () => {
    it("is ensipainokset=1 in the URL, goes back to page 1, and asks the API for first=1", () => {
        expect(parse("ensipainokset=1").ensipainokset).toBe(true);
        expect(parse("ensipainokset=x").ensipainokset).toBe(false);
        expect(withPageState(new URLSearchParams("sivu=3"), { ensipainokset: true }).toString()).toBe("ensipainokset=1");
        expect(withPageState(new URLSearchParams("ensipainokset=1"), { ensipainokset: false }).toString()).toBe("");
        expect(apiQuery(parse("ensipainokset=1"))).toBe("first=1&sort=oldest&page=1&rows=100");
    });
});

describe("apiQuery", () => {
    it("maps the state to GET /api/publishers/:id/editions", () => {
        expect(apiQuery(parse("haku=le+guin&vuodet=1970-1979&jarjestys=tekija&sivu=2&riveja=50")))
            .toBe("q=le+guin&year_min=1970&year_max=1979&sort=author&page=2&rows=50");
        expect(apiQuery(parse(""))).toBe("sort=oldest&page=1&rows=100");
    });
});

describe("sortSeries", () => {
    const s = (id: number, name: string, editions: number, first: number | null) => ({ id, name, editions, first_year: first, last_year: first });
    const list = [s(1, "Taskukirjasto", 300, 1960), s(2, "Aaro", 0, null), s(3, "Sci-fi -sarja", 12, 1976), s(4, "Ääni", 5, 1990)];
    it("by name in Finnish order, by printings biggest first, by years oldest first; empty ones last", () => {
        expect(sortSeries(list, parse("valilehti=sarjat")).map(x => x.id)).toEqual([2, 3, 1, 4]);
        expect(sortSeries(list, parse("sarjat=painoksia")).map(x => x.id)).toEqual([1, 3, 4, 2]);
        expect(sortSeries(list, parse("sarjat=vuodet")).map(x => x.id)).toEqual([1, 3, 4, 2]);
        expect(sortSeries(list, parse("sarjat=vuodet&suunta=laskeva")).map(x => x.id)).toEqual([4, 3, 1, 2]);
    });
});
