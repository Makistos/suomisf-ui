import { Work } from "../../work";

export const groupByBookSeries = (works: Work[], seriesType: string) => {
    const grouped: Record<string, Work[]> = works.reduce((acc: { [index: string]: any; }, currentValue) => {

        const groupKey = currentValue[seriesType].name;
        if (!acc[groupKey]) {
            acc[groupKey] = [];
        }
        acc[groupKey].push(currentValue);
        return acc;
    }, {});
    return grouped;
};


