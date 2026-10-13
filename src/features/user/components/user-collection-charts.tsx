import { Chart } from "primereact/chart";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Slider } from "primereact/slider";
import { ProgressSpinner } from "primereact/progressspinner";
import { ChartData } from "chart.js";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getApiContent } from "@services/user-service";
import { getCurrenUser } from "@services/auth-service";
import { getGenreColors } from "../../genre";
import { CollectionYearsCard } from "../../stats/charts/collection-years-card";
import { genreOptions } from "../../stats/charts/palette";
import { WorkList } from "@features/work/components/work-list";
import { Work } from "@features/work/types";

const DOUGHNUT_OPTIONS = {
    plugins: {
        legend: {
            position: 'right' as const,
            labels: { boxWidth: 12, font: { size: 11 } },
        },
    },
    responsive: true,
    maintainAspectRatio: false,
};

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

export interface PublisherDistItem extends DistItem {
    // Counts per genre abbreviation; a book counts in each of its genres.
    genres?: Record<string, number>;
}

export interface YearCount {
    year: number;
    count: number;
    language_id: number | null;
    language_name: string | null;
}

export interface CollectionComposition {
    publisher_distribution: PublisherDistItem[];
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

// Colours for the publisher pie (cycle through these)
const publisherColors = [
    '#0958D7', '#D30031', '#31572C', '#7B2D8E', '#E67E22',
    '#E91E63', '#17A2B8', '#DAA520', '#6C757D', '#82C341',
    '#4A90D9', '#FF696D', '#9B59B6', '#A0522D', '#008B8B',
    '#21D011', '#7EC8E3', '#2C3E50', '#F39C12', '#1ABC9C',
    '#8E44AD', '#C0392B', '#27AE60', '#2980B9', '#D35400',
    '#16A085', '#E74C3C', '#3498DB', '#9B59B6', '#34495E',
];

export const UserCollectionCharts = ({ userId, genreData, comp, filterParam }: UserCollectionChartsProps) => {
    const user = useMemo(() => getCurrenUser(), []);
    const [languageDialogFilter, setLanguageDialogFilter] = useState<DistItem | null>(null);
    const [worktypeDialogFilter, setWorktypeDialogFilter] = useState<DistItem | null>(null);
    const [genreDialogFilter, setGenreDialogFilter] = useState<GenreData | null>(null);
    const [pubGenre, setPubGenre] = useState<string>('all');
    const [pubCount, setPubCount] = useState<number>(10);
    const [publisherDialogFilter, setPublisherDialogFilter] = useState<DistItem | null>(null);

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
    const langChartData = useMemo(() => doughnutData(comp?.language_distribution),
        [comp?.language_distribution]);
    const typeChartData = useMemo(() => doughnutData(comp?.worktype_distribution),
        [comp?.worktype_distribution]);

    const langChartOptions = useMemo(() => ({
        ...DOUGHNUT_OPTIONS,
        plugins: {
            legend: {
                ...DOUGHNUT_OPTIONS.plugins.legend,
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
        ...DOUGHNUT_OPTIONS,
        plugins: {
            legend: {
                ...DOUGHNUT_OPTIONS.plugins.legend,
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

    // Publishers ranked by count in the selected genre.
    const genrePublishers = useMemo(() => (comp?.publisher_distribution ?? [])
        .map(p => ({ ...p, count: pubGenre === 'all' ? p.count : (p.genres?.[pubGenre] ?? 0) }))
        .filter(p => p.count > 0)
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    [comp?.publisher_distribution, pubGenre]);
    const shownPublishers = useMemo(() => genrePublishers.slice(0, pubCount),
        [genrePublishers, pubCount]);
    // Slider stops at the first step covering every publisher.
    const pubCountMax = Math.min(100, Math.max(10,
        Math.ceil((comp?.publisher_distribution?.length ?? 0) / 10) * 10));

    const pubChartData = useMemo(() => {
        if (shownPublishers.length === 0) return null;
        const colors = shownPublishers.map((_, i) => publisherColors[i % publisherColors.length]);
        return {
            labels: shownPublishers.map(p => `${p.name} (${p.count.toLocaleString('fi-FI')})`),
            datasets: [{
                data: shownPublishers.map(p => p.count),
                backgroundColor: colors,
                hoverBackgroundColor: colors.map(c => c + 'CC'),
            }],
        };
    }, [shownPublishers]);
    const pubChartOptions = useMemo(() => ({
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: { usePointStyle: true },
                onClick: (_event: unknown, legendItem: { index?: number }) => {
                    const item = shownPublishers[legendItem.index ?? -1];
                    if (item?.id) {
                        setPublisherDialogFilter(item);
                    }
                },
            },
        },
        responsive: true,
        maintainAspectRatio: false,
    }), [shownPublishers]);

    const pubGenreId = pubGenre === 'all'
        ? undefined
        : genreData.find(g => g.abbr === pubGenre)?.id;
    const publisherWorksQuery = useQuery<Work[]>({
        queryKey: ['user', userId, filterParam, 'stats', 'filterworks', 'publisher', publisherDialogFilter?.id, pubGenreId],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append(filterParam, userId);
            params.append('publisher', String(publisherDialogFilter?.id));
            if (pubGenreId) params.append('genre', String(pubGenreId));
            const response = await getApiContent(`stats/filterworks?${params.toString()}`, user);
            return response.data;
        },
        enabled: publisherDialogFilter !== null
    });

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
                        <Chart ariaLabel="Kokoelman genret" type="pie" data={genres} options={genreChartOptions} style={{ height: '100%' }} />
                    </div>
                </div>
            )}

            {/* Publishers */}
            {comp && comp.publisher_distribution.length > 0 && (
                <div>
                    <div className="text-600 text-sm mb-2">Kustantajat</div>
                    <div className="flex align-items-center gap-3 mb-2 flex-wrap">
                        <Dropdown
                            ariaLabel="Kustantajien genre"
                            value={pubGenre}
                            options={genreOptions}
                            optionLabel="label"
                            optionValue="value"
                            onChange={(e) => setPubGenre(e.value)}
                            className="w-auto"
                        />
                        <div className="flex align-items-center gap-2">
                            <span className="text-sm">Määrä: {pubCount}</span>
                            <Slider
                                aria-label="Kustantajien määrä"
                                value={pubCount}
                                onChange={(e) => setPubCount(e.value as number)}
                                min={10}
                                max={pubCountMax}
                                step={10}
                                disabled={pubCountMax <= 10}
                                className="w-8rem"
                            />
                        </div>
                    </div>
                    {pubChartData ? (
                        <div style={{ height: `${Math.max(400, 300 + Math.ceil(shownPublishers.length / 4) * 20)}px` }}>
                            <Chart ariaLabel={`Kokoelman kustantajat (${pubCount} yleisintä)`} type="pie" data={pubChartData} options={pubChartOptions} style={{ height: '100%' }} />
                        </div>
                    ) : (
                        <p className="text-500">Ei kustantajia tässä genressä</p>
                    )}
                </div>
            )}

            {/* Original language + work type */}
            <div className="grid">
                {langChartData && (
                    <div className="col-12 md:col-6">
                        <div className="text-600 text-sm mb-2">Alkukieli</div>
                        <div style={{ height: '220px' }}>
                            <Chart ariaLabel="Kokoelman alkukielet" type="doughnut" data={langChartData} options={langChartOptions} style={{ height: '100%' }} />
                        </div>
                    </div>
                )}
                {typeChartData && (
                    <div className="col-12 md:col-6">
                        <div className="text-600 text-sm mb-2">Teostyypit</div>
                        <div style={{ height: '220px' }}>
                            <Chart ariaLabel="Kokoelman teostyypit" type="doughnut" data={typeChartData} options={typeChartOptions} style={{ height: '100%' }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Publications per year */}
            {comp && comp.editions_by_year.length > 0 && (
                <CollectionYearsCard
                    finnishEditionData={comp.editions_by_year}
                    originalYearData={comp.origworks_by_year}
                    filterParam={filterParam}
                    userId={userId}
                />
            )}

            {/* Dialog for works filtered by publisher */}
            <Dialog
                header={publisherDialogFilter ? `${publisherDialogFilter.name} (${publisherDialogFilter.count})` : ''}
                visible={publisherDialogFilter !== null}
                onHide={() => setPublisherDialogFilter(null)}
                style={{ width: '80vw', maxHeight: '90vh' }}
                maximizable
            >
                {publisherWorksQuery.isLoading ? (
                    <div className="flex justify-content-center p-4">
                        <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                    </div>
                ) : publisherWorksQuery.data && publisherWorksQuery.data.length > 0 ? (
                    <WorkList works={publisherWorksQuery.data} />
                ) : (
                    <p className="text-500">Ei tuloksia</p>
                )}
            </Dialog>

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
