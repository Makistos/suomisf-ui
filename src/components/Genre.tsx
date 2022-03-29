import { Fragment } from "react"
import { Chip } from 'primereact/chip';
import { Badge } from 'primereact/badge';
export interface IGenre {
    id: number,
    name: string,
    abbr: string
}

interface GenresProps {
    genres: IGenre[],
}

interface GenreProps {
    genre: string,
    count: number
}

export const GenreCount = ({ genre, count }: GenreProps) => {
    const labelText = () => {
        return genre + " x " + count;
    }
    return (
        <Chip label={labelText()} className="p-overlay-badge">
            <Badge value="{count}">
            </Badge>
        </Chip>
    )
}

export const GenreList = ({ genres }: GenresProps) => {
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