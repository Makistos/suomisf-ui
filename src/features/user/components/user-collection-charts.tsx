import { Chart } from "primereact/chart";
import { Dialog } from "primereact/dialog";
import { ProgressSpinner } from "primereact/progressspinner";
import { ChartData } from "chart.js/index";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getApiContent } from "@services/user-service";
import { getCurrenUser } from "@services/auth-service";
import { getGenreColors } from "../../genre";
import { WorksByYearChart } from "../../stats/components/works-by-year-chart";
import { WorkList } from "@features/work/components/work-list";
import { Work } from "@features/work/types";

export type GenreData = {
    id: number
    abbr: string
    name: string
    count: number
}

export interface DistItem {
    id?: number;
    name: string;
    count: number;
}

export interface YearCount {
    year: number;
    count: number;
    language_id: number | null;
    language_name: string | null;
}

export interface CollectionComposition {
    publisher_distribution: DistItem[];
    language_distribution: DistItem[];
    worktype_distribution: DistItem[];
    short_story_count: number;
    total_pages: number;
    shelf_width_meters: number;
    editions_by_year: YearCount[];
    origworks_by_year: YearCount[];
}

const PALETTE = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899',
    '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#94a3b8',
];

interface UserCollectionChartsProps {
    userId: string;
    genreData: GenreData[];
    comp: CollectionComposition | null;
    // Query param used on stats/filterworks drill-down requests: "owner"
    // for the owned collection, "read" for works marked read.
    filterParam: 'owner' | 'read';
}

