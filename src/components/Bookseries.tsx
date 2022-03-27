import { IWork } from "./Work";

export interface IBookseries {
    id: number,
    name: string,
    orig_name: string,
    important: number,
    image_src: string,
    image_attr: string
}

export const groupByBookSeries = (works: IWork[]) => {
    const grouped: Record<string, IWork[]> =
        works.reduce((acc: { [index: string]: any }, currentValue) => {

            const groupKey = currentValue.bookseries.name;
            if (!acc[groupKey]) {
                acc[groupKey] = []
            }
            acc[groupKey].push(currentValue);
            return acc;
        }, {})
    return grouped;
}

export const BookseriesSummary = () => {
    return (
        <div></div>
    )
}
