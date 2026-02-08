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
import { WorksByYearChart } from './works-by-year-chart';

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend
);

interface PersonCount {
    id: number | null;
    name: string;
    alt_name: string | null;
    nationality: string | null;
    genres: { [genre: string]: { [role: string]: number } };
    total: number;
}

interface NationalityCount {
    nationality_id: number | null;
    nationality: string | null;
    genres: { [genre: string]: { [role: string]: number } };
    count: number;
}

interface YearCount {
    year: number;
    count: number;
    language_id: number | null;
    language_name: string | null;
}

interface Role {
    id: number;
    name: string;
}

interface AuthorChartProps {
    finnishEditionData: YearCount[];
    originalYearData: YearCount[];
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

// Capitalize first letter of role name for display
const capitalizeFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

// Colors for nationality pie chart
const nationalityColors = [
    '#0958D7', '#D30031', '#DAA520', '#31572C', '#7B2D8E',
    '#E67E22', '#E91E63', '#17A2B8', '#FF696D', '#82C341',
    '#6C757D', '#9C27B0', '#00BCD4', '#FF5722', '#795548',
    '#607D8B', '#3F51B5', '#009688', '#CDDC39', '#FFC107',
];

export const AuthorChart = ({ finnishEditionData, originalYearData }: AuthorChartProps) => {
    const [selectedGenre, setSelectedGenre] = useState<string>('all');
    const [selectedRole, setSelectedRole] = useState<number>(1);
    const [authorCount, setAuthorCount] = useState<number>(10);
    const [nationalityGenre, setNationalityGenre] = useState<string>('all');
    const [nationalityRole, setNationalityRole] = useState<string>('kirjoittaja');
    const user = useMemo(() => getCurrenUser(), []);

    // Fetch roles from API
    const rolesQuery = useQuery<Role[]>({
        queryKey: ['roles'],
        queryFn: async () => {
            const response = await getApiContent('roles/', user);
            return response.data;
        }
    });

    // Roles to exclude (only used for magazine issues, not works/editions)
    const excludedRoles = ['päätoimittaja'];

    // Create role options from API data
    const roleOptions = useMemo(() => {
        if (!rolesQuery.data) return [];
        return rolesQuery.data
            .filter(role => !excludedRoles.includes(role.name.toLowerCase()))
            .map(role => ({
                label: capitalizeFirst(role.name),
                value: role.id
            }));
    }, [rolesQuery.data]);

    // Create nationality role options (uses role names as values, normalized to lowercase)
    const nationalityRoleOptions = useMemo(() => {
        const options = [{ label: 'Kaikki roolit', value: 'all' }];
        if (rolesQuery.data) {
            rolesQuery.data
                .filter(role => !excludedRoles.includes(role.name.toLowerCase()))
                .forEach(role => {
                    options.push({
                        label: capitalizeFirst(role.name),
                        value: role.name.toLowerCase()
                    });
                });
        } else {
            // Fallback option while loading
            options.push({ label: 'Kirjoittaja', value: 'kirjoittaja' });
        }
        return options;
    }, [rolesQuery.data]);

    // Fetch nationality data (person counts per nationality)
    const nationalityQuery = useQuery<NationalityCount[]>({
        queryKey: ['stats', 'nationalitycounts'],
        queryFn: async () => {
            const response = await getApiContent('stats/nationalitycounts', user);
            return response.data;
        }
    });

    // Fetch author data with count, genre and role parameters (for top authors list)
    const authorQuery = useQuery<PersonCount[]>({
        queryKey: ['stats', 'personcounts', authorCount, selectedGenre, selectedRole],
        queryFn: async () => {
            const genreParam = selectedGenre !== 'all' ? `&genre=${selectedGenre}` : '';
            const response = await getApiContent(`stats/personcounts?count=${authorCount}&role=${selectedRole}${genreParam}`, user);
            return response.data;
        }
    });

    // Filter authors (exclude "Muut" aggregation)
    const authors = useMemo(() => {
        if (!authorQuery.data) return [];
        return authorQuery.data.filter(author => author.name !== 'Muut');
    }, [authorQuery.data]);

    // Helper to get count for a genre (sum of all roles)
    const getGenreCount = (genres: { [genre: string]: { [role: string]: number } }, genre: string): number => {
        const genreData = genres[genre];
        if (!genreData) return 0;
        return Object.values(genreData).reduce((sum, count) => sum + count, 0);
    };

    // Process authors with count field
    const allAuthors = useMemo(() => {
        return [...authors]
            .map(author => ({
                ...author,
                count: selectedGenre === 'all' ? author.total : getGenreCount(author.genres, selectedGenre)
            }))
            .filter(author => author.count > 0)
            .sort((a, b) => b.count - a.count);
    }, [authors, selectedGenre]);

    // Get person count for nationality based on genre/role filters
    const getNationalityCount = (item: NationalityCount): number => {
        if (nationalityGenre === 'all' && nationalityRole === 'all') {
            return item.count;
        }

        // API returns capitalized role names, so we need to capitalize our lookup key
        const roleKey = capitalizeFirst(nationalityRole);

        let personCount = 0;
        if (nationalityGenre === 'all') {
            // All genres, specific role
            Object.values(item.genres).forEach(roles => {
                personCount += roles[roleKey] || 0;
            });
        } else if (nationalityRole === 'all') {
            // Specific genre, all roles
            const genreData = item.genres[nationalityGenre];
            if (genreData) {
                personCount = Object.values(genreData).reduce((sum, count) => sum + count, 0);
            }
        } else {
            // Specific genre and role
            const genreData = item.genres[nationalityGenre];
            if (genreData) {
                personCount = genreData[roleKey] || 0;
            }
        }
        return personCount;
    };

    // Nationality data with genre/role filtering
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
    }, [nationalityQuery.data, nationalityGenre, nationalityRole]);

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

    const countTemplate = (rowData: any) => {
        return rowData.count.toLocaleString('fi-FI');
    };

    const nameTemplate = (rowData: PersonCount) => {
        const displayName = rowData.alt_name || rowData.name;
        if (rowData.id) {
            return <a href={`/people/${rowData.id}`}>{displayName}</a>;
        }
        return displayName;
    };

    const getRoleName = (roleId: number) => {
        const role = roleOptions.find(r => r.value === roleId);
        return role ? role.label.toLowerCase() : 'kirjoittaja';
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
                            options={nationalityRoleOptions}
                            optionLabel="label"
                            optionValue="value"
                            onChange={(e) => setNationalityRole(e.value)}
                            className="w-auto"
                        />
                        <Dropdown
                            value={nationalityGenre}
                            options={genreOptions}
                            optionLabel="label"
                            optionValue="value"
                            onChange={(e) => setNationalityGenre(e.value)}
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

            {/* Top N authors list */}
            <div className="col-12 lg:col-6">
                <Card className="shadow-2 h-full">
                    <h3 className="mt-0 mb-3 text-center">Tuotteliaimmat henkilöt (Top {authorCount})</h3>
                    <div className="flex justify-content-center align-items-center gap-3 mb-3 flex-wrap">
                        <Dropdown
                            value={selectedRole}
                            options={roleOptions}
                            optionLabel="label"
                            optionValue="value"
                            onChange={(e) => setSelectedRole(e.value)}
                            className="w-auto"
                        />
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
                            <Column field="name" header={getRoleName(selectedRole).charAt(0).toUpperCase() + getRoleName(selectedRole).slice(1)} body={nameTemplate} />
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
                                <Column field="count" header="Henkilöitä" body={(rowData: any) => rowData.count.toLocaleString('fi-FI')} style={{ width: '100px', textAlign: 'right' }} sortable />
                            </DataTable>
                        </div>
                    </details>
                </Card>
            </div>

            {/* Works by year chart - full width at bottom */}
            <div className="col-12">
                <WorksByYearChart
                    finnishEditionData={finnishEditionData}
                    originalYearData={originalYearData}
                />
            </div>
        </div>
    );
};
