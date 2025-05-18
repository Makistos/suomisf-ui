import React, { } from "react";
import { Genre } from "../types";

interface GenreListProps {
    genres: Genre[],
    collection?: boolean,
    booklet?: boolean
}

export const GenreList = ({ genres, collection = false, booklet = false }: GenreListProps) => {
    if (genres.length === 0 && !collection && !booklet) {
        return <></>;
    }
    let tmpGenres = [...genres];
    if (collection && !genres.map((a) => a.abbr).includes('kok')) {
        tmpGenres.push({ id: 0, abbr: 'kok', name: 'Kokoelma' });
    }
    if (booklet) {
        tmpGenres.push({ id: 0, abbr: 'Vihko', name: 'Vihko' });
    }
    return (
        tmpGenres ? (
            <>
                [
                {tmpGenres.map((a) => a.abbr).join(", ")}
                ]
            </>
        ) : (
            <></>
        )
    );
};
