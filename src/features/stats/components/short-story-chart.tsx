import { useMemo, useState } from 'react';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
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
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { getApiContent } from '../../../services/user-service';
import { getCurrenUser } from '../../../services/auth-service';

ChartJS.register(
    ArcElement,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface StoryPersonCount {
    id: number | null;
    name: string;
    alt_name: string | null;
    nationality: string | null;
    storytypes: { [storytype: string]: { [role: string]: number } };
    total: number;
}

interface StoryNationalityCount {
    nationality_id: number | null;
    nationality: string | null;
    storytypes: { [storytype: string]: { [role: string]: number } };
    count: number;
}

interface StoryYearCount {
    year: number;
    count: number;
    storytype_id: number | null;
    storytype_name: string | null;
    language_id: number | null;
    language_name: string | null;
}

// Role options for short stories
const storyRoleOptions = [
    { label: 'Kaikki roolit', value: 'all' },
    { label: 'Kirjoittaja', value: 'kirjoittaja' },
    { label: 'Kääntäjä', value: 'kääntäjä' },
    { label: 'Esiintyy', value: 'esiintyy' },
];

// Role options for API (uses role IDs)
const storyRoleIdOptions = [
    { label: 'Kirjoittaja', value: 1 },
    { label: 'Kääntäjä', value: 2 },
    { label: 'Esiintyy', value: 6 },
];

// Story type options
const storyTypeOptions = [
    { label: 'Kaikki tyypit', value: 'all' },
    { label: 'Novelli', value: 'novelli' },
    { label: 'Kertomus', value: 'kertomus' },
    { label: 'Runo', value: 'runo' },
    { label: 'Raapale', value: 'raapale' },
    { label: 'Essee', value: 'essee' },
    { label: 'Artikkeli', value: 'artikkeli' },
];

// Story type options for API (uses IDs)
const storyTypeIdOptions = [
    { label: 'Novelli', value: 1 },
    { label: 'Kertomus', value: 2 },
    { label: 'Runo', value: 3 },
    { label: 'Raapale', value: 4 },
    { label: 'Essee', value: 5 },
    { label: 'Artikkeli', value: 6 },
];

// Capitalize first letter
const capitalizeFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

// Colors for nationality pie chart
const nationalityColors = [
    '#0958D7', '#D30031', '#DAA520', '#31572C', '#7B2D8E',
    '#E67E22', '#E91E63', '#17A2B8', '#FF696D', '#82C341',
    '#6C757D', '#9C27B0', '#00BCD4', '#FF5722', '#795548',
    '#607D8B', '#3F51B5', '#009688', '#CDDC39', '#FFC107',
];

// Colors for year chart
const yearChartColor = '#0958D7';

export const ShortStoryChart = () => {
    const [selectedRole, setSelectedRole] = useState<number>(1);
    const [selectedStoryType, setSelectedStoryType] = useState<number>(1);
    const [personCount, setPersonCount] = useState<number>(10);
    const [nationalityRole, setNationalityRole] = useState<string>('kirjoittaja');
    const [nationalityStoryType, setNationalityStoryType] = useState<string>('novelli');
    const [yearChartStoryType, setYearChartStoryType] = useState<string>('all');
    const [yearChartLanguages, setYearChartLanguages] = useState<number[]>([]);
    const user = useMemo(() => getCurrenUser(), []);

    // Fetch nationality data for short stories
    const nationalityQuery = useQuery<StoryNationalityCount[]>({
        queryKey: ['stats', 'storynationalitycounts'],
        queryFn: async () => {
            const response = await getApiContent('stats/storynationalitycounts', user);
            return response.data;
        }
    });

    // Fetch person data for short stories
    const personQuery = useQuery<StoryPersonCount[]>({
        queryKey: ['stats', 'storypersoncounts', personCount, selectedRole, selectedStoryType],
        queryFn: async () => {
            const response = await getApiContent(`stats/storypersoncounts?count=${personCount}&role=${selectedRole}&storytype=${selectedStoryType}`, user);
            return response.data;
        }
    });

    // Fetch short stories by year
    const storiesByYearQuery = useQuery<StoryYearCount[]>({
        queryKey: ['stats', 'storiesbyyear'],
        queryFn: async () => {
            const response = await getApiContent('stats/storiesbyyear', user);
            return response.data;
        }
    });

    // Filter persons (exclude "Muut" aggregation)
    const persons = useMemo(() => {
        if (!personQuery.data) return [];
        return personQuery.data.filter(person => person.name !== 'Muut');
    }, [personQuery.data]);

    // Process persons with count field
    const allPersons = useMemo(() => {
        return [...persons]
            .map(person => ({
                ...person,
                count: person.total
            }))
            .filter(person => person.count > 0)
            .sort((a, b) => b.count - a.count);
    }, [persons]);

    // Get person count for nationality based on story type and role filters
    const getNationalityCount = (item: StoryNationalityCount): number => {
        if (nationalityStoryType === 'all' && nationalityRole === 'all') {
            return item.count;
        }

        // API returns capitalized keys, so we need to capitalize our lookup keys
        const roleKey = capitalizeFirst(nationalityRole);
        const storyTypeKey = capitalizeFirst(nationalityStoryType);

        let personCount = 0;
        if (nationalityStoryType === 'all') {
            // All story types, specific role
            Object.values(item.storytypes).forEach(roles => {
                personCount += roles[roleKey] || 0;
            });
        } else if (nationalityRole === 'all') {
            // Specific story type, all roles
            const storyTypeData = item.storytypes[storyTypeKey];
            if (storyTypeData) {
                personCount = Object.values(storyTypeData).reduce((sum, count) => sum + count, 0);
            }
        } else {
            // Specific story type and role
            const storyTypeData = item.storytypes[storyTypeKey];
            if (storyTypeData) {
                personCount = storyTypeData[roleKey] || 0;
            }
        }
        return personCount;
    };

    // Nationality data with story type and role filtering
    const allNationalities = useMemo(() => {
        if (!nationalityQuery.data) return [];
        return nationalityQuery.data
            .filter(item => item.nationality !== null)
            .map(item => ({
                nationality: item.nationality!,
                count: getNationalityCount(item)
            }))
            .filter(item => item.count > 0)
            .sort((a, b) => b.count - a.count);
    }, [nationalityQuery.data, nationalityStoryType, nationalityRole]);

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

    const nationalityChartOptions = useMemo(() => ({
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
                        return `${context.label}: ${context.parsed.toLocaleString('fi-FI')} henkilöä`;
                    }
                }
            }
        }
    }), []);

    // Extract unique languages from year data for MultiSelect options
    const languageOptions = useMemo(() => {
        if (!storiesByYearQuery.data) return [];
        const languageMap = new Map<number, string>();
        storiesByYearQuery.data.forEach(item => {
            if (item.language_id !== null && item.language_name !== null) {
                languageMap.set(item.language_id, item.language_name);
            }
        });
        return Array.from(languageMap.entries())
            .map(([id, name]) => ({ label: name, value: id }))
            .sort((a, b) => a.label.localeCompare(b.label, 'fi-FI'));
    }, [storiesByYearQuery.data]);

    // Year chart data with filtering
    const yearChartData = useMemo(() => {
        if (!storiesByYearQuery.data) return null;

        // Filter by story type and languages
        let filteredData = storiesByYearQuery.data;

        if (yearChartStoryType !== 'all') {
            filteredData = filteredData.filter(item =>
                item.storytype_name?.toLowerCase() === yearChartStoryType
            );
        }

        if (yearChartLanguages.length > 0) {
            filteredData = filteredData.filter(item =>
                item.language_id !== null && yearChartLanguages.includes(item.language_id)
            );
        }

        // Aggregate counts by year
        const yearCounts = new Map<number, number>();
        filteredData.forEach(item => {
            const currentCount = yearCounts.get(item.year) || 0;
            yearCounts.set(item.year, currentCount + item.count);
        });

        const sortedData = Array.from(yearCounts.entries())
            .map(([year, count]) => ({ year, count }))
            .sort((a, b) => a.year - b.year);

        if (sortedData.length === 0) return null;

        // Get label based on story type selection
        const storyTypeLabel = yearChartStoryType === 'all'
            ? 'Novelleja'
            : capitalizeFirst(getStoryTypeNamePlural(
                storyTypeIdOptions.find(s => s.label.toLowerCase() === yearChartStoryType)?.value || 1
            ));

        return {
            labels: sortedData.map(item => String(item.year)),
            datasets: [
                {
                    label: storyTypeLabel,
                    data: sortedData.map(item => item.count),
                    backgroundColor: yearChartColor,
                }
            ]
        };
    }, [storiesByYearQuery.data, yearChartStoryType, yearChartLanguages]);

    const yearChartHeight = useMemo(() => {
        if (!yearChartData) return 300;
        return Math.max(300, yearChartData.labels.length * 20 + 80);
    }, [yearChartData]);

    // Get the axis label based on story type
    const yearChartAxisLabel = useMemo(() => {
        if (yearChartStoryType === 'all') return 'Novelleja';
        const storyTypeId = storyTypeIdOptions.find(s => s.label.toLowerCase() === yearChartStoryType)?.value;
        return storyTypeId ? capitalizeFirst(getStoryTypeNamePlural(storyTypeId)) : 'Novelleja';
    }, [yearChartStoryType]);

    const yearChartOptions = useMemo(() => ({
        indexAxis: 'y' as const,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        return `${context.parsed.x.toLocaleString('fi-FI')} kpl`;
                    }
                }
            }
        },
        scales: {
            x: {
                position: 'top' as const,
                title: {
                    display: true,
                    text: yearChartAxisLabel
                }
            },
            y: {
                reverse: true,
            }
        }
    }), [yearChartAxisLabel]);

    const countTemplate = (rowData: any) => {
        return rowData.count.toLocaleString('fi-FI');
    };

    const nameTemplate = (rowData: StoryPersonCount) => {
        const displayName = rowData.alt_name || rowData.name;
        if (rowData.id) {
            return <a href={`/people/${rowData.id}`}>{displayName}</a>;
        }
        return displayName;
    };

    const getRoleName = (roleId: number) => {
        const role = storyRoleIdOptions.find(r => r.value === roleId);
        return role ? role.label.toLowerCase() : 'kirjoittaja';
    };

    const getStoryTypeName = (storyTypeId: number) => {
        const storyType = storyTypeIdOptions.find(s => s.value === storyTypeId);
        return storyType ? storyType.label.toLowerCase() : 'novelli';
    };

    const getStoryTypeNamePlural = (storyTypeId: number) => {
        const name = getStoryTypeName(storyTypeId);
        // Finnish plural forms
        const plurals: { [key: string]: string } = {
            'novelli': 'novelleja',
            'kertomus': 'kertomuksia',
            'runo': 'runoja',
            'raapale': 'raapaleita',
            'essee': 'esseitä',
            'artikkeli': 'artikkeleita',
        };
        return plurals[name] || name;
    };

    return (
        <div className="grid">
            {/* Nationality pie chart */}
            <div className="col-12 lg:col-6">
                <Card className="shadow-2 h-full">
                    <h3 className="mt-0 mb-3 text-center">Kansallisuudet</h3>
                    <div className="flex justify-content-center align-items-center gap-3 mb-3 flex-wrap">
                        <Dropdown
                            value={nationalityRole}
                            options={storyRoleOptions}
                            optionLabel="label"
                            optionValue="value"
                            onChange={(e) => setNationalityRole(e.value)}
                            className="w-auto"
                        />
                        <Dropdown
                            value={nationalityStoryType}
                            options={storyTypeOptions}
                            optionLabel="label"
                            optionValue="value"
                            onChange={(e) => setNationalityStoryType(e.value)}
                            className="w-auto"
                        />
                    </div>
                    {nationalityQuery.isLoading ? (
                        <div className="flex justify-content-center p-4">
                            <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                        </div>
                    ) : nationalityChartData ? (
                        <div style={{ height: '400px' }}>
                            <Pie data={nationalityChartData} options={nationalityChartOptions} />
                        </div>
                    ) : (
                        <p className="text-500 text-center">Ei dataa</p>
                    )}
                </Card>
            </div>

            {/* Top N persons list */}
            <div className="col-12 lg:col-6">
                <Card className="shadow-2 h-full">
                    <h3 className="mt-0 mb-3 text-center">Tuotteliaimmat henkilöt (Top {personCount})</h3>
                    <div className="flex justify-content-center align-items-center gap-3 mb-3 flex-wrap">
                        <Dropdown
                            value={selectedRole}
                            options={storyRoleIdOptions}
                            optionLabel="label"
                            optionValue="value"
                            onChange={(e) => setSelectedRole(e.value)}
                            className="w-auto"
                        />
                        <Dropdown
                            value={selectedStoryType}
                            options={storyTypeIdOptions}
                            optionLabel="label"
                            optionValue="value"
                            onChange={(e) => setSelectedStoryType(e.value)}
                            className="w-auto"
                        />
                        <div className="flex align-items-center gap-2">
                            <span className="text-sm">Määrä: {personCount}</span>
                            <Slider
                                value={personCount}
                                onChange={(e) => setPersonCount(e.value as number)}
                                min={10}
                                max={100}
                                step={10}
                                className="w-8rem"
                            />
                        </div>
                    </div>
                    {personQuery.isLoading ? (
                        <div className="flex justify-content-center p-4">
                            <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                        </div>
                    ) : (
                        <DataTable
                            value={allPersons}
                            stripedRows
                            size="small"
                            scrollable
                            scrollHeight="400px"
                        >
                            <Column field="name" header={capitalizeFirst(getRoleName(selectedRole))} body={nameTemplate} />
                            <Column field="count" header={capitalizeFirst(getStoryTypeNamePlural(selectedStoryType))} body={countTemplate} style={{ width: '100px', textAlign: 'right' }} />
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
                                <Column field="count" header="Henkilöitä" body={(rowData: any) => rowData.count.toLocaleString('fi-FI')} style={{ width: '100px', textAlign: 'right' }} sortable />
                            </DataTable>
                        </div>
                    </details>
                </Card>
            </div>

            {/* Stories by year chart */}
            <div className="col-12">
                <Card className="shadow-2">
                    <h3 className="mt-0 mb-3 text-center">Novellit alkuperäisen kirjoitusvuoden mukaan</h3>
                    <div className="flex justify-content-center align-items-center gap-3 mb-3 flex-wrap">
                        <Dropdown
                            value={yearChartStoryType}
                            options={storyTypeOptions}
                            optionLabel="label"
                            optionValue="value"
                            onChange={(e) => setYearChartStoryType(e.value)}
                            className="w-auto"
                        />
                        <MultiSelect
                            value={yearChartLanguages}
                            options={languageOptions}
                            optionLabel="label"
                            optionValue="value"
                            onChange={(e) => setYearChartLanguages(e.value)}
                            placeholder="Kaikki kielet"
                            className="w-auto"
                            style={{ minWidth: '200px' }}
                            display="chip"
                            filter
                        />
                    </div>
                    {storiesByYearQuery.isLoading ? (
                        <div className="flex justify-content-center p-4">
                            <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                        </div>
                    ) : yearChartData ? (
                        <div style={{ height: `${yearChartHeight}px` }}>
                            <Bar data={yearChartData} options={yearChartOptions} />
                        </div>
                    ) : (
                        <p className="text-500 text-center">Ei dataa</p>
                    )}
                </Card>
            </div>
        </div>
    );
};
