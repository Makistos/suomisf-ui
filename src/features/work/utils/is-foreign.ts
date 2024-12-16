import { Work } from "../types";

export const isForeign = (work: Work) => {
    if (work.language_name && work.language_name.id === 7) {
        return false;
    }
    return true;
}