import { useMemo } from "react";
import { Genre } from "../types";
import { GenreCount } from "./genre-count";

interface GenresProps {
    genres: Genre[],
    showOneCount?: boolean,
    className?: string
}

export const GenreGroup = ({ genres, showOneCount, className }: GenresProps) => {
    // Genres by count, most common first
    const groupedGenres = useMemo(() => {
        if (genres === undefined) return [];
        const counts = genres.reduce((acc, genre: Genre) => {
            acc[genre.name] = (acc[genre.name] ?? 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).sort((a, b) => a[1] > b[1] ? -1 : 1);
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
