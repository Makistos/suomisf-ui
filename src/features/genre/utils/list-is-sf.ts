import { IGenre } from "../types";


export const listIsSf = (genres: IGenre[]) => {
    /**
     * Check whether supplied list of genres would constitute an SF or non-SF
     * item (work, short).
     *
     * Collections/anthologies ("Kokoelma"/"Kok") are not important when
     * deciding this.
     */
    const genres_sans = genres.filter(genre => genre.abbr !== "kok");
    if (genres_sans.length === 1 && genres_sans[0].abbr === 'eiSF')
        return false;
    return true;
};
