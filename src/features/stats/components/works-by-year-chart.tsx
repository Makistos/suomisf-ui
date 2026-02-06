import { useMemo, useState } from 'react';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { SelectButton } from 'primereact/selectbutton';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { isAdmin } from '@features/user';
import { getCurrenUser } from '@services/auth-service';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface YearCount {
    year: number;
    count: number;
    language_id: number | null;
    language_name: string | null;
}

interface WorksByYearChartProps {
    finnishEditionData: YearCount[];
    originalYearData: YearCount[];
}

// Colors for different languages
const languageColors: Record<string, string> = {
    'suomi': '#0958D7',
    'englanti': '#D30031',
    'ruotsi': '#DAA520',
    'saksa': '#31572C',
    'ranska': '#7B2D8E',
    'venäjä': '#E67E22',
    'espanja': '#E91E63',
    'italia': '#17A2B8',
    'japani': '#FF696D',
    'puola': '#82C341',
};

const defaultColor = '#6C757D';

const dataSourceOptions = [
    { label: 'Suomenkielinen painos', value: 'finnish' },
    { label: 'Alkuperäinen kirjoitusvuosi', value: 'original' },
    { label: 'Vertailu', value: 'comparison' },
];

const viewModeOptions = [
    { label: 'Vuosittain', value: 'yearly' },
    { label: 'Vuosikymmenittäin', value: 'decade' },
];

