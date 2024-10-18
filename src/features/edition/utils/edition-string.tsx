import { Edition } from "../types";


export const EditionString = (edition: Edition) => {
    /* This a bit complex. The rules are:
       1. Show version if it is > 1.
       2. Show edition number always, except when it is 1
          and version is > 1.
       3. Some edition numbers are unknown. Show a question mark
          in those cases.
    */
    let retval = "";
    if (edition.version && edition.version !== 1) {
        retval = edition.version + ".laitos ";
    }
    let ednum = Number(edition.editionnum);
    if (isNaN(ednum)) {
        ednum = 0;
    }
    if (edition.editionnum !== null) {
        if ((edition.version === null || edition.version === 1) ||
            (edition.version > 1 && ednum !== 1)) {
            retval = retval + edition.editionnum + ".painos";
        }
    } else {
        retval = "";
    }
    return retval;
};
