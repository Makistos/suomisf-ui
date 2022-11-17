const GenreColors: { [key: string]: string; } = {
    SF: "#0958D7",
    F: "#31572C",
    K: "#D30031",
    nSF: "#A2D6F9",
    nF: "#21D011",
    nK: "#FF696D",
    Paleof: "#AAAABC",
    PF: "#AAAABC",
    VH: "#AAAABC",
    Utopia: "#AAAABC",
    lSF: "#AAAABC",
    satu: "#AAAABC",
    eiSF: "#AAAABC",
    rajatap: "#AAAABC",
    kok: "#AAAABC",
    lF: "#AAAABC"
};

export const getGenreColors = (genres: string[]) => {
    return genres.map(genre => GenreColors[genre]);
};
