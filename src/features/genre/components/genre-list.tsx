import React, { } from "react";
import { GenresProps } from "../types";


export const GenreList = ({ genres }: GenresProps) => {
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
