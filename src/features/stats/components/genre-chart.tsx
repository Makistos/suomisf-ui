import { useMemo, useState } from 'react';
import { Card } from 'primereact/card';
import { Dialog } from 'primereact/dialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useQuery } from '@tanstack/react-query';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { getGenreColors } from '../../genre/utils/genre-colors';
import { Genre } from '../../genre';
import { getApiContent } from '../../../services/user-service';
import { getCurrenUser } from '../../../services/auth-service';
import { WorkList } from '../../work/components/work-list';
import { Work } from '../../work/types';

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
    const user = useMemo(() => getCurrenUser(), []);
    const [genreDialogFilter, setGenreDialogFilter] = useState<{ abbr: string; id: number; count: number } | null>(null);

    // Only include genres that are in the genreNames record, sorted by count descending
    const genreKeys = useMemo(() => Object.keys(data)
        .filter(key => key in genreNames)
        .sort((a, b) => data[b] - data[a]), [data]);

    const genresQuery = useQuery<Genre[]>({
        queryKey: ['genres'],
        queryFn: async () => {
            const response = await getApiContent('genres', user);
            return response.data;
        }
    });

    const genreIdByAbbr = useMemo(() => {
        const map = new Map<string, number>();
        genresQuery.data?.forEach(g => map.set(g.abbr, g.id));
        return map;
    }, [genresQuery.data]);

    const chartData = useMemo(() => {
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
    }, [data, genreKeys]);

    const chartOptions = useMemo(() => ({
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
                },
                onClick: (_event: unknown, legendItem: { index?: number }) => {
                    const abbr = genreKeys[legendItem.index ?? -1];
                    const id = abbr ? genreIdByAbbr.get(abbr) : undefined;
                    if (abbr && id) {
                        setGenreDialogFilter({ abbr, id, count: data[abbr] });
                    }
                }
            }
        }
    }), [genreKeys, genreIdByAbbr, data]);

    const genreWorksQuery = useQuery<Work[]>({
        queryKey: ['stats', 'filterworks', 'genre', genreDialogFilter?.id],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append('genre', String(genreDialogFilter?.id));
            const response = await getApiContent(`stats/filterworks?${params.toString()}`, user);
            return response.data;
        },
        enabled: genreDialogFilter !== null
    });

    return (
        <div className="flex justify-content-center">
            <Card className="shadow-2 text-center">
                <h2 className="mt-0 mb-4">Teokset genreittäin</h2>
                <div style={{ height: '600px', width: '600px' }}>
                    <Pie data={chartData} options={chartOptions} />
                </div>
            </Card>

            {/* Dialog for works filtered by genre */}
            <Dialog
                header={genreDialogFilter ? `${genreNames[genreDialogFilter.abbr]} (${genreDialogFilter.count})` : ''}
                visible={genreDialogFilter !== null}
                onHide={() => setGenreDialogFilter(null)}
                style={{ width: '80vw', maxHeight: '90vh' }}
                maximizable
            >
                {genreWorksQuery.isLoading ? (
                    <div className="flex justify-content-center p-4">
                        <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                    </div>
                ) : genreWorksQuery.data && genreWorksQuery.data.length > 0 ? (
                    <WorkList works={genreWorksQuery.data} />
                ) : (
                    <p className="text-500">Ei tuloksia</p>
                )}
            </Dialog>
        </div>
    );
};
