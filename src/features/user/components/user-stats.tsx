import { getApiContent } from "@services/user-service";
import { Chart } from "primereact/chart";
import { ChartData } from "chart.js/index";
import { useEffect, useState } from "react";
import { getGenreColors } from "../../genre";

interface UserStatsProps {
    userId: string
}

type GenreData = {
    id: number
    abbr: string
    name: string
    count: number
}

export const UserStats = ({ userId }: UserStatsProps) => {
    const [genres, setGenres]: [ChartData, (genres: ChartData) => void] = useState<ChartData>({ datasets: [], labels: [] });
    const [options, setOptions] = useState({});

    const getGenres = async (userId: string): Promise<GenreData[]> => {
        const retval = await getApiContent(`users/${userId}/stats/genres`, null)
            .then(response => {
                return response.data;
            });
        return retval;
    }

    useEffect(() => {

        const fetchGenres = async () => {
            const retval = await getGenres(userId).then(response => {
                return response;
            })
            return retval;
        }
        const genres = fetchGenres().then(genres => {
            setGenres(toChartData(genres));
        });
        setOptions({});
    }, [userId])

    /**
     * Convert a list of genres into a ChartData object
     *
     * @param genres A list of GenreData objects
     * @returns A ChartData object
     */
    const toChartData = (genres: GenreData[]): ChartData => {
        console.log(genres);
        return {
            labels: genres.map(genre => genre.name + ' (' + genre.count + ')'),
            datasets: [
                {
                    data: genres.map(genre => genre.count),
                    backgroundColor: getGenreColors(genres.map(genre => genre.abbr))
                }
            ]
        }
    }

    if (genres.datasets?.length === 0) {
        return <></>
    }
    //console.log(genres);

    return (
        <div className="card flex justify-content-center">
            <Chart type="pie" className="w-full"
                data={genres}
                options={options}
            />
        </div>
    )
}