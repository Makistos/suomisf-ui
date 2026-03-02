import { useMemo, useState } from 'react';
import { Card } from 'primereact/card';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { ProgressSpinner } from 'primereact/progressspinner';
import { SelectButton } from 'primereact/selectbutton';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useQuery } from '@tanstack/react-query';
import { getApiContent } from '../../../services/user-service';
import { getCurrenUser } from '../../../services/auth-service';
import { WorkList } from '../../work/components/work-list';
import { Work } from '../../work/types';
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
    const user = useMemo(() => getCurrenUser(), []);

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
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
    const [dialogVisible, setDialogVisible] = useState<boolean>(false);
    const [dialogFilter, setDialogFilter] = useState<{ year: number; language: string; languageId: number; dataSource: 'finnish' | 'original' } | null>(null);

    // Generate year options for dropdowns
    const yearOptions = useMemo(() => {
        const options = [];
        for (let year = minYear; year <= maxYear; year++) {
            options.push({ label: String(year), value: year });
        }
        return options;
    }, [minYear, maxYear]);

    // Build language ID lookup from data
    const languageIdMap = useMemo(() => {
        const map = new Map<string, number>();
        [...finnishEditionData, ...originalYearData].forEach(item => {
            if (item.language_name && item.language_id !== null) {
                map.set(item.language_name, item.language_id);
            }
        });
        return map;
    }, [finnishEditionData, originalYearData]);

    // Get language ID from name
    const getLanguageId = (languageName: string): number | null => {
        return languageIdMap.get(languageName) ?? null;
    };

    // Fetch filtered works for the dialog
    const filteredWorksQuery = useQuery<Work[]>({
        queryKey: ['stats', 'filterworks', dialogFilter?.languageId, dialogFilter?.year, dialogFilter?.dataSource],
        queryFn: async () => {
            if (!dialogFilter) return [];
            const params = new URLSearchParams();
            if (dialogFilter.languageId) params.append('language', String(dialogFilter.languageId));
            if (dialogFilter.dataSource === 'finnish') {
                params.append('edition_year_min', String(dialogFilter.year));
                params.append('edition_year_max', String(dialogFilter.year));
            } else {
                params.append('orig_year_min', String(dialogFilter.year));
                params.append('orig_year_max', String(dialogFilter.year));
            }
            const response = await getApiContent(`stats/filterworks?${params.toString()}`, user);
            return response.data;
        },
        enabled: dialogVisible && dialogFilter !== null
    });

    // Open dialog with filtered works
    const openWorksDialog = (year: number, language: string) => {
        const languageId = getLanguageId(language);
        if (languageId !== null) {
            setDialogFilter({ year, language, languageId, dataSource: dataSource === 'comparison' ? 'finnish' : dataSource });
            setDialogVisible(true);
        }
    };

    // Get the active data based on selection
    const activeData = useMemo(() => {
        if (dataSource === 'finnish') return finnishEditionData;
        if (dataSource === 'original') return originalYearData;
        return finnishEditionData; // For comparison, we handle both datasets separately
    }, [dataSource, finnishEditionData, originalYearData]);

    const chartData = useMemo(() => {
        // Filter data by year range and language
        const filterData = (data: YearCount[]) => data.filter(item =>
            item.year >= startYear && item.year <= endYear &&
            (selectedLanguages.length === 0 || selectedLanguages.includes(item.language_name || ''))
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
    }, [activeData, finnishEditionData, originalYearData, startYear, endYear, viewMode, dataSource, selectedLanguages]);

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
                mode: 'y' as const,
                intersect: false,
                filter: (tooltipItem: any) => tooltipItem.parsed.x > 0,
                callbacks: {
                    label: (context: any) => {
                        return `${context.dataset.label}: ${context.parsed.x.toLocaleString('fi-FI')} teosta`;
                    },
                    footer: (tooltipItems: any[]) => {
                        const total = tooltipItems.reduce((sum, item) => sum + item.parsed.x, 0);
                        return `Yhteensä: ${total.toLocaleString('fi-FI')} teosta`;
                    }
                }
            }
        },
        scales: {
            x: {
                position: 'top' as const,
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

    // Create grouped data for the table with language breakdown
    const tableData = useMemo(() => {
        const filterData = (data: YearCount[]) => data.filter(item =>
            item.year >= startYear && item.year <= endYear &&
            (selectedLanguages.length === 0 || selectedLanguages.includes(item.language_name || ''))
        );

        interface TableRow {
            year: string;
            count: number;
            languages?: { language: string; count: number }[];
        }

        if (dataSource === 'comparison') {
            // For comparison, combine both datasets (no language breakdown)
            const grouped: Record<string, number> = {};
            const finnishFiltered = filterData(finnishEditionData);
            const originalFiltered = filterData(originalYearData);
            [...finnishFiltered, ...originalFiltered].forEach(item => {
                if (item.year) {
                    const key = viewMode === 'decade'
                        ? `${Math.floor(item.year / 10) * 10}-luku`
                        : String(item.year);
                    grouped[key] = (grouped[key] || 0) + item.count;
                }
            });

            return Object.entries(grouped)
                .map(([year, count]): TableRow => ({ year, count }))
                .sort((a, b) => parseInt(a.year) - parseInt(b.year));
        }

        // Single dataset mode with language breakdown
        const groupedWithLanguages: Record<string, Record<string, number>> = {};
        const filteredData = filterData(activeData);

        filteredData.forEach(item => {
            if (item.year && item.language_name) {
                const key = viewMode === 'decade'
                    ? `${Math.floor(item.year / 10) * 10}-luku`
                    : String(item.year);

                if (!groupedWithLanguages[key]) {
                    groupedWithLanguages[key] = {};
                }
                groupedWithLanguages[key][item.language_name] =
                    (groupedWithLanguages[key][item.language_name] || 0) + item.count;
            }
        });

        return Object.entries(groupedWithLanguages)
            .map(([year, langCounts]): TableRow => {
                const languages = Object.entries(langCounts)
                    .map(([language, count]) => ({ language, count }))
                    .sort((a, b) => b.count - a.count);
                const total = languages.reduce((sum, l) => sum + l.count, 0);
                return {
                    year,
                    count: total,
                    languages
                };
            })
            .sort((a, b) => parseInt(a.year) - parseInt(b.year));
    }, [activeData, finnishEditionData, originalYearData, startYear, endYear, viewMode, dataSource, selectedLanguages]);

    // State for expanded rows
    const [expandedRows, setExpandedRows] = useState<any>(null);

    // Row expansion template for language breakdown
    const rowExpansionTemplate = (data: { year: string; count: number; languages?: { language: string; count: number }[] }) => {
        if (!data.languages || data.languages.length === 0) return null;
        const yearNum = parseInt(data.year);
        return (
            <div className="p-3">
                <DataTable value={data.languages} size="small">
                    <Column
                        field="language"
                        header="Kieli"
                        body={(rowData: { language: string; count: number }) => (
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    openWorksDialog(yearNum, rowData.language);
                                }}
                                className="text-primary cursor-pointer"
                            >
                                {rowData.language}
                            </a>
                        )}
                    />
                    <Column
                        field="count"
                        header="Teoksia"
                        body={(rowData: { language: string; count: number }) => rowData.count.toLocaleString('fi-FI')}
                        style={{ width: '100px', textAlign: 'right' }}
                    />
                </DataTable>
            </div>
        );
    };

    // Check if we should show expandable rows (more than one unique language across all data)
    const hasMultipleLanguages = useMemo(() => {
        const allLanguages = new Set<string>();
        tableData.forEach(row => {
            row.languages?.forEach(l => allLanguages.add(l.language));
        });
        return allLanguages.size > 1;
    }, [tableData]);

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
                        <label>Kielet:</label>
                        <MultiSelect
                            value={selectedLanguages}
                            options={languageOptions}
                            optionLabel="label"
                            optionValue="value"
                            onChange={(e) => setSelectedLanguages(e.value)}
                            placeholder="Kaikki kielet"
                            className="w-auto"
                            display="chip"
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
                    <summary className="cursor-pointer text-500">Näytä data ({tableData.length} {viewMode === 'decade' ? 'vuosikymmentä' : 'vuotta'})</summary>
                    <div className="mt-3">
                        <DataTable
                            value={tableData}
                            stripedRows
                            size="small"
                            paginator
                            rows={25}
                            rowsPerPageOptions={[25, 50, 100]}
                            expandedRows={expandedRows}
                            onRowToggle={(e) => setExpandedRows(e.data)}
                            rowExpansionTemplate={hasMultipleLanguages ? rowExpansionTemplate : undefined}
                            dataKey="year"
                        >
                            {hasMultipleLanguages && <Column expander style={{ width: '3rem' }} />}
                            <Column field="year" header={viewMode === 'decade' ? 'Vuosikymmen' : 'Vuosi'} sortable />
                            <Column field="count" header="Teoksia" body={(rowData: { year: string; count: number }) => rowData.count.toLocaleString('fi-FI')} style={{ width: '100px', textAlign: 'right' }} sortable />
                        </DataTable>
                    </div>
                </details>
            </Card>

            {/* Dialog for filtered works */}
            <Dialog
                header={dialogFilter ? `${dialogFilter.language} (${dialogFilter.year}) - ${dialogFilter.dataSource === 'finnish' ? 'Suomenkielinen painos' : 'Alkuperäinen kirjoitusvuosi'}` : ''}
                visible={dialogVisible}
                onHide={() => setDialogVisible(false)}
                style={{ width: '80vw', maxHeight: '90vh' }}
                maximizable
            >
                {filteredWorksQuery.isLoading ? (
                    <div className="flex justify-content-center p-4">
                        <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                    </div>
                ) : filteredWorksQuery.data && filteredWorksQuery.data.length > 0 ? (
                    <WorkList works={filteredWorksQuery.data} />
                ) : (
                    <p className="text-500">Ei tuloksia</p>
                )}
            </Dialog>
        </div>
    );
};
