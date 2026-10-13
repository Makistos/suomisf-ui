import { describe, expect, it } from 'vitest';
import { bucketLabel, bucketOf, bucketYears, bucketsIn, yearBounds } from './years';
import { GENRE_GROUPS, LANGUAGE_SLOTS, MAX_SERIES, SERIES_DARK, SERIES_LIGHT } from './palette';

describe('year buckets', () => {
    it('includes empty years so the time axis is even', () => {
        expect(bucketsIn({ start: 1998, end: 2001, decades: false })).toEqual([1998, 1999, 2000, 2001]);
    });

    it('covers a partial first decade', () => {
        expect(bucketsIn({ start: 1995, end: 2012, decades: true })).toEqual([1990, 2000, 2010]);
        expect(bucketOf(1995, true)).toBe(1990);
        expect(bucketLabel(1990, true)).toBe('1990-luku');
    });

    it('limits a decade drill-down to the selected range', () => {
        const range = { start: 1995, end: 2012, decades: true };
        expect(bucketYears(1990, range)).toEqual({ min: 1995, max: 1999 });
        expect(bucketYears(2000, range)).toEqual({ min: 2000, max: 2009 });
        expect(bucketYears(2010, range)).toEqual({ min: 2010, max: 2012 });
        expect(bucketYears(2005, { ...range, decades: false })).toEqual({ min: 2005, max: 2005 });
    });

    it('ignores the unknown year 0 when finding bounds', () => {
        expect(yearBounds([{ year: 0 }, { year: 1958 }], [{ year: 2025 }])).toEqual({ min: 1958, max: 2025 });
    });
});

describe('palette', () => {
    it('gives each coloured language its own slot within the series limit', () => {
        const slots = Object.values(LANGUAGE_SLOTS);
        expect(new Set(slots).size).toBe(slots.length);
        expect(Math.max(...slots)).toBeLessThan(MAX_SERIES);
    });

    it('gives genre groups distinct existing slots', () => {
        const slots = GENRE_GROUPS.map(g => g.slot);
        expect(new Set(slots).size).toBe(slots.length);
        slots.forEach(s => expect(s).toBeLessThan(SERIES_LIGHT.length));
        expect(SERIES_DARK).toHaveLength(SERIES_LIGHT.length);
    });
});
