import { Short } from '../types';


export const groupShorts = (shorts: Short[], grouping: string, person: string = "") => {
    let grouped: Record<string, Short[]> = shorts.reduce((acc: { [index: string]: any; }, currentValue) => {
        let groupKey = "";
        if (grouping == "person") {
            groupKey = currentValue.contributors
                //.filter(item => item.role.name == "Kirjoittaja")
                .map((author) => author.person.name).join(", ");
        } else if (grouping == "role") {
            groupKey = currentValue.contributors
                .filter(item => item.person.name == person)
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
