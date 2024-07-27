import React, { } from "react";
import { Genre } from "../types";

interface GenreListProps {
    genres: Genre[]
}

export const GenreList = ({ genres }: GenreListProps) => {
    return (
        genres ? (
            <>
                <>[</>
                {genres.map((a) => a.abbr).join(", ")}
                <>]</>
            </>
        ) : (
            <></>
        )
    );
};
