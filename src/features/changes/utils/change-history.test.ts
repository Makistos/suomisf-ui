import { describe, expect, it } from 'vitest';
import { LogItem } from '../types';
import {
    emptyFilters, filterRows, groupSaves, isUnchanged, listDiff, plainText, splitList, tagEvent, wordDiff,
} from './change-history';

let nextId = 1;
const row = (over: Partial<LogItem>): LogItem => ({
    id: nextId++, table_name: 'Teos', field_name: 'Nimeke', table_id: 1, object_name: 'x',
    action: 'Päivitys', user_id: 1, old_value: 'a', date: '2026-11-10T20:00:00+02:00',
    user: { id: 1, name: 'mep' } as LogItem['user'], field: 'Nimeke', new_value: 'b',
    new_value_source: 'current', target: 'Teos', ...over,
});

describe('splitList', () => {
    it('uses the field separator', () => {
        expect(splitList('Asiasanat', 'a,b , c')).toEqual(['a', 'b', 'c']);
        expect(splitList('Tekijät', 'A [Kääntäjä]\nB [Kansikuva]')).toEqual(['A [Kääntäjä]', 'B [Kansikuva]']);
        expect(splitList('Linkit', 'https://a (A), https://b')).toEqual(['https://a (A)', 'https://b']);
        expect(splitList('Asiasanat', null)).toEqual([]);
    });
});

describe('listDiff', () => {
    it('finds added, removed and kept items', () => {
        expect(listDiff(['a', 'b'], ['b', 'c'])).toEqual({ added: ['c'], removed: ['a'], kept: ['b'] });
    });
});

describe('isUnchanged', () => {
    it('compares values', () => {
        expect(isUnchanged(row({ old_value: 'englanti', new_value: 'englanti' }))).toBe(true);
        expect(isUnchanged(row({ old_value: 'a', new_value: 'b' }))).toBe(false);
    });
    it('compares lists as sets', () => {
        expect(isUnchanged(row({ field: 'Asiasanat', old_value: 'b,a', new_value: 'a,b' }))).toBe(true);
    });
    it('compares texts without HTML', () => {
        expect(isUnchanged(row({ field: 'Kuvaus', old_value: '<p>Teksti</p>', new_value: 'Teksti' }))).toBe(true);
    });
    it('is false when the new value is unknown or not an update', () => {
        expect(isUnchanged(row({ old_value: 'a', new_value: null, new_value_source: null }))).toBe(false);
        expect(isUnchanged(row({ action: 'Uusi', old_value: null, new_value: null }))).toBe(false);
    });
});

describe('tagEvent', () => {
    it('reads single tag additions and removals', () => {
        expect(tagEvent(row({ field: 'Asiasanat', old_value: 'Lisätty: avaruus' }))).toEqual({ added: true, name: 'avaruus' });
        expect(tagEvent(row({ field: 'Asiasanat', old_value: 'Poistettu: x' }))).toEqual({ added: false, name: 'x' });
        expect(tagEvent(row({ field: 'Asiasanat', old_value: 'a,b' }))).toBeNull();
    });
});

describe('plainText', () => {
    it('strips tags and collapses spaces', () => {
        expect(plainText('<p>Yksi&nbsp;<em>kaksi</em></p>')).toBe('Yksi kaksi');
    });
});

describe('wordDiff', () => {
    it('marks removed and added words', () => {
        expect(wordDiff('vanha kissa nukkuu', 'uusi kissa nukkuu')).toEqual([
            { text: 'vanha', type: 'removed' }, { text: 'uusi', type: 'added' },
            { text: ' kissa nukkuu', type: 'same' },
        ]);
    });
    it('handles empty texts', () => {
        expect(wordDiff('', 'uusi')).toEqual([{ text: 'uusi', type: 'added' }]);
    });
});

describe('groupSaves', () => {
    it('groups rows of one save and splits by editor, target and time', () => {
        const rows = [
            row({ date: '2026-11-10T20:00:00+02:00', field: 'Nimeke' }),
            row({ date: '2026-11-10T20:00:02+02:00', field: 'Kieli' }),
            row({ date: '2026-11-10T20:00:01+02:00', target: '1. painos (1997)' }),
            row({ date: '2026-11-10T21:00:00+02:00' }),
            row({ date: '2026-11-10T21:00:00+02:00', user: { id: 2, name: 'Jussi' } as LogItem['user'] }),
        ];
        const groups = groupSaves(rows);
        expect(groups.map(g => [g.user, g.target, g.rows.length])).toEqual([
            ['Jussi', 'Teos', 1], ['mep', 'Teos', 1], ['mep', 'Teos', 1],
            ['mep', '1. painos (1997)', 1], ['mep', 'Teos', 1],
        ]);
    });
    it('splits quick saves when a field repeats', () => {
        const rows = [
            row({ date: '2026-11-10T20:00:01+02:00', field: 'Kuvaus' }),
            row({ date: '2026-11-10T20:00:00.5+02:00', field: 'Kuvaus' }),
        ];
        expect(groupSaves(rows)).toHaveLength(2);
    });
    it('keeps a save together', () => {
        const rows = [
            row({ date: '2026-11-10T20:00:00+02:00' }),
            row({ date: '2026-11-10T20:00:00.5+02:00', field: 'Kieli' }),
        ];
        expect(groupSaves(rows)).toHaveLength(1);
    });
});

describe('filterRows', () => {
    const rows = [
        row({ field: 'Nimeke', old_value: 'Dyyni', new_value: 'Dune' }),
        row({ field: 'Kieli', old_value: 'englanti', new_value: 'englanti' }),
        row({ field: 'ISBN', target: '1. painos (1997)', user: { id: 2, name: 'Jussi' } as LogItem['user'] }),
    ];
    it('hides unchanged rows by default', () => {
        expect(filterRows(rows, emptyFilters).map(r => r.field)).toEqual(['Nimeke', 'ISBN']);
        expect(filterRows(rows, { ...emptyFilters, hideUnchanged: false })).toHaveLength(3);
    });
    it('filters by field, editor, target and text', () => {
        expect(filterRows(rows, { ...emptyFilters, fields: ['ISBN'] })).toHaveLength(1);
        expect(filterRows(rows, { ...emptyFilters, users: ['Jussi'] })[0].field).toBe('ISBN');
        expect(filterRows(rows, { ...emptyFilters, targets: ['Teos'] })).toHaveLength(1);
        expect(filterRows(rows, { ...emptyFilters, text: 'dune' })[0].field).toBe('Nimeke');
    });
    it('filters by date, including the whole end day', () => {
        const day = new Date(2026, 10, 10);
        expect(filterRows(rows, { ...emptyFilters, from: day, to: day })).toHaveLength(2);
        expect(filterRows(rows, { ...emptyFilters, to: new Date(2026, 10, 9) })).toHaveLength(0);
    });
});
