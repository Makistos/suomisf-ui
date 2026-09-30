import { describe, expect, it } from "vitest";
import type { Edition } from "@features/edition";
import { compareWorksByField, groupKeyDisplayName, groupWorks } from "./group-works";
import { contribution, work } from "../../../test/factories";

describe('groupWorks', () => {
    it('groups by author person ids and author string', () => {
        const a = work({ id: 1, author_str: 'Smith, John', contributions: [contribution(5, 1)] });
        const b = work({ id: 2, author_str: 'Smith, John', contributions: [contribution(5, 1)] });
        // Same name, different person: must not be merged
        const c = work({ id: 3, author_str: 'Smith, John', contributions: [contribution(6, 1)] });
        const groups = groupWorks([a, b, c]);
        expect(Object.keys(groups).sort()).toEqual(['5|Smith, John', '6|Smith, John']);
        expect(groups['5|Smith, John'].map(w => w.id)).toEqual([1, 2]);
    });

    it('falls back to editors, then to the author string alone', () => {
        const edited = work({ author_str: 'Ed (toim.)', contributions: [contribution(8, 3)] });
        const unknown = work({ author_str: 'Anonymous', contributions: [] });
        expect(Object.keys(groupWorks([edited, unknown])).sort()).toEqual(['8|Ed (toim.)', 'Anonymous']);
    });

    it('orders multiple authors by id in the key', () => {
        const w = work({ author_str: 'A & B', contributions: [contribution(9, 1), contribution(3, 1)] });
        expect(Object.keys(groupWorks([w]))).toEqual(['3,9|A & B']);
    });
});

describe('groupKeyDisplayName', () => {
    it('strips the person-id prefix', () => {
        expect(groupKeyDisplayName('3,9|A & B')).toBe('A & B');
        expect(groupKeyDisplayName('Anonymous')).toBe('Anonymous');
    });
});

describe('compareWorksByField', () => {
    const sortBy = (works: ReturnType<typeof work>[], field: Parameters<typeof compareWorksByField>[2]) =>
        [...works].sort((a, b) => compareWorksByField(a, b, field)).map(w => w.id);

    it('sorts by title case-insensitively', () => {
        expect(sortBy([work({ id: 1, title: 'beta' }), work({ id: 2, title: 'Alpha' })], 'Title')).toEqual([2, 1]);
    });

    it('sorts by original title, falling back to title', () => {
        const works = [
            work({ id: 1, title: 'Aamu', orig_title: 'Zebra' }),
            work({ id: 2, title: 'Mökki', orig_title: '' }),
        ];
        expect(sortBy(works, 'OrigTitle')).toEqual([2, 1]);
    });

    it('sorts by oldest edition year without reordering editions', () => {
        const editions = [{ pubyear: 2010 }, { pubyear: 1995 }] as Edition[];
        const works = [
            work({ id: 1, editions: [{ pubyear: 2000 }] as Edition[] }),
            work({ id: 2, editions }),
            work({ id: 3, editions: [] }),  // no editions sort last
        ];
        expect(sortBy(works, 'Pubyear')).toEqual([2, 1, 3]);
        expect(editions.map(e => e.pubyear)).toEqual([2010, 1995]);
    });
});
