import { Person } from '@features/person';
import { Short } from '../types';
import { Contribution } from '../../../types/contribution';

export const groupShorts = (shorts: Short[], grouping: string, person: Person | null = null) => {
    const personInvolved = (contributor: Contribution) => {
        if (!person) return true;
        if (contributor.person.id == person.id) return true;
        if (person.aliases.some(alias => alias.id == contributor.person.id)) return true;
        return false;
    }
    let grouped: Record<string, Short[]> = shorts.reduce((acc: { [index: string]: any; }, currentValue) => {
        let groupKey = "";
        if (grouping == "person") {
            groupKey = currentValue.contributors
                .map((author) => author.person.name).join(", ");
        } else if (grouping == "role") {
            groupKey = currentValue.contributors
                .filter(personInvolved)
                .map((role) => role.role.name)[0];
        }
        if (!acc[groupKey]) {
            acc[groupKey] = [];
        }
        acc[groupKey].push(currentValue);
        return acc;
    }, {});
    return grouped;
};
