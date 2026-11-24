import { Person, PersonBrief } from '@features/person';
import { Short } from '../types';
import { Contribution } from '../../../types/contribution';

// Kirjoittaja, Toimittaja, Kääntäjä, Kansikuva, Kuvittaja, then Esiintyy.
const ROLE_PRIORITY = [1, 3, 2, 4, 5, 6];
const rolePriority = (roleId: number) => {
    const i = ROLE_PRIORITY.indexOf(roleId);
    return i < 0 ? ROLE_PRIORITY.length : i;
};

export const groupShorts = (shorts: Short[], grouping: string, person: Person | PersonBrief | null = null) => {
    const personInvolved = (contributor: Contribution) => {
        if (!person) return true;
        if (contributor.person.id == person.id) return true;
        if (person.aliases?.some(alias => alias.id == contributor.person.id)) return true;
        return false;
    }
    let grouped: Record<string, Short[]> = shorts.reduce((acc: { [index: string]: any; }, currentValue) => {
        let groupKey = "";
        if (grouping == "person") {
            groupKey = currentValue.contributors
                .map((author) => author.person.name).join(", ");
        } else if (grouping == "role") {
            // The person's most significant role, not whichever is listed
            // first: a story they wrote and also appear in is their own.
            groupKey = currentValue.contributors
                .filter(personInvolved)
                .sort((a, b) => rolePriority(a.role.id) - rolePriority(b.role.id))
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
