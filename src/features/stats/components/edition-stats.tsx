import React, { useState, useEffect } from "react";

import { Chart } from "primereact/chart";
import { ChartData } from "chart.js/index";
import _ from "lodash";

import { getGenreColors } from "../../genre";
import { EditionsProps } from "../types";

export const EditionsStats = ({ editions }: EditionsProps) => {
    const [genres, setGenres]: [ChartData, (genres: ChartData) => void] = useState<ChartData>({ datasets: [], labels: [] });

    const genreLabels = (genres: [string, number][]) => {
        let retval: string[] = [];
        let total: number = 0;
        genres.forEach(number => { total += number[1]; })

        retval = genres.map(genre =>
            genre[0] + "(" + genre[1] + "/" + Math.floor((genre[1] / total * 100)).toString() + "%)");
        return retval;
    }

    useEffect(() => {
        let genresCount = Object.entries(              // Convert to array
            _.countBy(                                 // Count occurences of genres
                _.flatten(editions                     // Flatten array
                    .map(edition => edition.work[0])
                    .map(work => work.genres)),        // Pick all work genres
                (value => value.abbr)))                // Count by genre abbreviation
            .sort((a, b) => a[1] > b[1] ? -1 : 1);     // Sort by count in descending order
        genresCount = genresCount.filter(genre => genre[0] !== 'kok' && genre[0] !== 'eiSF');
        let newGenres: ChartData = {};
        newGenres.datasets = [];
        const data = genresCount.map(genre => genre[1]);
        const labels = genreLabels(genresCount);
        newGenres.datasets[0] = {};
        newGenres.datasets[0].data = data;
        newGenres.datasets[0].backgroundColor = getGenreColors(genresCount.map(genre => genre[0]));
        newGenres.labels = labels;
        setGenres(newGenres);
    }, [editions])


    const oldestEdition = () => {
        const oldest = editions.sort((a, b) => a.pubyear < b.pubyear ? -1 : 1)[0];
        return oldest.title + "(" + oldest.pubyear + ")";
    }

    const newestEdition = () => {
        const newest = editions.sort((a, b) => a.pubyear > b.pubyear ? -1 : 1)[0]
        return newest.title + "(" + newest.pubyear + ")";
    }


    return (
        <div>
            <p><b>Vanhin kirja: </b>{oldestEdition()}.</p>
            <p><b>Uusin kirja: </b>{newestEdition()}.</p>
            <Chart type="doughnut"
                data={genres}

            />
        </div>
    )
}


