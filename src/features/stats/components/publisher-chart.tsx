import { useMemo, useState } from 'react';
import { Card } from 'primereact/card';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { Dropdown } from 'primereact/dropdown';

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

interface PublisherChartProps {
    data: PublisherCount[];
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

export const PublisherChart = ({ data }: PublisherChartProps) => {
    const [selectedGenre, setSelectedGenre] = useState<string>('all');

    const { chartData, totalPublishers } = useMemo(() => {
        // Filter publishers based on selected genre
        // Exclude "Muut" as it's an aggregated category from the API
        const filteredPublishers = [...data]
            .filter(pub => pub.name !== 'Muut' && pub.fullname !== 'Muut')
            .map(pub => ({
                ...pub,
                count: selectedGenre === 'all' ? pub.total : (pub.genres[selectedGenre] || 0)
            }))
            .filter(pub => pub.count > 0);

        // Sort and take top 30 for chart
        const sortedPublishers = filteredPublishers
            .sort((a, b) => b.count - a.count)
            .slice(0, 30);

        const labels = sortedPublishers.map(pub => pub.fullname || pub.name);
        const values = sortedPublishers.map(pub => pub.count);
        const colors = sortedPublishers.map((_, index) => publisherColors[index % publisherColors.length]);

        return {
            chartData: {
                labels,
                datasets: [
                    {
                        data: values,
                        backgroundColor: colors,
                        hoverBackgroundColor: colors.map(c => c + 'CC')
                    }
                ]
            },
            totalPublishers: filteredPublishers.length
        };
    }, [data, selectedGenre]);

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
                <div className="mb-3">
                    <Dropdown
                        value={selectedGenre}
                        options={genreOptions}
                        optionLabel="label"
                        optionValue="value"
                        onChange={(e) => setSelectedGenre(e.value)}
                        placeholder="Valitse genre"
                        className="w-auto"
                    />
                    <span className="ml-3 text-500">
                        Yhteensä {totalPublishers.toLocaleString('fi-FI')} kustantajaa
                    </span>
                </div>
                <div style={{ width: '1000px', height: '700px' }}>
                    <Pie data={chartData} options={chartOptions} />
                </div>
            </Card>
        </div>
    );
};
