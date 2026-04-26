import { useMemo, useState } from 'react';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { SelectButton } from 'primereact/selectbutton';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useQueries } from '@tanstack/react-query';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getApiContent } from '../../../services/user-service';
import { getCurrenUser } from '../../../services/auth-service';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface YearCount {
    year: number;
    count: number;
    language_id: number | null;
    language_name: string | null;
}

interface CumulativeEditionsChartProps {
    data: YearCount[];
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

const allGenres = ['SF', 'F', 'K', 'nSF', 'nF', 'nK', 'PF', 'VEH', 'lF', 'lSF', 'rajatap'];

const genreLabels: Record<string, string> = {
    SF: 'Science Fiction',
    F: 'Fantasia',
    K: 'Kauhu',
    nSF: 'Nuorten SF',
    nF: 'Nuorten fantasia',
    nK: 'Nuorten kauhu',
    PF: 'Poliittinen fiktio',
    VEH: 'Vaihtoehtohistoria',
    lF: 'Lasten fantasia',
    lSF: 'Lasten SF',
    rajatap: 'Rajatapaus',
};

const genreColors: Record<string, string> = {
    SF: '#0958D7',
    F: '#31572C',
    K: '#D30031',
    nSF: '#4A90D9',
    nF: '#21D011',
    nK: '#FF696D',
    PF: '#7B2D8E',
    VEH: '#E67E22',
    lF: '#82C341',
    lSF: '#7EC8E3',
    rajatap: '#A0522D',
};

const languageOptions = [
    { label: 'suomi', value: 'suomi' },
    { label: 'englanti', value: 'englanti' },
    { label: 'ruotsi', value: 'ruotsi' },
    { label: 'saksa', value: 'saksa' },
    { label: 'ranska', value: 'ranska' },
    { label: 'venäjä', value: 'venäjä' },
    { label: 'espanja', value: 'espanja' },
    { label: 'italia', value: 'italia' },
    { label: 'japani', value: 'japani' },
    { label: 'puola', value: 'puola' },
];

const viewModeOptions = [
    { label: 'Yhdistetty', value: false },
    { label: 'Genret erikseen', value: true },
];

// Build year->count map from YearCount[], optionally filtering by languages
const aggregateByYear = (data: YearCount[], languages: string[]): Record<number, number> => {
    const result: Record<number, number> = {};
    data.forEach(item => {
        if (!item.year) return;
        if (languages.length > 0 && !languages.includes(item.language_name || '')) return;
        result[item.year] = (result[item.year] || 0) + item.count;
    });
    return result;
};

// Compute cumulative values for displayYears, accumulating from absoluteMin
const computeCumulative = (
    yearCounts: Record<number, number>,
    absoluteMin: number,
    displayYears: number[]
): number[] => {
    let running = 0;
    for (let y = absoluteMin; y < (displayYears[0] ?? absoluteMin); y++) {
        running += yearCounts[y] || 0;
    }
    return displayYears.map(year => {
        running += yearCounts[year] || 0;
        return running;
    });
};

export const CumulativeEditionsChart = ({ data }: CumulativeEditionsChartProps) => {
    const user = useMemo(() => getCurrenUser(), []);

    const { minYear, maxYear } = useMemo(() => {
        const years = data.map(d => d.year).filter(Boolean);
        return { minYear: Math.min(...years), maxYear: Math.max(...years) };
    }, [data]);

    const [startYear, setStartYear] = useState<number>(minYear);
    const [endYear, setEndYear] = useState<number>(maxYear);
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
    const [selectedGenre, setSelectedGenre] = useState<string>('all');
    const [showByGenre, setShowByGenre] = useState<boolean>(false);

    const yearOptions = useMemo(() => {
        const opts = [];
        for (let y = minYear; y <= maxYear; y++) {
            opts.push({ label: String(y), value: y });
        }
        return opts;
    }, [minYear, maxYear]);

    // Per-genre queries — always declared, enabled only when showByGenre is true
    const genreQueries = useQueries({
        queries: allGenres.map(genre => ({
            queryKey: ['stats', 'worksbyyear', genre],
            queryFn: async () => {
                const response = await getApiContent(`stats/worksbyyear?genre=${genre}`, user);
                return response.data as YearCount[];
            },
            enabled: showByGenre,
        })),
    });

    // Single-genre query when a specific genre is selected without "show by genre"
    const singleGenreQueries = useQueries({
        queries: [
            {
                queryKey: ['stats', 'worksbyyear', selectedGenre],
                queryFn: async () => {
                    const response = await getApiContent(`stats/worksbyyear?genre=${selectedGenre}`, user);
                    return response.data as YearCount[];
                },
                enabled: selectedGenre !== 'all' && !showByGenre,
            },
        ],
    });
    const singleGenreQuery = singleGenreQueries[0];

    const displayYears = useMemo(() => {
        const years: number[] = [];
        for (let y = startYear; y <= endYear; y++) years.push(y);
        return years;
    }, [startYear, endYear]);

    const isLoading =
        (showByGenre && genreQueries.some(q => q.isLoading)) ||
        (!showByGenre && selectedGenre !== 'all' && singleGenreQuery.isLoading);

    const chartData = useMemo(() => {
        if (showByGenre) {
            const datasets = allGenres
                .map((genre, idx) => {
                    const genreData = genreQueries[idx]?.data;
                    if (!genreData || genreData.length === 0) return null;
                    const yearCounts = aggregateByYear(genreData, selectedLanguages);
                    const cumulativeValues = computeCumulative(yearCounts, minYear, displayYears);
                    const hasData = cumulativeValues.some(v => v > 0);
                    if (!hasData) return null;
                    return {
                        label: genreLabels[genre] || genre,
                        data: cumulativeValues,
                        borderColor: genreColors[genre] || '#6C757D',
                        backgroundColor: 'transparent',
                        fill: false,
                        tension: 0.3,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        borderWidth: 2,
                    };
                })
                .filter((d): d is NonNullable<typeof d> => d !== null);

            return { labels: displayYears.map(String), datasets };
        }

        const activeData =
            selectedGenre !== 'all' && singleGenreQuery.data
                ? singleGenreQuery.data
                : data;

        const yearCounts = aggregateByYear(activeData, selectedLanguages);
        const cumulativeValues = computeCumulative(yearCounts, minYear, displayYears);
        const color = selectedGenre !== 'all' ? (genreColors[selectedGenre] || '#0958D7') : '#0958D7';

        return {
            labels: displayYears.map(String),
            datasets: [
                {
                    label:
                        selectedGenre !== 'all'
                            ? (genreLabels[selectedGenre] || selectedGenre)
                            : 'Kaikki genret',
                    data: cumulativeValues,
                    borderColor: color,
                    backgroundColor: color + '20',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    borderWidth: 2,
                },
            ],
        };
    }, [
        data,
        selectedGenre,
        selectedLanguages,
        displayYears,
        minYear,
        singleGenreQuery.data,
        showByGenre,
        genreQueries,
    ]);

    const chartOptions = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index' as const,
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top' as const,
                    labels: { usePointStyle: true },
                },
                tooltip: {
                    callbacks: {
                        label: (context: any) =>
                            `${context.dataset.label}: ${context.parsed.y.toLocaleString('fi-FI')} teosta`,
                    },
                },
            },
            scales: {
                x: {
                    title: { display: true, text: 'Vuosi' },
                    ticks: { maxTicksLimit: 20 },
                },
                y: {
                    title: { display: true, text: 'Teoksia (kumulatiivinen)' },
                    beginAtZero: false,
                },
            },
        }),
        []
    );

    return (
        <div className="flex justify-content-center">
            <Card className="shadow-2 text-center w-full">
                <h2 className="mt-0 mb-4">Kumulatiiviset painokset</h2>
                <div className="flex justify-content-center align-items-center gap-3 mb-3 flex-wrap">
                    <div className="flex align-items-center gap-2">
                        <label>Kielet:</label>
                        <MultiSelect
                            value={selectedLanguages}
                            options={languageOptions}
                            optionLabel="label"
                            optionValue="value"
                            onChange={(e) => setSelectedLanguages(e.value)}
                            placeholder="Kaikki kielet"
                            display="chip"
                            className="w-auto"
                        />
                    </div>
                    <div className="flex align-items-center gap-2">
                        <label>Genre:</label>
                        <Dropdown
                            value={showByGenre ? 'all' : selectedGenre}
                            options={genreOptions}
                            optionLabel="label"
                            optionValue="value"
                            onChange={(e) => setSelectedGenre(e.value)}
                            className="w-auto"
                            disabled={showByGenre}
                        />
                    </div>
                    <div className="flex align-items-center gap-2">
                        <label>Alku:</label>
                        <Dropdown
                            value={startYear}
                            options={yearOptions}
                            optionLabel="label"
                            optionValue="value"
                            onChange={(e) => setStartYear(e.value)}
                            className="w-auto"
                        />
                    </div>
                    <div className="flex align-items-center gap-2">
                        <label>Loppu:</label>
                        <Dropdown
                            value={endYear}
                            options={yearOptions}
                            optionLabel="label"
                            optionValue="value"
                            onChange={(e) => setEndYear(e.value)}
                            className="w-auto"
                        />
                    </div>
                    <SelectButton
                        value={showByGenre}
                        options={viewModeOptions}
                        optionLabel="label"
                        optionValue="value"
                        onChange={(e) => setShowByGenre(e.value)}
                    />
                </div>
                {isLoading ? (
                    <div className="flex justify-content-center p-4">
                        <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                    </div>
                ) : (
                    <div style={{ height: '400px' }}>
                        <Line data={chartData} options={chartOptions} />
                    </div>
                )}
            </Card>
        </div>
    );
};
