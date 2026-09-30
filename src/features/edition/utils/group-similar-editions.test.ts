import { describe, expect, it } from "vitest";
import type { Work } from "@features/work";
import { groupSimilarEditions } from "./group-similar-editions";
import { edition } from "../../../test/factories";

const ids = (groups: { id: number }[][]) => groups.map(g => g.map(e => e.id));

describe('groupSimilarEditions', () => {
    const w1 = { id: 1 } as Work;
    const w2 = { id: 2 } as Work;

    it('keeps every edition separate by default', () => {
        const groups = groupSimilarEditions([
            edition({ id: 2, editionnum: 2 }), edition({ id: 1, editionnum: 1 }),
        ], 'all');
        expect(ids(groups)).toEqual([[1], [2]]);
    });

    it('brief mode groups by work and version, treating missing version as 1', () => {
        const groups = groupSimilarEditions([
            edition({ id: 1, work: w1, version: 1, editionnum: 1 }),
            edition({ id: 2, work: w1, version: null as unknown as number, editionnum: 2 }),
            edition({ id: 3, work: w1, version: 2, editionnum: 1 }),
            edition({ id: 4, work: w2, version: 1, editionnum: 1 }),
        ], 'brief');
        expect(ids(groups)).toEqual(expect.arrayContaining([[1, 2], [3], [4]]));
        expect(groups).toHaveLength(3);
    });

    it('condensed mode groups same version with matching title and pages', () => {
        const groups = groupSimilarEditions([
            edition({ id: 1, pages: 300, editionnum: 1 }),
            edition({ id: 2, pages: 300, editionnum: 2 }),
            edition({ id: 3, pages: undefined, editionnum: 3 }),  // unknown pages match anything
            edition({ id: 4, pages: 150, editionnum: 4 }),
        ], 'condensed');
        expect(ids(groups)).toEqual([[1, 2, 3], [4]]);
    });

    it('sorts within a group by edition number, then groups by first edition', () => {
        const groups = groupSimilarEditions([
            edition({ id: 3, work: w1, editionnum: 3 }),
            edition({ id: 1, work: w1, editionnum: 1 }),
            edition({ id: 2, work: w1, editionnum: 2 }),
        ], 'brief');
        expect(ids(groups)).toEqual([[1, 2, 3]]);
    });
});
