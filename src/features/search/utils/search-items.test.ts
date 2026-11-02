// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { groupSearchItems, searchItemIcon, searchItemPath, searchItemText, searchResultsPath } from './search-items';

const item = (type: string, id = 1) => ({ id, type, header: `${type} ${id}` });

describe('search item helpers', () => {
    it('gives each type its page', () => {
        expect(searchItemPath(item('work', 12))).toBe('/works/12');
        expect(searchItemPath(item('shortstory', 3))).toBe('/shorts/3');
        expect(searchItemPath(item('pubseries', 4))).toBe('/pubseries/4');
        expect(searchItemPath(item('unknown'))).toBeNull();
        expect(searchItemIcon('person')).toBe('fa-user');
        expect(searchItemIcon('unknown')).toBe('fa-question');
    });

    it('strips HTML from descriptions and shortens them', () => {
        expect(searchItemText('<p>Lyhyt <b>kuvaus</b></p>')).toBe('Lyhyt kuvaus');
        expect(searchItemText('<p>' + 'a'.repeat(250) + '</p>')).toBe('a'.repeat(200) + '...');
    });

    it('builds the results page path with the term encoded', () => {
        expect(searchResultsPath(' Vihreä matka ', true)).toBe('/search?q=Vihre%C3%A4%20matka&titles=1');
        expect(searchResultsPath('a&b?', false)).toBe('/search?q=a%26b%3F');
    });

    it('groups hits by type in a fixed order, keeping their order within a group', () => {
        const groups = groupSearchItems([
            item('tag', 1), item('work', 2), item('mystery', 9), item('person', 3), item('work', 4),
        ]);
        expect(groups.map(g => g.type)).toEqual(['work', 'person', 'tag', 'mystery']);
        expect(groups[0].items.map(i => i.id)).toEqual([2, 4]);
    });
});
