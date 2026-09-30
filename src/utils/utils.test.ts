import { describe, expect, it } from "vitest";
import { appearsIn } from "./appears-in";
import { getCountryCode } from "./country-utils";
import { removeDuplicateContributions } from "./remove-duplicate-contributions";
import { selectId } from "./select-id";
import { contribution } from "../test/factories";

describe('removeDuplicateContributions', () => {
    it('keeps one contribution per person, preferring the lowest role id', () => {
        const result = removeDuplicateContributions([
            contribution(1, 3), contribution(2, 2), contribution(1, 1),
        ]);
        expect(result.map(c => [c.person.id, c.role.id])).toEqual([[1, 1], [2, 2]]);
    });

    it('does not mutate its input', () => {
        const input = [contribution(1, 3), contribution(1, 1)];
        removeDuplicateContributions(input);
        expect(input.map(c => c.role.id)).toEqual([3, 1]);
    });
});

describe('appearsIn', () => {
    it('returns role-6 contributors sorted by name', () => {
        const result = appearsIn([
            contribution(1, 6, 'Öberg'), contribution(2, 1, 'Author'), contribution(3, 6, 'Aalto'),
        ]);
        expect(result?.map(c => c.person.name)).toEqual(['Aalto', 'Öberg']);
    });

    it('returns undefined when nobody appears in the work', () => {
        expect(appearsIn([contribution(1, 1)])).toBeUndefined();
    });
});

describe('getCountryCode', () => {
    it('maps Finnish country names to ISO codes', () => {
        expect(getCountryCode('Yhdysvallat')).toBe('US');
        expect(getCountryCode('Hollanti')).toBe(getCountryCode('Alankomaat'));
        expect(getCountryCode('Atlantis')).toBe('UNKNOWN');
    });
});

describe('selectId', () => {
    it('prefers the route param over the prop', () => {
        expect(selectId({ itemId: '5' }, '9')).toBe('5');
        expect(selectId({}, '9')).toBe('9');
        expect(selectId(undefined, '9')).toBe('9');
    });

    it('throws when no id is available', () => {
        expect(() => selectId({}, null)).toThrow('No id given');
    });
});
