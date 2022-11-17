export interface IGenre {
    id: number;
    name: string;
    abbr: string;
}

export interface GenresProps {
    genres: IGenre[],
    showOneCount?: boolean
}

export interface GenreProps {
    genre: string,
    count: number | null
}
