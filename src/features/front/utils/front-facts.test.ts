import { describe, expect, it } from "vitest";

import { edition } from "../../../test/factories";
import { coverLine, holdings, naturalAuthors, shelfAuthors } from "./front-facts";

describe("naturalAuthors / shelfAuthors", () => {
    it("writes names in natural order, keeping the editor mark", () => {
        expect(naturalAuthors("Bradbury, Ray")).toBe("Ray Bradbury");
        expect(naturalAuthors("Sisättö, Vesa & Halme, Jukka (toim.)")).toBe("Vesa Sisättö & Jukka Halme (toim.)");
        expect(naturalAuthors(null)).toBe("");
    });
    it("has room for two names under a cover; three or more become 'ym.'", () => {
        expect(shelfAuthors("Sopanen, Matleena & Aho, Ari & Koski, Eeva (toim.)")).toBe("Matleena Sopanen ym. (toim.)");
        expect(shelfAuthors("Leinonen, Anne & Lappalainen, Eija")).toBe("Anne Leinonen & Eija Lappalainen");
    });
});

describe("coverLine", () => {
    it("says which printing the cover is from", () => {
        const e = edition({ pubyear: 1975, editionnum: 2, publisher: { id: 1, name: "Kirjayhtymä" } } as never);
        expect(coverLine(e)).toBe("Kirjayhtymä 1975, 2. painos");
        expect(coverLine(edition({ pubyear: 1999, editionnum: 1, publisher: { id: 2, name: "Tammi" } } as never))).toBe("Tammi 1999");
    });
});

describe("holdings", () => {
    it("is one sentence of four linked counts, formatted in Finnish", () => {
        const parts = holdings({ works: 7304, editions: 10523, shorts: 9513, magazines: 58 });
        expect(parts.map(p => p.text)).toEqual(["7 304 teosta", "10 523 painosta", "9 513 novellia", "58 lehteä"]);
        expect(parts.map(p => p.to)).toEqual(["/bookindex", "/stats?tab=julkaisut", "/shortstoryindex", "/magazines"]);
    });
});
