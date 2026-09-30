import { describe, expect, it } from "vitest";
import type { User } from "@features/user";
import { combineEditions } from "./combine-editions";
import { edition } from "../../../test/factories";
import type { Edition } from "../types";

const user = { id: 7, name: 'tester' } as User;

describe('combineEditions', () => {
    it('returns undefined for an empty list', () => {
        expect(combineEditions([], null)).toBeUndefined();
    });

    it('marks a single edition as not combined and keeps its values', () => {
        const result = combineEditions([edition({ id: 5, pubyear: 1999, editionnum: 2, pages: 300 })], null)!;
        expect(result.combined).toBe(false);
        expect(result.id).toBe(5);
        expect(result.pubyear).toBe(1999);
        expect(result.editionnum).toBe(2);
        expect(result.pages).toBe(300);
    });

    it('turns differing pubyears and edition numbers into ranges', () => {
        const result = combineEditions([
            edition({ id: 1, pubyear: 2005, editionnum: 3 }),
            edition({ id: 2, pubyear: 1990, editionnum: 1 }),
            edition({ id: 3, pubyear: 1998, editionnum: 2 }),
        ], null)!;
        expect(result.combined).toBe(true);
        expect(result.pubyear).toBe('1990 - 2005');
        expect(result.editionnum).toBe('1 - 3');
    });

    it('uses ? for unknown ends of an edition number range', () => {
        const result = combineEditions([
            edition({ editionnum: 2 }),
            edition({ editionnum: null as unknown as number }),
        ], null)!;
        // null sorts as 0, so it becomes the start of the range
        expect(result.editionnum).toBe('? - 2');
    });

    it('keeps shared values only when every edition agrees', () => {
        const result = combineEditions([
            edition({ pages: 200, misc: 'same', size: 18 }),
            edition({ pages: 250, misc: 'same', size: 18 }),
        ], null)!;
        expect(result.pages).toBeUndefined();
        expect(result.misc).toBe('same');
        expect(result.size).toBe(18);
    });

    it('deduplicates ISBNs by isbn and binding', () => {
        const hard = { id: 2, name: 'Kovakantinen' };
        const soft = { id: 3, name: 'Nidottu' };
        const result = combineEditions([
            edition({ isbn: '123', binding: hard }),
            edition({ isbn: '123', binding: hard }),
            edition({ isbn: '123', binding: soft }),
            edition({ isbn: [{ isbn: '456', binding: hard }], binding: hard }),
        ], null)!;
        expect(result.isbn).toEqual([
            { isbn: '123', binding: hard },
            { isbn: '123', binding: soft },
            { isbn: '456', binding: hard },
        ]);
    });

    it('deduplicates images by source', () => {
        const result = combineEditions([
            edition({ images: [{ id: 1, image_src: 'a.jpg' }] as Edition['images'] }),
            edition({ images: [{ id: 2, image_src: 'a.jpg' }, { id: 3, image_src: 'b.jpg' }] as Edition['images'] }),
        ], null)!;
        expect(result.images.map(i => i.image_src)).toEqual(['a.jpg', 'b.jpg']);
    });

    it('keeps owners and wishlist only when the user is among them', () => {
        const other = { id: 99 } as User;
        const eds = [
            edition({ owners: [other], wishlisted: [other] }),
            edition({ owners: [user], wishlisted: [] }),
        ];
        const forUser = combineEditions(eds, user)!;
        expect(forUser.owners).toEqual([other, user]);
        expect(forUser.wishlisted).toEqual([]);

        const anonymous = combineEditions(eds, null)!;
        expect(anonymous.owners).toEqual([]);
    });
});
