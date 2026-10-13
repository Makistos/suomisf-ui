// Sisältö cards on work types, genres, tags and book series.

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Dropdown } from 'primereact/dropdown';
import { ProgressSpinner } from 'primereact/progressspinner';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    TooltipItem,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
    BookseriesStats, DataView, GENRE_NAMES, GenreYearCount, Heatmap, HeatmapRow, NamedCount,
    RankedBarChart, RankedItem, StatCard, TagCounts, TagDecadeCount, axisColours, baseChartOptions,
    bucketLabel, statsParams, useChartTheme, useStatsQuery,
} from '../charts';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

const fmt = (n: number) => n.toLocaleString('fi-FI');
const num = (n: number) => n.toLocaleString('fi-FI', { maximumFractionDigits: 1 });

const Loading = () => <div className="flex justify-content-center p-4"><ProgressSpinner /></div>;

// Decades shown in the content heatmaps and lines.
const FIRST_DECADE = 1900;
const DECADES = Array.from(
    { length: (Math.floor(new Date().getFullYear() / 10) * 10 - FIRST_DECADE) / 10 + 1 },
    (_, i) => FIRST_DECADE + i * 10);

// Tag type used by default in the by-decade heatmap.
const SUBGENRE_TYPE = 'Alagenre';

export const WorkTypesCard = () => {
    const data = useStatsQuery<NamedCount[]>('stats/worktypecounts');
    return (
        <StatCard title="Teostyypit" subtitle="Teoksia teostyypin mukaan.">
            {!data.data ? <Loading /> : (
                <RankedBarChart
                    items={data.data.map(t => ({ id: t.id, label: t.name, count: t.count }))}
                    topN={data.data.length} showOthers={false} unit="teosta" itemHeader="Teostyyppi"
                    ariaLabel="Teokset teostyypeittäin" />
            )}
        </StatCard>
    );
};

export const GenreDecadesCard = () => {
    const data = useStatsQuery<GenreYearCount[]>('stats/genresbyyear');
    const decades = DECADES;
    const rows = useMemo((): HeatmapRow[] => {
        const index = new Map(decades.map((d, i) => [d, i]));
        return Object.entries(GENRE_NAMES).map(([abbr, label]) => {
            const values = decades.map(() => 0);
            (data.data ?? []).forEach(r => {
                if (r.genre_abbr !== abbr) return;
                const i = index.get(Math.floor(r.year / 10) * 10);
                if (i !== undefined) values[i] += r.count;
            });
            return { id: null, label, values };
        });
    }, [data.data, decades]);

    return (
        <StatCard title="Genret vuosikymmenittäin"
            subtitle="Teoksia genren ja ensimmäisen suomenkielisen painoksen vuosikymmenen mukaan. Teos lasketaan jokaiseen genreensä.">
            {!data.data ? <Loading /> : (
                <Heatmap rows={rows} columns={decades.map(d => ({ key: d, label: String(d) }))}
                    unit="teosta" rowHeader="Genre" caption="Genret vuosikymmenittäin" />
            )}
        </StatCard>
    );
};

const tagTypeOptions = (types: TagCounts['types']) => [
    { label: 'Kaikki tyypit', value: 'all' as const },
    ...types.map(t => ({ label: t.name, value: t.id })),
];

export const TagsCard = () => {
    const [type, setType] = useState<number | 'all'>('all');
    const data = useStatsQuery<TagCounts>(`stats/tagcounts${statsParams({ type })}`);
    const items = useMemo((): RankedItem[] =>
        (data.data?.tags ?? []).map(t => ({ id: t.id, label: t.name, count: t.count })), [data.data]);

    return (
        <StatCard title="Yleisimmät asiasanat"
            subtitle="Teoksia asiasanan mukaan, 30 yleisintä."
            controls={
                <div className="flex align-items-center gap-2">
                    <label htmlFor="tag-type">Tyyppi:</label>
                    <Dropdown inputId="tag-type" ariaLabel="Asiasanan tyyppi" value={type}
                        options={tagTypeOptions(data.data?.types ?? [])} optionLabel="label" optionValue="value"
                        onChange={(e) => setType(e.value)} className="w-auto" />
                </div>
            }
        >
            {!data.data ? <Loading /> : (
                <RankedBarChart items={items} topN={items.length} showOthers={false} unit="teosta"
                    itemHeader="Asiasana" ariaLabel="Yleisimmät asiasanat"
                    nameTemplate={(item) => <Link to={`/tags/${item.id}`}>{item.label}</Link>} />
            )}
        </StatCard>
    );
};

