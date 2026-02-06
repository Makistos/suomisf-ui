import { useMemo, useState } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ProgressSpinner } from 'primereact/progressspinner';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { Dropdown } from 'primereact/dropdown';
import { Slider } from 'primereact/slider';
import { useQuery } from '@tanstack/react-query';
import { getApiContent } from '../../../services/user-service';
import { getCurrenUser } from '../../../services/auth-service';

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend
);

interface PublisherCount {
    id: number | null;
    name: string;
    fullname: string | null;
    genres: { [key: string]: number };
    total: number;
}

// Genre names for the dropdown
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

// Colors for publishers (cycle through these)
const publisherColors = [
    '#0958D7', '#D30031', '#31572C', '#7B2D8E', '#E67E22',
    '#E91E63', '#17A2B8', '#DAA520', '#6C757D', '#82C341',
    '#4A90D9', '#FF696D', '#9B59B6', '#A0522D', '#008B8B',
    '#21D011', '#7EC8E3', '#2C3E50', '#F39C12', '#1ABC9C',
    '#8E44AD', '#C0392B', '#27AE60', '#2980B9', '#D35400',
    '#16A085', '#E74C3C', '#3498DB', '#9B59B6', '#34495E',
];

export const PublisherChart = () => {
    const [selectedGenre, setSelectedGenre] = useState<string>('all');
    const [publisherCount, setPublisherCount] = useState<number>(10);
    const user = useMemo(() => getCurrenUser(), []);

    // Fetch publisher data with count and genre parameters
    const publisherQuery = useQuery<PublisherCount[]>({
        queryKey: ['stats', 'publishercounts', publisherCount, selectedGenre],
        queryFn: async () => {
            const genreParam = selectedGenre !== 'all' ? `&genre=${selectedGenre}` : '';
            const response = await getApiContent(`stats/publishercounts?count=${publisherCount}${genreParam}`, user);
            return response.data;
        }
    });

    // Filter out "Muut" and process publishers
    const publishers = useMemo(() => {
        if (!publisherQuery.data) return [];
        return publisherQuery.data.filter(pub => pub.name !== 'Muut' && pub.fullname !== 'Muut');
    }, [publisherQuery.data]);

    // Process publishers with count field
    const allPublishers = useMemo(() => {
        return [...publishers]
            .map(pub => ({
                ...pub,
                count: selectedGenre === 'all' ? pub.total : (pub.genres[selectedGenre] || 0)
            }))
            .filter(pub => pub.count > 0)
            .sort((a, b) => b.count - a.count);
    }, [publishers, selectedGenre]);

    // Chart data
    const chartData = useMemo(() => {
        const labels = allPublishers.map(pub => pub.fullname || pub.name);
        const values = allPublishers.map(pub => pub.count);
        const colors = allPublishers.map((_, index) => publisherColors[index % publisherColors.length]);

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
    }, [allPublishers]);

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
                <h2 className="mt-0 mb-4">Suurimmat kustantajat</h2>
                <div className="flex justify-content-center align-items-center gap-3 mb-3 flex-wrap">
                    <Dropdown
                        value={selectedGenre}
                        options={genreOptions}
                        optionLabel="label"
                        optionValue="value"
                        onChange={(e) => setSelectedGenre(e.value)}
                        placeholder="Valitse genre"
                        className="w-auto"
                    />
                    <div className="flex align-items-center gap-2">
                        <span className="text-sm">Määrä: {publisherCount}</span>
                        <Slider
                            value={publisherCount}
                            onChange={(e) => setPublisherCount(e.value as number)}
                            min={10}
                            max={100}
                            step={10}
                            className="w-8rem"
                        />
                    </div>
                </div>
                {publisherQuery.isLoading ? (
                    <div className="flex justify-content-center p-4">
                        <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                    </div>
                ) : (
                    <div style={{ width: '1000px', height: '700px' }}>
                        <Pie data={chartData} options={chartOptions} />
                    </div>
                )}
                <details className="mt-4 text-left">
                    <summary className="cursor-pointer text-500">Näytä kaikki kustantajat ({allPublishers.length} kpl)</summary>
                    <div className="mt-3">
                        <DataTable
                            value={allPublishers}
                            stripedRows
                            size="small"
                            paginator
                            rows={25}
                            rowsPerPageOptions={[25, 50, 100]}
                        >
                            <Column field="fullname" header="Kustantaja" body={(rowData: PublisherCount) => rowData.fullname || rowData.name} sortable />
                            <Column field="count" header="Teoksia" body={(rowData: any) => rowData.count.toLocaleString('fi-FI')} style={{ width: '100px', textAlign: 'right' }} sortable />
                        </DataTable>
                    </div>
                </details>
            </Card>
        </div>
    );
};
