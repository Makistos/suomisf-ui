import { Edition } from "../types";


export const groupEditions = (editions: Edition[]) => {
    const uniquePeople = (value: string, index: number, array: string[]) => {
        return array.indexOf(value) === index;
    }
    const authorStr = (edition: Edition) => {
        return edition.work[0].contributions.map(
            contrib => contrib.person.name).filter(uniquePeople).join(' & ');
    }

    let grouped: Record<string, Edition[]> = editions.reduce((acc: { [index: string]: any; }, currentValue) => {
        const groupKey = authorStr(currentValue); //.work[0]["author_str"];
        if (!acc[groupKey]) {
            acc[groupKey] = [];
        }
        acc[groupKey].push(currentValue);
        return acc;
    }, {});
    return grouped;
};
