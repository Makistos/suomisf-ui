import { TRBL } from "chart.js/types/geometric";

export interface KeyValuePair {
    id: number | null,
    value: string | null
}

export type PickOnly<T, K extends keyof T> =
    Pick<T, K> & { [P in Exclude<keyof T, K>]?: never };

// Following can be used like e.g.
// const person: AtMostTwoKeys<Person>;
// person = {id: 1, name: "Clarke, Arthur C."}
type AtMostTwoKeys<T> = (
    PickOnly<T, never> |
    { [K in keyof T]-?: PickOnly<T, K> |
        { [L in keyof T]-?:
            PickOnly<T, K | L> }[keyof T]
    }[keyof T]
) extends infer O ? { [P in keyof O]: O[P] } : never


// Following is used to pick any number of properties from an object. E.g.
// const personId = pickProperties(person, "id", "name")
export const pickProperties = (item: any, ...fields: any[]) => {
    return fields.reduce(function (result, prop) {
        result[prop] = item[prop];
        return result;
    }, {});
};