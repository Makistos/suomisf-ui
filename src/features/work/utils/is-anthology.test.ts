import { describe, expect, it } from "vitest";
import { isAnthology } from "./is-anthology";
import { contribution, short, work } from "../../../test/factories";

describe('isAnthology', () => {
    it('is false for a work without stories', () => {
        expect(isAnthology(work({ stories: [] }))).toBe(false);
        expect(isAnthology(work({ stories: undefined }))).toBe(false);
    });

    it('is false for a single-author collection', () => {
        const stories = [1, 2, 3].map(id => short({ id, contributors: [contribution(10, 1)] }));
        expect(isAnthology(work({ stories }))).toBe(false);
    });

    it('is true when stories have different authors', () => {
        const stories = [
            short({ id: 1, contributors: [contribution(10, 1)] }),
            short({ id: 2, contributors: [contribution(11, 1)] }),
        ];
        expect(isAnthology(work({ stories }))).toBe(true);
    });

    it('ignores non-author contributors such as translators', () => {
        const stories = [
            short({ id: 1, contributors: [contribution(10, 1), contribution(20, 2)] }),
            short({ id: 2, contributors: [contribution(10, 1), contribution(21, 2)] }),
        ];
        expect(isAnthology(work({ stories }))).toBe(false);
    });
});
