import { useMemo } from 'react';
import { Card } from 'primereact/card';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { getGenreColors } from '../../genre/utils/genre-colors';

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend
);

// Map genre abbreviations to Finnish names
const genreNames: Record<string, string> = {
    'SF': 'Science Fiction',
    'F': 'Fantasia',
    'K': 'Kauhu',
    'nSF': 'Nuorten SF',
    'nF': 'Nuorten fantasia',
    'nK': 'Nuorten kauhu',
    'PF': 'Poliittinen fiktio',
    'VEH': 'Vaihtoehtohistoria',
    'lF': 'Lasten fantasia',
    'lSF': 'Lasten SF',
    'rajatap': 'Rajatapaus',
};

interface GenreChartProps {
    data: Record<string, number>;
}

export const GenreChart = ({ data }: GenreChartProps) => {
    const chartData = useMemo(() => {
        // Only include genres that are in the genreNames record, sorted by count descending
        const genreKeys = Object.keys(data)
            .filter(key => key in genreNames)
            .sort((a, b) => data[b] - data[a]);
        const labels = genreKeys.map(key => genreNames[key]);
        const values = genreKeys.map(key => data[key]);
        const colors = getGenreColors(genreKeys);

        return {
            labels,
            datasets: [
                {
                    data: values,
                    backgroundColor: colors,
                    hoverBackgroundColor: colors.map(c => c + 'CC')
                }
            ]
        };
    }, [data]);

    const chartOptions = {
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    usePointStyle: true,
                    generateLabels: (chart: any) => {
                        const dataset = chart.data.datasets[0];
                        return chart.data.labels.map((label: string, index: number) => ({
                            text: `${label} (${dataset.data[index].toLocaleString('fi-FI')})`,
                            fillStyle: dataset.backgroundColor[index],
                            strokeStyle: dataset.backgroundColor[index],
                            hidden: false,
                            index
                        }));
                    }
                }
            }
        }
    };

    return (
        <div className="flex justify-content-center">
            <Card className="shadow-2 text-center">
                <h2 className="mt-0 mb-4">Teokset genreittäin</h2>
                <div style={{ height: '600px', width: '600px' }}>
                    <Pie data={chartData} options={chartOptions} />
                </div>
            </Card>
        </div>
    );
};
