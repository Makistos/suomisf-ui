import React, { useEffect, useState } from "react";
import { Genre } from "../types";
import { GenreCount } from "./genre-count";

interface GenresProps {
    genres: Genre[],
    showOneCount?: boolean,
    className?: string
}

export const GenreGroup = ({ genres, showOneCount, className }: GenresProps) => {
    const [groupedGenres, setGroupedGenres] = useState<[string, number][]>([]);

    useEffect(() => {
        const countGenres = () => {
            let retval = genres.reduce((acc, genre: Genre) => {
                const genreName: string = genre.name;
                if (!acc[genreName]) {
                    acc[genreName] = 1;
                } else {
                    acc[genreName]++;
                }
                return acc;
            }, {} as Record<string, number>);
            return retval;
        };
        if (genres === undefined) return;
        let counts = Object.entries(countGenres())
            .sort((a, b) => a[1] > b[1] ? -1 : 1)
            .map(genre => genre);
        setGroupedGenres(counts);
    }, [genres]);

    return (
        genres ? (
            <div className={`flex flex-wrap gap-2 ${className || ''}`}>
                {groupedGenres.map(genre => (
                    <span key={genre[0]}>
                        <GenreCount
                            genre={genre[0]}
                            count={showOneCount && genre[1] !== 1 ? genre[1] : null}
                        />
                    </span>
                ))}
            </div>
        ) : (
            <></>
        )
    );
};
