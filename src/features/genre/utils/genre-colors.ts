const GenreColors: { [key: string]: string; } = {
    SF: "#0958D7",
    F: "#31572C",
    K: "#D30031",
    nSF: "#4A90D9",
    nF: "#21D011",
    nK: "#FF696D",
    Paleof: "#9B59B6",
    PF: "#7B2D8E",
    VH: "#E67E22",
    Utopia: "#DAA520",
    lSF: "#7EC8E3",
    satu: "#E91E63",
    eiSF: "#6C757D",
    rajatap: "#A0522D",
    kok: "#008B8B",
    lF: "#82C341"
};

export const getGenreColors = (genres: string[]) => {
    return genres.map(genre => GenreColors[genre]);
};
