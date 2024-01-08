// remove-duplicate-contributions.test.ts

import { removeDuplicateContributions } from './remove-duplicate-contributions';
import { Contribution } from '../types/contribution';

describe('removeDuplicateContributions', () => {
  it('should remove duplicate contributions', () => {
    const contributions: Contribution[] = [
      { person: { id: 1, name: 'John', alt_name: '', fullname: '' }, role: { id: 1, name: 'Author' }, description: '' },
      { person: { id: 2, name: 'Jane', alt_name: '', fullname: '' }, role: { id: 2, name: 'Editor' }, description: '' },
      { person: { id: 1, name: 'John', alt_name: '', fullname: '' }, role: { id: 1, name: 'Author' }, description: '' },
      { person: { id: 3, name: 'Bob', alt_name: '', fullname: '' }, role: { id: 3, name: 'Translator' }, description: '' },
    ];

    const expectedContributions: Contribution[] = [
      { person: { id: 1, name: 'John', alt_name: '', fullname: '' }, role: { id: 1, name: 'Author' }, description: '' },
      { person: { id: 2, name: 'Jane', alt_name: '', fullname: '' }, role: { id: 2, name: 'Editor' }, description: '' },
      { person: { id: 3, name: 'Bob', alt_name: '', fullname: '' }, role: { id: 3, name: 'Translator' }, description: '' },
    ];

    expect(removeDuplicateContributions(contributions)).toEqual(expectedContributions);
  });

  it('should return an empty array if no contributions are provided', () => {
    expect(removeDuplicateContributions([])).toEqual([]);
  });

  // Add more test cases if needed
});