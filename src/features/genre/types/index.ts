export interface Genre {
    id: number;
    name: string;
    abbr: string;
}

export interface GenresProps {
    genres: Genre[],
    showOneCount?: boolean
}

export interface GenreProps {
    genre: string,
    count: number | null
}