export const TagDecadesCard = () => {
    const types = useStatsQuery<TagCounts>('stats/tagcounts?count=1');
    const subgenre = types.data?.types.find(t => t.name === SUBGENRE_TYPE)?.id;
    const [type, setType] = useState<number | 'all' | null>(null);
    const activeType = type ?? subgenre ?? 'all';
    const data = useStatsQuery<TagDecadeCount[]>(
        `stats/tagsbydecade${statsParams({ type: activeType })}`, types.data !== undefined);
    const decades = DECADES;

    const rows = useMemo((): HeatmapRow[] => {
        const index = new Map(decades.map((d, i) => [d, i]));
        const byTag = new Map<number, HeatmapRow & { total: number }>();
        (data.data ?? []).forEach(r => {
            const row = byTag.get(r.tag_id) ?? { id: r.tag_id, label: r.tag_name, values: decades.map(() => 0), total: 0 };
            row.total += r.count;
            const i = index.get(r.year);
            if (i !== undefined) row.values[i] += r.count;
            byTag.set(r.tag_id, row);
        });
        return [...byTag.values()].sort((a, b) => b.total - a.total);
    }, [data.data, decades]);

    return (
        <StatCard title="Asiasanat vuosikymmenittäin"
            subtitle="Teoksia asiasanan ja ensimmäisen suomenkielisen painoksen vuosikymmenen mukaan, 20 yleisintä asiasanaa."
            controls={
                <div className="flex align-items-center gap-2">
                    <label htmlFor="tag-decade-type">Tyyppi:</label>
                    <Dropdown inputId="tag-decade-type" ariaLabel="Asiasanan tyyppi (vuosikymmenet)" value={activeType}
                        options={tagTypeOptions(types.data?.types ?? [])} optionLabel="label" optionValue="value"
                        onChange={(e) => setType(e.value)} className="w-auto" />
                </div>
            }
        >
            {!data.data ? <Loading /> : (
                <Heatmap rows={rows} columns={decades.map(d => ({ key: d, label: String(d) }))}
                    unit="teosta" rowHeader="Asiasana" caption="Asiasanat vuosikymmenittäin" />
            )}
        </StatCard>
    );
};

export const LongestSeriesCard = () => {
    const data = useStatsQuery<BookseriesStats>('stats/bookseries');
    return (
        <StatCard title="Pisimmät kirjasarjat" subtitle="Kirjasarjat, joihin kuuluu eniten teoksia.">
            {!data.data ? <Loading /> : (
                <RankedBarChart
                    items={data.data.longest.map(s => ({ id: s.id, label: s.name, count: s.works }))}
                    topN={data.data.longest.length} showOthers={false} unit="teosta" itemHeader="Kirjasarja"
                    ariaLabel="Pisimmät kirjasarjat"
                    nameTemplate={(item) => <Link to={`/bookseries/${item.id}`}>{item.label}</Link>} />
            )}
        </StatCard>
    );
};

export const SeriesShareCard = () => {
    const theme = useChartTheme();
    const data = useStatsQuery<BookseriesStats>('stats/bookseries');
    const decades = DECADES;
    const { inSeries, total } = useMemo(() => {
        const s = new Map<number, number>();
        const t = new Map<number, number>();
        (data.data?.by_year ?? []).forEach(r => {
            const d = Math.floor(r.year / 10) * 10;
            s.set(d, (s.get(d) ?? 0) + r.in_series);
            t.set(d, (t.get(d) ?? 0) + r.total);
        });
        return { inSeries: decades.map(d => s.get(d) ?? 0), total: decades.map(d => t.get(d) ?? 0) };
    }, [data.data, decades]);
    const share = total.map((t, i) => t ? inSeries[i] / t * 100 : null);
    const base = baseChartOptions(theme);

    return (
        <StatCard title="Sarjaan kuuluvien osuus"
            subtitle="Kirjasarjaan kuuluvien teosten osuus ensimmäisen suomenkielisen painoksen vuosikymmenen mukaan.">
            {!data.data ? <Loading /> : (
                <>
                    <div style={{ height: '280px' }}>
                        <Line
                            role="img"
                            aria-label="Kirjasarjaan kuuluvien teosten osuus vuosikymmenittäin"
                            data={{
                                labels: decades.map(d => bucketLabel(d, true)),
                                datasets: [{
                                    label: 'Sarjaan kuuluvien osuus', data: share,
                                    borderColor: theme.series[0], backgroundColor: theme.series[0],
                                    borderWidth: 2, pointRadius: 3, pointHoverRadius: 5, tension: 0.2, spanGaps: true,
                                }],
                            }}
                            options={{
                                ...base,
                                interaction: { mode: 'index' as const, intersect: false },
                                plugins: {
                                    ...base.plugins,
                                    legend: { display: false },
                                    tooltip: {
                                        ...base.plugins.tooltip,
                                        callbacks: {
                                            label: (ctx: TooltipItem<'line'>) =>
                                                `${num(ctx.parsed.y ?? 0)} % (${fmt(inSeries[ctx.dataIndex])} / ${fmt(total[ctx.dataIndex])} teosta)`,
                                        },
                                    },
                                },
                                scales: {
                                    x: { ...axisColours(theme), grid: { display: false }, ticks: { ...axisColours(theme).ticks, maxRotation: 0, autoSkipPadding: 12 } },
                                    y: { ...axisColours(theme), beginAtZero: true, max: 100,
                                        ticks: { ...axisColours(theme).ticks, callback: (v: string | number) => `${v} %` },
                                        title: { display: true, text: 'Osuus', color: theme.textSecondary } },
                                },
                            }}
                        />
                    </div>
                    <DataView>
                        <table className="w-full text-sm">
                            <thead>
                                <tr>
                                    <th className="text-left">Vuosikymmen</th>
                                    <th className="text-right">Sarjaan kuuluvia</th>
                                    <th className="text-right">Kaikki</th>
                                    <th className="text-right">Osuus</th>
                                </tr>
                            </thead>
                            <tbody>
                                {decades.map((d, i) => total[i] ? (
                                    <tr key={d}>
                                        <td>{bucketLabel(d, true)}</td>
                                        <td className="text-right">{fmt(inSeries[i])}</td>
                                        <td className="text-right">{fmt(total[i])}</td>
                                        <td className="text-right">{num(share[i] ?? 0)} %</td>
                                    </tr>
                                ) : null)}
                            </tbody>
                        </table>
                    </DataView>
                </>
            )}
        </StatCard>
    );
};
