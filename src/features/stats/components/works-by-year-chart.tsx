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

interface PublisherYearCount {
    year: number;
    count: number;
    publisher_id: number;
    publisher_name: string;
}

// Language or publisher rows normalised to one shape.
interface GroupYearCount {
    year: number;
    count: number;
    group_id: number | null;
    group_name: string | null;
}

type GroupBy = 'language' | 'publisher';

interface WorksByYearChartProps {
    finnishEditionData: YearCount[];
    originalYearData: YearCount[];
    // When set, drill-down lists only works owned by this user.
    ownerId?: string;
    // When set, drill-down lists only works this user has marked read.
    // Mutually exclusive with ownerId.
    readUserId?: string;
    // Offer grouping Finnish editions by publisher besides language.
    enablePublisherGrouping?: boolean;
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

// Publishers get colours by rank, as there are far too many to name.
const publisherPalette = [
    '#0958D7', '#D30031', '#DAA520', '#31572C', '#7B2D8E',
    '#E67E22', '#E91E63', '#17A2B8', '#FF696D', '#82C341',
];

// Fixed colours first, then hues spread by the golden angle so that up to
// 50 publishers stay distinguishable.
const publisherColor = (index: number) => index < publisherPalette.length
    ? publisherPalette[index]
    : `hsl(${Math.round((index * 137.508) % 360)}, 60%, ${index % 2 ? 40 : 55}%)`;

// Without an explicit publisher selection, show this many biggest publishers
// and lump the rest into "Muut".
const topPublisherOptions = [10, 20, 30, 50].map(n => ({ label: String(n), value: n }));
const OTHERS_LABEL = 'Muut';

const groupByOptions = [
    { label: 'Kielet', value: 'language' },
    { label: 'Kustantajat', value: 'publisher' },
];

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

const fromLanguage = (data: YearCount[]): GroupYearCount[] => data.map(d => ({
    year: d.year,
    count: d.count,
    group_id: d.language_id,
    group_name: d.language_name,
}));

export const WorksByYearChart = ({ finnishEditionData, originalYearData, ownerId, readUserId, enablePublisherGrouping }: WorksByYearChartProps) => {
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
    const [groupBy, setGroupBy] = useState<GroupBy>('language');
    const [selectedPublishers, setSelectedPublishers] = useState<string[]>([]);
    const [topPublishers, setTopPublishers] = useState<number>(10);
    const [dialogVisible, setDialogVisible] = useState<boolean>(false);
    const [dialogFilter, setDialogFilter] = useState<{ year: number; group: string; groupId: number; groupBy: GroupBy; dataSource: 'finnish' | 'original' } | null>(null);

    const byPublisher = groupBy === 'publisher';
    // Publishers exist only for Finnish editions.
    const effectiveSource = byPublisher ? 'finnish' : dataSource;

    // Fetched only once the publisher grouping is first chosen.
    const publisherQuery = useQuery<PublisherYearCount[]>({
        queryKey: ['stats', 'publishersbyyear'],
        queryFn: async () => {
            const response = await getApiContent('stats/publishersbyyear', user);
            return response.data;
        },
        enabled: !!enablePublisherGrouping && byPublisher,
    });

    const publisherData = useMemo((): GroupYearCount[] => (publisherQuery.data ?? []).map(d => ({
        year: d.year,
        count: d.count,
        group_id: d.publisher_id,
        group_name: d.publisher_name,
    })), [publisherQuery.data]);

    // Publisher picker options, biggest first.
    const publisherOptions = useMemo(() => {
        const totals = new Map<string, number>();
        publisherData.forEach(d => {
            if (d.group_name) totals.set(d.group_name, (totals.get(d.group_name) ?? 0) + d.count);
        });
        return Array.from(totals.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([name]) => ({ label: name, value: name }));
    }, [publisherData]);

    // Generate year options for dropdowns
    const yearOptions = useMemo(() => {
        const options = [];
        for (let year = minYear; year <= maxYear; year++) {
            options.push({ label: String(year), value: year });
        }
        return options;
    }, [minYear, maxYear]);

    // Build language / publisher ID lookups from data
    const groupIdMaps = useMemo(() => {
        const build = (data: GroupYearCount[]) => {
            const map = new Map<string, number>();
            data.forEach(item => {
                if (item.group_name && item.group_id !== null) {
                    map.set(item.group_name, item.group_id);
                }
            });
            return map;
        };
        return {
            language: build(fromLanguage([...finnishEditionData, ...originalYearData])),
            publisher: build(publisherData),
        };
    }, [finnishEditionData, originalYearData, publisherData]);

    // Get language or publisher ID from name
    const getGroupId = (name: string): number | null => {
        return groupIdMaps[groupBy].get(name) ?? null;
    };

    // Fetch filtered works for the dialog
    const filteredWorksQuery = useQuery<Work[]>({
        queryKey: ['stats', 'filterworks', dialogFilter?.groupBy, dialogFilter?.groupId, dialogFilter?.year, dialogFilter?.dataSource, ownerId, readUserId],
        queryFn: async () => {
            if (!dialogFilter) return [];
            const params = new URLSearchParams();
            if (ownerId) params.append('owner', ownerId);
            if (readUserId) params.append('read', readUserId);
            if (dialogFilter.groupBy === 'publisher') {
                params.append('publisher', String(dialogFilter.groupId));
                params.append('publisher_first', '1');
            } else if (dialogFilter.groupId) {
                params.append('language', String(dialogFilter.groupId));
            }
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
    const openWorksDialog = (year: number, group: string) => {
        const groupId = getGroupId(group);
        if (groupId !== null) {
            setDialogFilter({ year, group, groupId, groupBy, dataSource: effectiveSource === 'comparison' ? 'finnish' : effectiveSource });
            setDialogVisible(true);
        }
    };

    // Get the active data based on selection
    const activeData = useMemo((): GroupYearCount[] => {
        if (byPublisher) return publisherData;
        if (dataSource === 'original') return fromLanguage(originalYearData);
        return fromLanguage(finnishEditionData); // For comparison, we handle both datasets separately
    }, [byPublisher, publisherData, dataSource, finnishEditionData, originalYearData]);

    // Active data limited to the year range and group selection. When grouping
    // by publisher without a selection, only the biggest publishers in the range
    // are kept and the rest are summed into "Muut".
    const filteredActiveData = useMemo((): GroupYearCount[] => {
        const selected = byPublisher ? selectedPublishers : selectedLanguages;
        const inRange = activeData.filter(item =>
            item.year >= startYear && item.year <= endYear &&
            (selected.length === 0 || selected.includes(item.group_name || ''))
        );
        if (!byPublisher || selected.length > 0) return inRange;

        const totals = new Map<string, number>();
        inRange.forEach(d => {
            if (d.group_name) totals.set(d.group_name, (totals.get(d.group_name) ?? 0) + d.count);
        });
        const top = new Set(Array.from(totals.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, topPublishers)
            .map(([name]) => name));
        return inRange.map(d => top.has(d.group_name || '')
            ? d
            : { ...d, group_id: null, group_name: OTHERS_LABEL });
    }, [activeData, byPublisher, selectedPublishers, topPublishers, selectedLanguages, startYear, endYear]);

    const chartData = useMemo(() => {
        // Filter data by year range and language
        const filterData = (data: YearCount[]) => data.filter(item =>
            item.year >= startYear && item.year <= endYear &&
            (selectedLanguages.length === 0 || selectedLanguages.includes(item.language_name || ''))
        );

        if (effectiveSource === 'comparison') {
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

        // Single dataset mode with language / publisher breakdown
        const filteredData = filteredActiveData;

        // Group data by year or decade
        const groupedData: Record<string, Record<string, number>> = {};
        const languages = new Set<string>();

        filteredData.forEach(item => {
            if (item.year && item.group_name) {
                const key = viewMode === 'decade'
                    ? `${Math.floor(item.year / 10) * 10}-luku`
                    : String(item.year);

                if (!groupedData[key]) {
                    groupedData[key] = {};
                }

                if (!groupedData[key][item.group_name]) {
                    groupedData[key][item.group_name] = 0;
                }

                groupedData[key][item.group_name] += item.count;
                languages.add(item.group_name);
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
            // "Muut" always goes last
            if (a === OTHERS_LABEL) return 1;
            if (b === OTHERS_LABEL) return -1;
            return totalB - totalA;
        });

        const colorFor = (group: string, index: number) => {
            if (!byPublisher) return languageColors[group] || defaultColor;
            if (group === OTHERS_LABEL) return defaultColor;
            return publisherColor(index);
        };

        const datasets = languageArray.map((language, index) => ({
            label: language,
            data: sortedKeys.map(key => groupedData[key][language] || 0),
            backgroundColor: colorFor(language, index),
        }));

        return {
            labels: sortedKeys,
            datasets,
            keyCount: sortedKeys.length
        };
    }, [filteredActiveData, byPublisher, finnishEditionData, originalYearData, startYear, endYear, viewMode, effectiveSource, selectedLanguages]);

    // Calculate height based on number of bars (20px per bar + padding for legend).
    // Many publishers wrap the legend onto several rows; reserve room for them.
    const legendRows = byPublisher ? Math.ceil(chartData.datasets.length / 6) : 1;
    const chartHeight = Math.max(300, chartData.keyCount * 20 + 60 + legendRows * 20);

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
                stacked: effectiveSource !== 'comparison',
                title: {
                    display: true,
                    text: 'Teoksia'
                }
            },
            y: {
                stacked: effectiveSource !== 'comparison',
                reverse: true,
            }
        }
    }), [effectiveSource]);

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

        if (effectiveSource === 'comparison') {
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

        filteredActiveData.forEach(item => {
            if (item.year && item.group_name) {
                const key = viewMode === 'decade'
                    ? `${Math.floor(item.year / 10) * 10}-luku`
                    : String(item.year);

                if (!groupedWithLanguages[key]) {
                    groupedWithLanguages[key] = {};
                }
                groupedWithLanguages[key][item.group_name] =
                    (groupedWithLanguages[key][item.group_name] || 0) + item.count;
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
    }, [filteredActiveData, finnishEditionData, originalYearData, startYear, endYear, viewMode, effectiveSource, selectedLanguages]);

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
                        header={byPublisher ? 'Kustantaja' : 'Kieli'}
                        body={(rowData: { language: string; count: number }) => rowData.language === OTHERS_LABEL && byPublisher ? rowData.language : (
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
                    {enablePublisherGrouping && (
                        <SelectButton
                            aria-label="Ryhmittely"
                            value={groupBy}
                            options={groupByOptions}
                            optionLabel="label"
                            optionValue="value"
                            allowEmpty={false}
                            onChange={(e) => setGroupBy(e.value)}
                        />
                    )}
                    {!byPublisher && (
                        <SelectButton
                            value={dataSource}
                            options={dataSourceOptions}
                            optionLabel="label"
                            optionValue="value"
                            onChange={(e) => setDataSource(e.value)}
                        />
                    )}
                </div>
                {byPublisher && (
                    <p className="text-sm text-600 mt-0 mb-3">
                        Suomenkieliset painokset. Teos lasketaan kerran kullekin kustantajalle,
                        kustantajan ensimmäisen painoksen vuodelle.
                    </p>
                )}
                <div className="flex justify-content-center align-items-center gap-3 mb-3 flex-wrap">
                    {byPublisher ? (
                    <div className="flex align-items-center gap-2">
                        <label id="wby-publishers">Kustantajat:</label>
                        <MultiSelect
                            aria-labelledby="wby-publishers"
                            value={selectedPublishers}
                            options={publisherOptions}
                            optionLabel="label"
                            optionValue="value"
                            onChange={(e) => setSelectedPublishers(e.value)}
                            placeholder={`${topPublishers} suurinta + muut`}
                            className="w-auto"
                            display="chip"
                            filter
                            loading={publisherQuery.isLoading}
                        />
                        <label id="wby-top-publishers">Suurimmat:</label>
                        <Dropdown
                            aria-labelledby="wby-top-publishers"
                            value={topPublishers}
                            options={topPublisherOptions}
                            optionLabel="label"
                            optionValue="value"
                            onChange={(e) => setTopPublishers(e.value)}
                            disabled={selectedPublishers.length > 0}
                            tooltip={selectedPublishers.length > 0 ? 'Käytössä vain, kun kustantajia ei ole valittu' : undefined}
                            tooltipOptions={{ showOnDisabled: true }}
                            className="w-auto"
                        />
                    </div>
                    ) : (
                    <div className="flex align-items-center gap-2">
                        <label id="wby-languages">Kielet:</label>
                        <MultiSelect
                            aria-labelledby="wby-languages"
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
                    )}
                    <div className="flex align-items-center gap-2">
                        <label>Alku:</label>
                        <Dropdown
                            aria-label="Alkuvuosi"
                            ariaLabel="Alkuvuosi"
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
                            aria-label="Loppuvuosi"
                            ariaLabel="Loppuvuosi"
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
                {byPublisher && publisherQuery.isLoading ? (
                    <div className="flex justify-content-center p-4">
                        <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                    </div>
                ) : (
                <div style={{ height: `${chartHeight}px` }}>
                    <Bar role="img" aria-label="Julkaisut vuosittain" data={chartData} options={chartOptions} />
                </div>
                )}
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
                header={dialogFilter ? `${dialogFilter.group} (${dialogFilter.year}) - ${dialogFilter.groupBy === 'publisher' ? 'Kustantajan ensimmäinen painos' : dialogFilter.dataSource === 'finnish' ? 'Suomenkielinen painos' : 'Alkuperäinen kirjoitusvuosi'}` : ''}
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
