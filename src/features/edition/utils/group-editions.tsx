import { Edition } from "../types";


export const groupEditions = (editions: Edition[]) => {
    let grouped: Record<string, Edition[]> = editions.reduce((acc: { [index: string]: any; }, currentValue) => {
        const groupKey = currentValue.work[0]["author_str"];
        if (!acc[groupKey]) {
            acc[groupKey] = [];
        }
        acc[groupKey].push(currentValue);
        return acc;
    }, {});
    return grouped;
};
