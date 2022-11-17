import React, { Fragment } from "react";
import { GenresProps } from "../types";


export const GenreList = ({ genres }: GenresProps) => {
    return (
        genres ? (
            <Fragment>
                <Fragment>[</Fragment>
                {genres.map((a) => a.abbr).join(", ")}
                <Fragment>]</Fragment>
            </Fragment>
        ) : (
            <Fragment></Fragment>
        )
    );
};
