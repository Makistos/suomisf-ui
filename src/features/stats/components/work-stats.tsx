import React, { useState, useEffect } from "react";

import { Chart } from "primereact/chart";
import { ChartData } from "chart.js";
import _ from "lodash";

import { getGenreColors } from "../../genre/utils/genre-colors";
import { WorksProps } from "../types";
import { TagGroup } from "@features/tag";


export const WorkStats = ({ works }: WorksProps) => {
    const [genres, setGenres]: [ChartData, (genres: ChartData) => void] = useState<ChartData>({ datasets: [], labels: [] });

    const genreLabels = (genres: [string, number][]) => {
        let retval: string[] = [];
        let total: number = 0;
        genres.forEach(number => { total += number[1]; });

        retval = genres.map(genre => genre[0] + "(" + genre[1] + "/" + Math.floor((genre[1] / total * 100)).toString() + "%)");
        return retval;
    };

    useEffect(() => {
        let genresCount = Object.entries(
            _.countBy(
                _.flatten(works // Flatten array
                    .map(work => work.genres)),
                (value => value.abbr))) // Count by genre abbreviation
            .sort((a, b) => a[1] > b[1] ? -1 : 1); // Sort by count in descending order
        genresCount = genresCount.filter(genre => genre[0] !== 'kok' && genre[0] !== 'eiSF');
        const data = genresCount.map(genre => genre[1]);
        const labels = genreLabels(genresCount);
        const newGenres: ChartData = {
            labels,
            datasets: [{
                data,
                backgroundColor: getGenreColors(genresCount.map(genre => genre[0])),
            }],
        };
        setGenres(newGenres);
    }, [works]);
    return (
        <div className="grid justify-content-center">
            <div className="grid col-12 justify-content-center">
                <span><b>Yhteensä</b>: {works.length}</span>
            </div>
            <div className="grid col-12 justify-content-center mt-4">
                <TagGroup tags={works.map(work => work.tags).flat()}
                    maxCount={10} overflow={10} showOneCount={true} />
            </div>
            <div className="grid col-12 justify-content-center">
                <Chart type="doughnut"
                    data={genres} />
            </div>
        </div>
    );
};
