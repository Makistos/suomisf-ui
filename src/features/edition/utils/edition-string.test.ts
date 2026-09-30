import { describe, expect, it } from "vitest";
import { EditionString } from "./edition-string";
import { edition } from "../../../test/factories";

describe('EditionString', () => {
    it('shows only the edition number for the first version', () => {
        expect(EditionString(edition({ version: 1, editionnum: 3 }))).toBe('3.painos');
        expect(EditionString(edition({ version: null as unknown as number, editionnum: 1 }))).toBe('1.painos');
    });

    it('shows the version and hides edition number 1 for later versions', () => {
        expect(EditionString(edition({ version: 2, editionnum: 1 }))).toBe('2.laitos ');
    });

    it('shows both version and edition number when the number is above 1', () => {
        expect(EditionString(edition({ version: 2, editionnum: 4 }))).toBe('2.laitos 4.painos');
    });
});
