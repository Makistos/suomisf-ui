/**
 * Selects the best id from params and props or throws an error if none is
 * available.
 *
 * @param params Params returned by getParams().
 * @param propsId props id value.
 * @returns params.itemId if it exists, else propsId.
 * @throws "No id given for" if neither parameter has a value.
 */
export const selectId = (params: any, propsId: string | null): string => {
    if (params !== undefined && params.itemId !== undefined) {
        return params.itemId;
    } else if (propsId !== undefined && propsId !== null) {
        return propsId;
    } else {
        throw new Error("No id given for");
    }
}