const languageOptions = [
    { label: 'Kaikki kielet', value: 'all' },
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

export const WorksByYearChart = ({ finnishEditionData, originalYearData }: WorksByYearChartProps) => {
    const user = useMemo(() => { return getCurrenUser() }, []);

    // Get min and max years from combined data
    const { minYear, maxYear } = useMemo(() => {
        const allData = [...finnishEditionData, ...originalYearData];
        const years = allData.map(d => d.year).filter(y => y);
        return {
            minYear: Math.min(...years),
            maxYear: Math.max(...years)
        };
    }, [finnishEditionData, originalYearData]);

    const [dataSource, setDataSource] = useState<'finnish' | 'original' | 'comparison'>('finnish');
    const [startYear, setStartYear] = useState<number>(minYear);
    const [endYear, setEndYear] = useState<number>(maxYear);
    const [viewMode, setViewMode] = useState<'yearly' | 'decade'>('yearly');
    const [selectedLanguage, setSelectedLanguage] = useState<string>('all');

    // Generate year options for dropdowns
    const yearOptions = useMemo(() => {
        const options = [];
        for (let year = minYear; year <= maxYear; year++) {
            options.push({ label: String(year), value: year });
        }
        return options;
    }, [minYear, maxYear]);

    // Get the active data based on selection
    const activeData = useMemo(() => {
        if (dataSource === 'finnish') return finnishEditionData;
        if (dataSource === 'original') return originalYearData;
        return finnishEditionData; // For comparison, we handle both datasets separately
    }, [dataSource, finnishEditionData, originalYearData]);

    const chartData = useMemo(() => {
        // Filter data by year range and genre
        const filterData = (data: YearCount[]) => data.filter(item =>
            item.year >= startYear && item.year <= endYear &&
            (selectedLanguage === 'all' || item.language_name === selectedLanguage)
        );

        if (dataSource === 'comparison') {
            // Comparison mode: aggregate totals per year without language separation
            const finnishFiltered = filterData(finnishEditionData);
            const originalFiltered = filterData(originalYearData);

            const aggregateByYear = (data: YearCount[], mode: 'yearly' | 'decade') => {
                const grouped: Record<string, number> = {};
                data.forEach(item => {
                    if (item.year) {
                        const key = mode === 'decade'
                            ? `${Math.floor(item.year / 10) * 10}-luku`
                            : String(item.year);
                        grouped[key] = (grouped[key] || 0) + item.count;
                    }
                });
                return grouped;
            };

            const finnishGrouped = aggregateByYear(finnishFiltered, viewMode);
            const originalGrouped = aggregateByYear(originalFiltered, viewMode);

            // Combine all keys and sort
            const allKeys = new Set([...Object.keys(finnishGrouped), ...Object.keys(originalGrouped)]);
            const sortedKeys = Array.from(allKeys).sort((a, b) => {
                const numA = parseInt(a);
                const numB = parseInt(b);
                return numA - numB;
            });

            return {
                labels: sortedKeys,
                datasets: [
                    {
                        label: 'Suomenkielinen painos',
                        data: sortedKeys.map(key => finnishGrouped[key] || 0),
                        backgroundColor: '#0958D7',
                    },
                    {
                        label: 'Alkuperäinen kirjoitusvuosi',
                        data: sortedKeys.map(key => originalGrouped[key] || 0),
                        backgroundColor: '#D30031',
                    }
                ],
                keyCount: sortedKeys.length
            };
        }

        // Single dataset mode with language breakdown
        const filteredData = filterData(activeData);

        // Group data by year or decade
        const groupedData: Record<string, Record<string, number>> = {};
        const languages = new Set<string>();

        filteredData.forEach(item => {
            if (item.year && item.language_name) {
                const key = viewMode === 'decade'
                    ? `${Math.floor(item.year / 10) * 10}-luku`
                    : String(item.year);

                if (!groupedData[key]) {
                    groupedData[key] = {};
                }

                if (!groupedData[key][item.language_name]) {
                    groupedData[key][item.language_name] = 0;
                }

                groupedData[key][item.language_name] += item.count;
                languages.add(item.language_name);
            }
        });

        // Sort keys
        const sortedKeys = Object.keys(groupedData).sort((a, b) => {
            const numA = parseInt(a);
            const numB = parseInt(b);
            return numA - numB;
        });

        // Create datasets for each language
        const languageArray = Array.from(languages).sort((a, b) => {
            // Sort by total count descending to show most common languages first
            const totalA = sortedKeys.reduce((sum, key) => sum + (groupedData[key][a] || 0), 0);
            const totalB = sortedKeys.reduce((sum, key) => sum + (groupedData[key][b] || 0), 0);
            return totalB - totalA;
        });

        const datasets = languageArray.map(language => ({
            label: language,
            data: sortedKeys.map(key => groupedData[key][language] || 0),
            backgroundColor: languageColors[language] || defaultColor,
        }));

        return {
            labels: sortedKeys,
            datasets,
            keyCount: sortedKeys.length
        };
    }, [activeData, finnishEditionData, originalYearData, startYear, endYear, viewMode, dataSource, selectedLanguage]);

    // Calculate height based on number of bars (20px per bar + padding for legend)
    const chartHeight = Math.max(300, chartData.keyCount * 20 + 80);

    const chartOptions = useMemo(() => ({
        indexAxis: 'y' as const,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    usePointStyle: true
                }
            },
            tooltip: {
                mode: 'nearest' as const,
                intersect: true,
                callbacks: {
                    label: (context: any) => {
                        return `${context.dataset.label}: ${context.parsed.x.toLocaleString('fi-FI')} teosta`;
                    }
                }
            }
        },
        scales: {
            x: {
                stacked: dataSource !== 'comparison',
                title: {
                    display: true,
                    text: 'Teoksia'
                }
            },
            y: {
                stacked: dataSource !== 'comparison',
                reverse: true,
            }
        }
    }), [dataSource]);

    // Get the current data for display
    const displayData = dataSource === 'comparison'
        ? [...finnishEditionData, ...originalYearData]
        : activeData;

    return (
        <div className="flex justify-content-center">
            <Card className="shadow-2 text-center w-full">
                <h2 className="mt-0 mb-4">Julkaisut vuosittain</h2>
                <div className="flex justify-content-center align-items-center gap-3 mb-3 flex-wrap">
                    <SelectButton
                        value={dataSource}
                        options={dataSourceOptions}
                        optionLabel="label"
                        optionValue="value"
                        onChange={(e) => setDataSource(e.value)}
                    />
                </div>
                <div className="flex justify-content-center align-items-center gap-3 mb-3 flex-wrap">
                    <div className="flex align-items-center gap-2">
                        <label>Kieli:</label>
                        <Dropdown
                            value={selectedLanguage}
                            options={languageOptions}
                            optionLabel="label"
                            optionValue="value"
                            onChange={(e) => setSelectedLanguage(e.value)}
                            className="w-auto"
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
                        value={viewMode}
                        options={viewModeOptions}
                        optionLabel="label"
                        optionValue="value"
                        onChange={(e) => setViewMode(e.value)}
                    />
                </div>
                <div style={{ height: `${chartHeight}px` }}>
                    <Bar data={chartData} options={chartOptions} />
                </div>
                <details className="mt-4 text-left">
                    <summary className="cursor-pointer text-500">Näytä data ({displayData.filter(item => item.year >= startYear && item.year <= endYear).length} riviä)</summary>
                    {isAdmin(user) &&
                        <div className="mt-2 text-sm font-mono" style={{ maxHeight: '400px', overflow: 'auto' }}>
                            {displayData
                                .filter(item => item.year >= startYear && item.year <= endYear)
                                .sort((a, b) => a.year - b.year || (a.language_name || '').localeCompare(b.language_name || ''))
                                .map((item, index) => (
                                    <div key={index}>
                                        {item.year} | {item.language_name || 'Tuntematon'} | {item.count}
                                    </div>
                                ))
                            }
                        </div>
                    }
                </details>
            </Card>
        </div>
    );
};
