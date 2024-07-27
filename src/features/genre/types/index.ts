export interface Genre {
    id: number;
    name: string;
    abbr: string;
}

export interface GenreProps {
    genre: string,
    count: number | null
}
