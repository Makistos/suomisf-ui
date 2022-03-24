import { Fragment } from "react"

export interface IGenre {
    id: number,
    name: string,
    abbr: string
}

interface GenreProps {
    genres: IGenre[]
}

export const GenreList = ({ genres }: GenreProps) => {
    return (
        genres ? (
            <Fragment>
                <Fragment>[</Fragment>
                {
                    genres.map((a) => a.abbr).join(", ")
                }
                <Fragment>]</Fragment>
            </Fragment >
        ) : (
            <Fragment></Fragment>
        )
    )
}