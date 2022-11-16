import { Work } from "../types";


export const groupWorks = (works: Work[]) => {
    const grouped: Record<string, Work[]> = works.reduce((acc: { [index: string]: any; }, currentValue) => {
        const groupKey = currentValue["author_str"];
        if (!acc[groupKey]) {
            acc[groupKey] = [];
        }
        acc[groupKey].push(currentValue);
        return acc;
    }, {});

    return grouped;
};
