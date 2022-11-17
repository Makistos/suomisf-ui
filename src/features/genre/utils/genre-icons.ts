export const genreIcons: { [key: string]: string } = {
    'Science Fiction': 'fa-solid fa-atom',
    'Fantasia': 'fa-solid fa-scroll',
    'Kauhu': 'fa-solid fa-skull',
    'Nuorten Science Fiction': 'fa-solid fa-user-astronaut',
    'Nuorten fantasia': 'fa-solid fa-hat-wizard',
    'Nuorten kauhu': 'fa-solid fa-ghost',
    'Paleofiktio': 'fa-solid fa-fire',
    'Poliittinen fiktio': 'fa-solid fa-landmark-dome',
    'Vaihtoehtohistoria': 'fa-solid fa-arrows-split-up-and-left',
    'Utopia': 'fa-solid fa-face-smile',
    'Lasten Science Fiction': 'fa-solid fa-robot',
    'Satu': 'fa-solid fa-baby',
    'Ei science fictionia': 'fa-solid fa-ban',
    'rajatapaus': 'fa-solid fa-circle-question',
    'Kokoelma': 'fa-solid fa-bars',
    'Lasten fantasia': 'fa-solid fa-dragon'
};
export const getGenreIcon = (genre: string) => {
    return genreIcons[genre];
}


