import { describe, expect, it } from 'vitest';

import {
    ImportRow, PreviewGroup, importItems, isNewTag, previewRows, sectionTypeId,
} from './kirjasampo-import';

const AIHE = 1;
const PAIKKA = { id: 5, name: 'Paikka' };
const TYPES = [{ id: AIHE, name: 'Aihe' }, { id: 4, name: 'Toimija' }, PAIKKA, { id: 6, name: 'Aika' }];

const GROUPS: PreviewGroup[] = [
    {
        section: 'Aiheet ja teemat',
        items: [
            { name: 'avaruus', raw_name: 'avaruus (luokka)', mapping: null, on_work: true,
                match: { id: 6, name: 'avaruus', type: PAIKKA } },
            { name: 'uusi', raw_name: 'uusi', mapping: null, match: null, on_work: false },
            { name: 'ohitettu', raw_name: 'ohitettu', mapping: { action: 'omit' }, match: null, on_work: false },
            { name: 'kehitys', raw_name: 'kehitys', on_work: false,
                mapping: { action: 'replace', tag: { id: 42, name: 'kehitysromaanit', type: null } },
                match: { id: 7, name: 'kehitys', type: null } },
        ],
    },
    { section: 'Henkilöt, toimijat', items: [{ name: 'uusi', raw_name: 'uusi', mapping: null, match: null, on_work: false }] },
];

const rows = () => previewRows(GROUPS, TYPES);
const row = (list: ImportRow[], section: string, name: string) =>
    list.find(r => r.section === section && r.name === name)!;
const update = (list: ImportRow[], name: string, changes: Partial<ImportRow>) =>
    list.map(r => r.name === name ? { ...r, ...changes } : r);

describe('previewRows', () => {
    it('makes a row per item in page order, a name repeated in each section', () => {
        expect(rows().map(r => [r.section, r.name])).toEqual([
            ['Aiheet ja teemat', 'avaruus'], ['Aiheet ja teemat', 'uusi'], ['Aiheet ja teemat', 'ohitettu'],
            ['Aiheet ja teemat', 'kehitys'], ['Henkilöt, toimijat', 'uusi'],
        ]);
        expect(new Set(rows().map(r => r.key)).size).toBe(5);
    });

    it('prefills the replace target, else the match, else the name', () => {
        const list = rows();
        expect(row(list, 'Aiheet ja teemat', 'kehitys').localTag).toMatchObject({ id: 42 });
        expect(row(list, 'Aiheet ja teemat', 'avaruus').localTag).toMatchObject({ id: 6 });
        expect(row(list, 'Aiheet ja teemat', 'uusi').localTag).toBe('uusi');
        expect(isNewTag(row(list, 'Aiheet ja teemat', 'uusi'))).toBe(true);
        expect(isNewTag(row(list, 'Aiheet ja teemat', 'avaruus'))).toBe(false);
    });

    it('starts stored omits skipped', () => {
        const list = rows();
        expect(list.filter(r => r.skip).map(r => r.name)).toEqual(['ohitettu']);
        expect(row(list, 'Aiheet ja teemat', 'avaruus').onWork).toBe(true);
    });

    it('defaults the type of a new tag by section', () => {
        const item = (name: string) => ({ name, raw_name: name, mapping: null, match: null, on_work: false });
        const list = previewRows([
            { section: 'Henkilöt, toimijat', items: [item('parantajat')] },
            { section: 'Tapahtumapaikat', items: [item('luolat')] },
            { section: 'Konkreettiset tapahtumapaikat', items: [item('japani')] },
            { section: 'Tapahtuma-aika', items: [item('kivikausi')] },
            { section: 'Tarkka aika', items: [item('1920-luku')] },
            { section: 'Kirjallisuudenlaji', items: [item('paleofiktio')] },
        ], TYPES);
        expect(list.map(r => [r.name, r.typeId])).toEqual([
            ['parantajat', 4], ['luolat', 5], ['japani', 5], ['kivikausi', 6], ['1920-luku', 6], ['paleofiktio', AIHE],
        ]);
    });

    it('gives a name in several sections the type of the first', () => {
        // "uusi" is under Aiheet ja teemat first, then Henkilöt, toimijat.
        expect(rows().filter(r => r.name === 'uusi').map(r => r.typeId)).toEqual([AIHE, AIHE]);
    });

    it('falls back to Aihe when the section\'s type is missing', () => {
        expect(sectionTypeId('Tapahtuma-aika', [{ id: AIHE, name: 'Aihe' }])).toBe(AIHE);
    });
});

describe('importItems', () => {
    it('sends one item per name with the action the row implies', () => {
        expect(importItems(rows())).toEqual([
            { name: 'avaruus', id: null, action: 'add' },
            { name: 'uusi', id: null, action: 'add', type_id: AIHE },
            { name: 'ohitettu', id: null, action: 'omit' },
            { name: 'kehitys', id: 42, action: 'replace' },
        ]);
    });

    it('omits a name only when all its rows are skipped', () => {
        const list = rows();
        const oneSkipped = list.map(r => r.key === row(list, 'Henkilöt, toimijat', 'uusi').key ? { ...r, skip: true } : r);
        expect(importItems(oneSkipped).find(i => i.name === 'uusi')?.action).toBe('add');
        expect(importItems(update(list, 'uusi', { skip: true })).find(i => i.name === 'uusi'))
            .toEqual({ name: 'uusi', id: null, action: 'omit' });
    });

    it('uses the first kept row of a name', () => {
        const list = rows();
        const firstKey = row(list, 'Aiheet ja teemat', 'uusi').key;
        const changed = list.map(r => r.key === firstKey ? { ...r, skip: true } : r.name === 'uusi' ? { ...r, typeId: 5 } : r);
        expect(importItems(changed).find(i => i.name === 'uusi')?.type_id).toBe(5);
    });

    it('adds a typed name as a new tag of the chosen type', () => {
        const list = update(rows(), 'uusi', { localTag: '  toinen nimi ', typeId: 5 });
        expect(importItems(list).find(i => i.name === 'toinen nimi'))
            .toEqual({ name: 'toinen nimi', id: null, action: 'add', type_id: 5 });
    });

    it('falls back to the Kirjasampo name when the field is emptied', () => {
        const list = update(rows(), 'uusi', { localTag: '  ' });
        expect(importItems(list)[1]).toEqual({ name: 'uusi', id: null, action: 'add', type_id: AIHE });
    });

    it('replaces with a picked tag of another name, adds a picked tag of the same name', () => {
        let list = update(rows(), 'avaruus', { localTag: { id: 9, name: 'Ulkoavaruus', type: null } });
        expect(importItems(list)[0]).toEqual({ name: 'avaruus', id: 9, action: 'replace' });
        list = update(rows(), 'kehitys', { localTag: { id: 7, name: 'Kehitys', type: null } });
        expect(importItems(list)[3]).toEqual({ name: 'kehitys', id: null, action: 'add' });
    });

    it('sends nothing for an empty table', () => {
        expect(importItems([])).toEqual([]);
    });
});
