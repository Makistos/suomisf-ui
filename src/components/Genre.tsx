import { Fragment, useEffect, useState } from "react"
import { Chip } from 'primereact/chip';
import { Badge } from 'primereact/badge';

const genreIcons: { [key: string]: string } = {
    'Science Fiction': 'fa-solid fa-atom',
    'Fantasia': 'fa-solid fa-scroll',
    'Kauhu': 'fa-solid fa-skull',
    'Nuorten Science Fiction': 'fa-solid fa-user-astronaut',
    'Nuorten fantasia': 'fa-solid fa-hat-wizard',
    'Nuorten kauhu': 'fa-solid fa-ghost',
    'Paleofiktio': 'fa-solid fa-fire',
    'Poliittinen fiktio': 'fa-solid fa-landmark-dome',
    'Vaihtoehtoishistoria': 'fa-solid fa-arrows-split-up-and-left',
    'Utopia': 'fa-solid fa-face-smile',
    'Lasten Science Fiction': 'fa-solid fa-robot',
    'Satu': 'fa-solid fa-baby',
    'Ei science fictionia': 'fa-solid fa-ban',
    'rajatapaus': 'fa-solid fa-circle-question',
    'Kokoelma': 'fa-solid fa-bars',
    'Lasten fantasia': 'fa-solid fa-dragon'
};
export interface IGenre {
    id: number,
    name: string,
    abbr: string
}

interface GenresProps {
    genres: IGenre[],
    showOneCount?: boolean
}

interface GenreProps {
    genre: string,
    count: number | null
}

export const GenreCount = ({ genre, count }: GenreProps) => {
    const headerText = (name: string, count: number | null) => {
        if (count !== null) {
            return name + " x " + count;
        } else {
            return name;
        }
    }

    return (
        <Chip icon={genreIcons[genre]} label={headerText(genre, count)} className="p-overlay-badge">
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

export const GenreGroup = ({ genres, showOneCount }: GenresProps) => {
    const [groupedGenres, setGroupedGenres] = useState<[string, number][]>([]);

    useEffect(() => {
        const countGenres = () => {
            let retval = genres.reduce((acc, genre: IGenre) => {
                const genreName: string = genre.name;
                if (!acc[genreName]) {
                    acc[genreName] = 1;
                } else {
                    acc[genreName]++;
                }
                return acc;
            }, {} as Record<string, number>)
            return retval;
        }
        let counts = Object.entries(countGenres())
            .sort((a, b) => a[1] > b[1] ? -1 : 1)
            .map(genre => genre);
        setGroupedGenres(counts);
    }, [genres])

    return (
        genres ? (
            <div className="flex justify-content-center">
                {groupedGenres.map(genre => {
                    return (
                        <span key={genre[0]} className="mr-1">
                            <GenreCount genre={genre[0]} count={showOneCount && genre[1] !== 1 ? genre[1] : null} />
                        </span>
                    )
                })}
            </div>
        ) : (
            <></>
        )
    )
}