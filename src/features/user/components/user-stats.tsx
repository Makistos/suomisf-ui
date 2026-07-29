import { getApiContent } from "@services/user-service";
import { getCurrenUser } from "@services/auth-service";
import { Chart } from "primereact/chart";
import { ChartData } from "chart.js/index";
import { useEffect, useMemo, useState } from "react";
import { getGenreColors } from "../../genre";
import { WorksByYearChart } from "../../stats/components/works-by-year-chart";

interface UserStatsProps {
    userId: string
}

interface YearCount {
    year: number;
    count: number;
    language_id: number | null;
    language_name: string | null;
}

type GenreData = {
    id: number
    abbr: string
    name: string
    count: number
}

interface DistItem {
    name: string;
    count: number;
}

interface CollectionComposition {
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

export const UserStats = ({ userId }: UserStatsProps) => {
    const user = useMemo(() => getCurrenUser(), []);
    const [genres, setGenres] = useState<ChartData>({ datasets: [], labels: [] });
    const [comp, setComp] = useState<CollectionComposition | null>(null);

    useEffect(() => {
        getApiContent(`users/${userId}/stats/genres`, null)
            .then(r => setGenres(toChartData(r.data)))
            .catch(() => { });
        getApiContent(`user/${userId}/collection/stats`, user)
            .then(r => setComp(r.data))
            .catch(() => { });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const toChartData = (data: GenreData[]): ChartData => ({
        labels: data.map(g => g.name + ' (' + g.count + ')'),
        datasets: [{
            data: data.map(g => g.count),
            backgroundColor: getGenreColors(data.map(g => g.abbr)),
        }],
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

    const hasGenres = (genres.datasets?.length ?? 0) > 0;

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
                        <Chart type="pie" data={genres} options={doughnutOptions} style={{ height: '100%' }} />
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
                            <Chart type="doughnut" data={langChartData} options={doughnutOptions} style={{ height: '100%' }} />
                        </div>
                    </div>
                )}
                {typeChartData && (
                    <div className="col-12 md:col-6">
                        <div className="text-600 text-sm mb-2">Teostyypit</div>
                        <div style={{ height: '220px' }}>
                            <Chart type="doughnut" data={typeChartData} options={doughnutOptions} style={{ height: '100%' }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Publications per year */}
            {comp && comp.editions_by_year.length > 0 && (
                <WorksByYearChart
                    finnishEditionData={comp.editions_by_year}
                    originalYearData={comp.origworks_by_year}
                />
            )}
        </div>
    );
}
