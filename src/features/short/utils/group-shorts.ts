import { Short } from '../types';


export const groupShorts = (shorts: Short[]) => {
    let grouped: Record<string, Short[]> = shorts.reduce((acc: { [index: string]: any; }, currentValue) => {
        const groupKey = currentValue.contributors.filter(item => item.role.name == "Kirjoittaja").map((author) => author.person.name).join(", ");
        if (!acc[groupKey]) {
            acc[groupKey] = [];
        }
        acc[groupKey].push(currentValue);
        return acc;
    }, {});
    return grouped;
};
