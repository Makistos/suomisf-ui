import { useMemo, useState } from 'react';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { Slider } from 'primereact/slider';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useQuery } from '@tanstack/react-query';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { getApiContent } from '../../../services/user-service';
import { getCurrenUser } from '../../../services/auth-service';

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend
);

interface AuthorCount {
    id: number | null;
    name: string;
    alt_name: string | null;
    nationality: string | null;
    genres: { [key: string]: number };
    total: number;
}

interface NationalityCount {
    nationality_id: number | null;
    nationality: string | null;
    count: number;
}

interface AuthorChartProps {
    nationalityData: NationalityCount[];
}

const genreOptions = [
    { label: 'Kaikki genret', value: 'all' },
    { label: 'Science Fiction', value: 'SF' },
    { label: 'Fantasia', value: 'F' },
    { label: 'Kauhu', value: 'K' },
    { label: 'Nuorten SF', value: 'nSF' },
    { label: 'Nuorten fantasia', value: 'nF' },
    { label: 'Nuorten kauhu', value: 'nK' },
    { label: 'Poliittinen fiktio', value: 'PF' },
    { label: 'Vaihtoehtohistoria', value: 'VEH' },
    { label: 'Lasten fantasia', value: 'lF' },
    { label: 'Lasten SF', value: 'lSF' },
    { label: 'Rajatapaus', value: 'rajatap' },
];

// Colors for nationality pie chart
const nationalityColors = [
    '#0958D7', '#D30031', '#DAA520', '#31572C', '#7B2D8E',
    '#E67E22', '#E91E63', '#17A2B8', '#FF696D', '#82C341',
    '#6C757D', '#9C27B0', '#00BCD4', '#FF5722', '#795548',
    '#607D8B', '#3F51B5', '#009688', '#CDDC39', '#FFC107',
];

export const AuthorChart = ({ nationalityData }: AuthorChartProps) => {
    const [selectedGenre, setSelectedGenre] = useState<string>('all');
    const [authorCount, setAuthorCount] = useState<number>(10);
    const user = useMemo(() => getCurrenUser(), []);

    // Fetch author data with count and genre parameters
    const authorQuery = useQuery<AuthorCount[]>({
        queryKey: ['stats', 'authorcounts', authorCount, selectedGenre],
        queryFn: async () => {
            const genreParam = selectedGenre !== 'all' ? `&genre=${selectedGenre}` : '';
            const response = await getApiContent(`stats/authorcounts?count=${authorCount}${genreParam}`, user);
            return response.data;
        }
    });

    // Filter authors (exclude "Muut" aggregation)
    const authors = useMemo(() => {
        if (!authorQuery.data) return [];
        return authorQuery.data.filter(author => author.name !== 'Muut');
    }, [authorQuery.data]);

    // Process authors with count field
    const allAuthors = useMemo(() => {
        return [...authors]
            .map(author => ({
                ...author,
                count: selectedGenre === 'all' ? author.total : (author.genres[selectedGenre] || 0)
            }))
            .filter(author => author.count > 0)
            .sort((a, b) => b.count - a.count);
    }, [authors, selectedGenre]);

    // Nationality data from API (already sorted by count)
    const allNationalities = useMemo(() => {
        return nationalityData
            .filter(item => item.nationality !== null)
            .map(item => ({
                nationality: item.nationality!,
                count: item.count
            }));
    }, [nationalityData]);

    // Chart data (top 20 nationalities)
    const nationalityChartData = useMemo(() => {
        const top20 = allNationalities.slice(0, 20);

        if (top20.length === 0) return null;

        return {
            labels: top20.map(item => item.nationality),
            datasets: [
                {
                    data: top20.map(item => item.count),
                    backgroundColor: nationalityColors.slice(0, top20.length),
                    hoverBackgroundColor: nationalityColors.slice(0, top20.length).map(c => c + 'CC')
                }
            ]
        };
    }, [allNationalities]);

    const nationalityChartOptions = {
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right' as const,
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
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        return `${context.label}: ${context.parsed.toLocaleString('fi-FI')} teosta`;
                    }
                }
            }
        }
    };

    const countTemplate = (rowData: any) => {
        return rowData.count.toLocaleString('fi-FI');
    };

    const nameTemplate = (rowData: AuthorCount) => {
        const displayName = rowData.alt_name || rowData.name;
        if (rowData.id) {
            return <a href={`/people/${rowData.id}`}>{displayName}</a>;
        }
        return displayName;
    };

    return (
        <div className="grid">
            {/* Nationality pie chart */}
            <div className="col-12 lg:col-6">
                <Card className="shadow-2 h-full">
                    <h3 className="mt-0 mb-3 text-center">Kirjailijoiden kansallisuudet</h3>
                    {nationalityChartData ? (
                        <div style={{ height: '400px' }}>
                            <Pie data={nationalityChartData} options={nationalityChartOptions} />
                        </div>
                    ) : (
                        <p className="text-500 text-center">Ei dataa</p>
                    )}
                </Card>
            </div>

            {/* Top N authors list */}
            <div className="col-12 lg:col-6">
                <Card className="shadow-2 h-full">
                    <h3 className="mt-0 mb-3 text-center">Tuotteliaimmat kirjailijat (Top {authorCount})</h3>
                    <div className="flex justify-content-center align-items-center gap-3 mb-3 flex-wrap">
                        <Dropdown
                            value={selectedGenre}
                            options={genreOptions}
                            optionLabel="label"
                            optionValue="value"
                            onChange={(e) => setSelectedGenre(e.value)}
                            className="w-auto"
                        />
                        <div className="flex align-items-center gap-2">
                            <span className="text-sm">Määrä: {authorCount}</span>
                            <Slider
                                value={authorCount}
                                onChange={(e) => setAuthorCount(e.value as number)}
                                min={10}
                                max={100}
                                step={10}
                                className="w-8rem"
                            />
                        </div>
                    </div>
                    {authorQuery.isLoading ? (
                        <div className="flex justify-content-center p-4">
                            <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                        </div>
                    ) : (
                        <DataTable
                            value={allAuthors}
                            stripedRows
                            size="small"
                            scrollable
                            scrollHeight="400px"
                        >
                            <Column field="name" header="Kirjailija" body={nameTemplate} />
                            <Column field="count" header="Teoksia" body={countTemplate} style={{ width: '100px', textAlign: 'right' }} />
                        </DataTable>
                    )}
                </Card>
            </div>

            {/* Full nationality list (hidden by default) */}
            <div className="col-12 lg:col-6">
                <Card className="shadow-2">
                    <details>
                        <summary className="cursor-pointer text-500">Näytä kaikki kansallisuudet ({allNationalities.length} kpl)</summary>
                        <div className="mt-3">
                            <DataTable
                                value={allNationalities}
                                stripedRows
                                size="small"
                                paginator
                                rows={25}
                                rowsPerPageOptions={[25, 50, 100]}
                            >
                                <Column field="nationality" header="Kansallisuus" sortable />
                                <Column field="count" header="Teoksia" body={(rowData: any) => rowData.count.toLocaleString('fi-FI')} style={{ width: '100px', textAlign: 'right' }} sortable />
                            </DataTable>
                        </div>
                    </details>
                </Card>
            </div>

        </div>
    );
};
