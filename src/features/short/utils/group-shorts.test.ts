import { describe, expect, it } from "vitest";

import { contribution, short } from "../../../test/factories";
import type { PersonBrief } from "@features/person";
import { groupShorts } from "./group-shorts";

const mäkelä = { id: 191, name: "Mäkelä, J. Pekka", alt_name: "J. Pekka Mäkelä", fullname: "" } as PersonBrief;

describe("groupShorts by role", () => {
    // "Hylyntyhjentäjien laulu" credits J. Pekka Mäkelä as Esiintyy first and
    // Kirjoittaja second; it is his own article, so it belongs under Kirjoittaja.
    it("puts a story the person wrote and appears in under Kirjoittaja", () => {
        const both = short({ id: 1, contributors: [contribution(191, 6, "Mäkelä", "Esiintyy"), contribution(191, 1, "Mäkelä", "Kirjoittaja")] });
        expect(Object.keys(groupShorts([both], "role", mäkelä))).toEqual(["Kirjoittaja"]);
    });

    it("prefers translating over appearing", () => {
        const both = short({ id: 2, contributors: [contribution(191, 6, "Mäkelä", "Esiintyy"), contribution(191, 2, "Mäkelä", "Kääntäjä")] });
        expect(Object.keys(groupShorts([both], "role", mäkelä))).toEqual(["Kääntäjä"]);
    });

    it("keeps a story the person only appears in under Esiintyy", () => {
        const about = short({ id: 3, contributors: [contribution(5, 1, "Leinonen", "Kirjoittaja"), contribution(191, 6, "Mäkelä", "Esiintyy")] });
        expect(Object.keys(groupShorts([about], "role", mäkelä))).toEqual(["Esiintyy"]);
    });
});
