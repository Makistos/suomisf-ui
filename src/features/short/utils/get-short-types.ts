import _ from "lodash";
import { Short } from "../types";

/** Return a list of unique short types ordered by their id. */
export const getShortTypes = (shorts: Short[]) => {
    const typeList = shorts.map(short => short.type);
    const types = _.uniqBy(typeList, 'id').sort((a, b) => a.id < b.id ? -1 : 1);
    return types;
}