export const UserCollectionCharts = ({ userId, genreData, comp, filterParam }: UserCollectionChartsProps) => {
    const user = useMemo(() => getCurrenUser(), []);
    const [languageDialogFilter, setLanguageDialogFilter] = useState<DistItem | null>(null);
    const [worktypeDialogFilter, setWorktypeDialogFilter] = useState<DistItem | null>(null);
    const [genreDialogFilter, setGenreDialogFilter] = useState<GenreData | null>(null);

    const genres = useMemo<ChartData>(() => ({
        labels: genreData.map(g => g.name + ' (' + g.count + ')'),
        datasets: [{
            data: genreData.map(g => g.count),
            backgroundColor: getGenreColors(genreData.map(g => g.abbr)),
        }],
    }), [genreData]);

    const genreChartOptions = useMemo(() => ({
        plugins: {
            legend: {
                position: 'right' as const,
                labels: { boxWidth: 12, font: { size: 11 } },
                onClick: (_event: unknown, legendItem: { index?: number }) => {
                    const item = genreData[legendItem.index ?? -1];
                    if (item?.id) {
                        setGenreDialogFilter(item);
                    }
                },
            },
        },
        responsive: true,
        maintainAspectRatio: false,
    }), [genreData]);

    const genreWorksQuery = useQuery<Work[]>({
        queryKey: ['user', userId, filterParam, 'stats', 'filterworks', 'genre', genreDialogFilter?.id],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append(filterParam, userId);
            params.append('genre', String(genreDialogFilter?.id));
            const response = await getApiContent(`stats/filterworks?${params.toString()}`, user);
            return response.data;
        },
        enabled: genreDialogFilter !== null
    });

    const doughnutData = (items?: DistItem[]) => {
        if (!items || items.length === 0) return null;
        return {
            labels: items.map(i => `${i.name} (${i.count})`),
            datasets: [{
                data: items.map(i => i.count),
                backgroundColor: items.map((_, i) => PALETTE[i % PALETTE.length]),
                borderWidth: 0,
            }],
        };
    };
    const doughnutOptions = {
        plugins: {
            legend: {
                position: 'right' as const,
                labels: { boxWidth: 12, font: { size: 11 } },
            },
        },
        responsive: true,
        maintainAspectRatio: false,
    };

    const langChartData = useMemo(() => doughnutData(comp?.language_distribution),
        [comp?.language_distribution]);
    const typeChartData = useMemo(() => doughnutData(comp?.worktype_distribution),
        [comp?.worktype_distribution]);

    const langChartOptions = useMemo(() => ({
        ...doughnutOptions,
        plugins: {
            legend: {
                ...doughnutOptions.plugins.legend,
                onClick: (_event: unknown, legendItem: { index?: number }) => {
                    const item = comp?.language_distribution?.[legendItem.index ?? -1];
                    if (item?.id) {
                        setLanguageDialogFilter(item);
                    }
                },
            },
        },
    }), [comp?.language_distribution]);

    const languageWorksQuery = useQuery<Work[]>({
        queryKey: ['user', userId, filterParam, 'stats', 'filterworks', 'language', languageDialogFilter?.id],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append(filterParam, userId);
            params.append('language', String(languageDialogFilter?.id));
            const response = await getApiContent(`stats/filterworks?${params.toString()}`, user);
            return response.data;
        },
        enabled: languageDialogFilter !== null
    });

    const typeChartOptions = useMemo(() => ({
        ...doughnutOptions,
        plugins: {
            legend: {
                ...doughnutOptions.plugins.legend,
                onClick: (_event: unknown, legendItem: { index?: number }) => {
                    const item = comp?.worktype_distribution?.[legendItem.index ?? -1];
                    if (item?.id) {
                        setWorktypeDialogFilter(item);
                    }
                },
            },
        },
    }), [comp?.worktype_distribution]);

    const worktypeWorksQuery = useQuery<Work[]>({
        queryKey: ['user', userId, filterParam, 'stats', 'filterworks', 'worktype', worktypeDialogFilter?.id],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append(filterParam, userId);
            params.append('worktype', String(worktypeDialogFilter?.id));
            const response = await getApiContent(`stats/filterworks?${params.toString()}`, user);
            return response.data;
        },
        enabled: worktypeDialogFilter !== null
    });

    const pubChartData = useMemo(() => {
        const d = comp?.publisher_distribution?.slice(0, 10);
        if (!d || d.length === 0) return null;
        return {
            labels: d.map(p => p.name),
            datasets: [{
                label: 'Kirjoja',
                data: d.map(p => p.count),
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
                borderRadius: 4,
            }],
        };
    }, [comp?.publisher_distribution]);
    const pubChartOptions = {
        indexAxis: 'y' as const,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
        responsive: true,
        maintainAspectRatio: false,
    };

    const hasGenres = genreData.length > 0;

    return (
        <div className="flex flex-column gap-4">
            {/* Miscellaneous counts */}
            {comp && comp.total_pages > 0 && (
                <div className="grid">
                    <div className="col-6 md:col-3">
                        <div className="text-600 text-sm mb-1">Novelleja kokoelmissa</div>
                        <div className="text-2xl font-bold">
                            {comp.short_story_count.toLocaleString('fi-FI')}
                        </div>
                    </div>
                    <div className="col-6 md:col-3">
                        <div className="text-600 text-sm mb-1">Sivuja yhteensä</div>
                        <div className="text-2xl font-bold">
                            {comp.total_pages.toLocaleString('fi-FI')}
                        </div>
                    </div>
                    <div className="col-6 md:col-3">
                        <div className="text-600 text-sm mb-1">Hyllynleveys</div>
                        <div className="text-2xl font-bold">
                            {comp.shelf_width_meters.toLocaleString('fi-FI')} m
                        </div>
                    </div>
                </div>
            )}

            {/* Genres */}
            {hasGenres && (
                <div>
                    <div className="text-600 text-sm mb-2">Genret</div>
                    <div style={{ height: '320px' }}>
                        <Chart type="pie" data={genres} options={genreChartOptions} style={{ height: '100%' }} />
                    </div>
                </div>
            )}

            {/* Publishers */}
            {pubChartData && (
                <div>
                    <div className="text-600 text-sm mb-2">Kustantajat (10 yleisintä)</div>
                    <div style={{ height: '260px' }}>
                        <Chart type="bar" data={pubChartData} options={pubChartOptions} style={{ height: '100%' }} />
                    </div>
                </div>
            )}

            {/* Original language + work type */}
            <div className="grid">
                {langChartData && (
                    <div className="col-12 md:col-6">
                        <div className="text-600 text-sm mb-2">Alkukieli</div>
                        <div style={{ height: '220px' }}>
                            <Chart type="doughnut" data={langChartData} options={langChartOptions} style={{ height: '100%' }} />
                        </div>
                    </div>
                )}
                {typeChartData && (
                    <div className="col-12 md:col-6">
                        <div className="text-600 text-sm mb-2">Teostyypit</div>
                        <div style={{ height: '220px' }}>
                            <Chart type="doughnut" data={typeChartData} options={typeChartOptions} style={{ height: '100%' }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Publications per year */}
            {comp && comp.editions_by_year.length > 0 && (
                <WorksByYearChart
                    finnishEditionData={comp.editions_by_year}
                    originalYearData={comp.origworks_by_year}
                    ownerId={filterParam === 'owner' ? userId : undefined}
                    readUserId={filterParam === 'read' ? userId : undefined}
                />
            )}

            {/* Dialog for works filtered by original language */}
            <Dialog
                header={languageDialogFilter ? `${languageDialogFilter.name} (${languageDialogFilter.count})` : ''}
                visible={languageDialogFilter !== null}
                onHide={() => setLanguageDialogFilter(null)}
                style={{ width: '80vw', maxHeight: '90vh' }}
                maximizable
            >
                {languageWorksQuery.isLoading ? (
                    <div className="flex justify-content-center p-4">
                        <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                    </div>
                ) : languageWorksQuery.data && languageWorksQuery.data.length > 0 ? (
                    <WorkList works={languageWorksQuery.data} />
                ) : (
                    <p className="text-500">Ei tuloksia</p>
                )}
            </Dialog>

            {/* Dialog for works filtered by work type */}
            <Dialog
                header={worktypeDialogFilter ? `${worktypeDialogFilter.name} (${worktypeDialogFilter.count})` : ''}
                visible={worktypeDialogFilter !== null}
                onHide={() => setWorktypeDialogFilter(null)}
                style={{ width: '80vw', maxHeight: '90vh' }}
                maximizable
            >
                {worktypeWorksQuery.isLoading ? (
                    <div className="flex justify-content-center p-4">
                        <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                    </div>
                ) : worktypeWorksQuery.data && worktypeWorksQuery.data.length > 0 ? (
                    <WorkList works={worktypeWorksQuery.data} />
                ) : (
                    <p className="text-500">Ei tuloksia</p>
                )}
            </Dialog>

            {/* Dialog for works filtered by genre */}
            <Dialog
                header={genreDialogFilter ? `${genreDialogFilter.name} (${genreDialogFilter.count})` : ''}
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
