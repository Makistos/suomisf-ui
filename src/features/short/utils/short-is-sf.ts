import { Short } from '../types';


export const shortIsSf = (short: Short) => {
    /**
     * Checks whether short is the sf genre.
     *
     * A short is not SF is it has exactly one genre and that genre's
     * abbreviation is "eiSF". Any other combination means it's SF.
     */
    if (short.genres.length === 1 && short.genres[0].abbr === 'eiSF')
        return false;
    return true;
};
