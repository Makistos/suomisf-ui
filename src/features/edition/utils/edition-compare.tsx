import { Edition } from "../types";


export const editionCmp = (a: Edition, b: Edition) => {
    let aVersion = 1;
    let bVersion = 1;
    if (a.version) {
        aVersion = a.version;
    }
    if (b.version) {
        bVersion = b.version;
    }
    if (aVersion !== bVersion) {
        /* Version (laitos) is most important sort order */
        if (aVersion < bVersion)
            return -1;
        return 1;
    }
    if (a.editionnum !== b.editionnum) {
        if (a.editionnum < b.editionnum)
            return -1;
        return 1;
    }
    /* Usually editions are in order in database so if everything
       else fails, return in the order they were, e.g. default
       return value is -1. */
    if (a.pubyear > b.pubyear)
        return -1;
    return -1;
};
