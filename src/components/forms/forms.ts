import { isAdmin, User } from '../../features/user';
export interface KeyValuePair {
    id: number | null,
    value: string | null
}

export type PickOnly<T, K extends keyof T> =
    Pick<T, K> & { [P in Exclude<keyof T, K>]?: never };

// Following is used to pick any number of properties from an object. E.g.
// const personId = pickProperties(person, "id", "name")
export const pickProperties = (item: any, ...fields: any[]) => {
    return fields.reduce(function (result, prop) {
        result[prop] = item[prop];
        return result;
    }, {});
};

export const isDisabled = (user: User | null, loading: boolean): boolean => {
    return !isAdmin(user) || loading
}

export interface FormSubmitObject {
    data: object,
    changed: object
}
