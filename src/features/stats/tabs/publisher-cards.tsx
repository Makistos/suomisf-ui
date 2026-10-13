// Kustantajat cards built on publishersbyyear (works by the year a
// publisher first published them) and publisher series.

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
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
    DEFAULT_START_YEAR, DataView, PublisherYearCount, PubseriesCounts, RankedBarChart, StatCard,
    Timeline, TimelineItem, YearColumnsChart, axisColours, baseChartOptions, bucketLabel, statsParams,
    useChartTheme, useStatsQuery,
} from '../charts';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

const fmt = (n: number) => n.toLocaleString('fi-FI');
const num = (n: number) => n.toLocaleString('fi-FI', { maximumFractionDigits: 1 });

const Loading = () => <div className="flex justify-content-center p-4"><ProgressSpinner /></div>;

// Publishers whose share is measured in the concentration card.
const CONCENTRATION_TOP = 5;
// Publishers on the timeline.
const TIMELINE_TOP = 30;

const lastYear = (rows: PublisherYearCount[]) => Math.max(DEFAULT_START_YEAR, ...rows.map(r => r.year));

export const ActivePublishersCard = ({ rows }: { rows: PublisherYearCount[] | undefined }) => {
    const theme = useChartTheme();
    // One row per publisher and year: the chart sums them into a count.
    const active = useMemo(() => (rows ?? []).map(r => ({ year: r.year, count: 1, group_id: null, group_name: null })), [rows]);
    const range = useMemo(() => ({ start: DEFAULT_START_YEAR, end: lastYear(rows ?? []), decades: false }), [rows]);
    return (
        <StatCard title="Aktiiviset kustantajat"
            subtitle="Kustantajia, jotka julkaisivat vuoden aikana vähintään yhden teoksen ensimmäistä kertaa. Pelkät uusintapainokset eivät tee kustantajasta aktiivista.">
            {!rows ? <Loading /> : (
                <YearColumnsChart rows={active} range={range}
                    series={[{ key: '*', label: 'Kustantajia', color: theme.series[0], id: null }]}
                    showOthers={false} othersColor={theme.other} unit="kustantajaa" axisTitle="Kustantajia"
                    ariaLabel="Aktiiviset kustantajat vuosittain" />
            )}
        </StatCard>
    );
};

export const ConcentrationCard = ({ rows }: { rows: PublisherYearCount[] | undefined }) => {
    const theme = useChartTheme();
    const decades = useMemo(() => {
        const list: number[] = [];
        for (let d = DEFAULT_START_YEAR; d <= lastYear(rows ?? []); d += 10) list.push(d);
        return list;
    }, [rows]);
    // Per decade: works by the five biggest publishers of that decade / all.
    const points = useMemo(() => decades.map(d => {
        const perPublisher = new Map<number, number>();
        (rows ?? []).forEach(r => {
            if (r.year < d || r.year > d + 9) return;
            perPublisher.set(r.publisher_id, (perPublisher.get(r.publisher_id) ?? 0) + r.count);
        });
        const counts = [...perPublisher.values()].sort((a, b) => b - a);
        const total = counts.reduce((a, b) => a + b, 0);
        const top = counts.slice(0, CONCENTRATION_TOP).reduce((a, b) => a + b, 0);
        return { decade: d, top, total, share: total ? top / total * 100 : null };
    }), [rows, decades]);
    const base = baseChartOptions(theme);

    return (
        <StatCard title="Keskittyminen"
            subtitle={`Vuosikymmenen ${CONCENTRATION_TOP} suurimman kustantajan osuus teoksista (teos lasketaan kustantajan ensimmäisen painoksen mukaan).`}>
            {!rows ? <Loading /> : (
                <>
                    <div style={{ height: '280px' }}>
                        <Line
                            role="img"
                            aria-label={`${CONCENTRATION_TOP} suurimman kustantajan osuus vuosikymmenittäin`}
                            data={{
                                labels: decades.map(d => bucketLabel(d, true)),
                                datasets: [{
                                    label: 'Osuus', data: points.map(p => p.share),
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
                                            label: (ctx: TooltipItem<'line'>) => {
                                                const p = points[ctx.dataIndex];
                                                return `${num(p.share ?? 0)} % (${fmt(p.top)} / ${fmt(p.total)} teosta)`;
                                            },
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
                                    <th className="text-right">{CONCENTRATION_TOP} suurinta</th>
                                    <th className="text-right">Kaikki</th>
                                    <th className="text-right">Osuus</th>
                                </tr>
                            </thead>
                            <tbody>
                                {points.filter(p => p.total).map(p => (
                                    <tr key={p.decade}>
                                        <td>{bucketLabel(p.decade, true)}</td>
                                        <td className="text-right">{fmt(p.top)}</td>
                                        <td className="text-right">{fmt(p.total)}</td>
                                        <td className="text-right">{num(p.share ?? 0)} %</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </DataView>
                </>
            )}
        </StatCard>
    );
};

export const PublisherSpansCard = ({ rows }: { rows: PublisherYearCount[] | undefined }) => {
    const items = useMemo((): TimelineItem[] => {
        const spans = new Map<number, TimelineItem>();
        (rows ?? []).forEach(r => {
            const s = spans.get(r.publisher_id)
                ?? { id: r.publisher_id, label: r.publisher_name, start: r.year, end: r.year, count: 0 };
            s.start = Math.min(s.start, r.year);
            s.end = Math.max(s.end, r.year);
            s.count += r.count;
            spans.set(r.publisher_id, s);
        });
        return [...spans.values()]
            .sort((a, b) => b.count - a.count)
            .slice(0, TIMELINE_TOP)
            .sort((a, b) => a.start - b.start || a.end - b.end);
    }, [rows]);

    return (
        <StatCard title="Kustantajien toiminta-ajat"
            subtitle={`${TIMELINE_TOP} eniten teoksia julkaissutta kustantajaa ensimmäisen ja viimeisen julkaisuvuoden mukaan, aloitusvuoden järjestyksessä. Väli ei kerro taukoja.`}>
            {!rows ? <Loading /> : (
                <Timeline items={items} unit="teosta" countHeader="Teoksia" itemHeader="Kustantaja"
                    ariaLabel="Kustantajien toiminta-ajat"
                    nameTemplate={(i) => <Link to={`/publishers/${i.id}`}>{i.label}</Link>} />
            )}
        </StatCard>
    );
};

export const PubseriesCard = ({ genre }: { genre: string }) => {
    const data = useStatsQuery<PubseriesCounts>(`stats/pubseriescounts${statsParams({ genre })}`);
    const d = data.data;
    const share = d?.editions ? d.in_series / d.editions * 100 : 0;
    return (
        <StatCard title="Kustantajasarjat"
            subtitle={d
                ? `Painoksia sarjoittain, ${d.series.length} suurinta. ${fmt(d.in_series)} painosta ${fmt(d.editions)}:sta (${num(share)} %) kuuluu kustantajan sarjaan.`
                : 'Painoksia sarjoittain.'}>
            {!d ? <Loading /> : (
                <RankedBarChart
                    items={d.series.map(s => ({ id: s.id, label: s.publisher_name ? `${s.name} (${s.publisher_name})` : s.name, count: s.editions }))}
                    topN={d.series.length} showOthers={false} unit="painosta" itemHeader="Sarja"
                    ariaLabel="Suurimmat kustantajasarjat"
                    nameTemplate={(item) => <Link to={`/pubseries/${item.id}`}>{item.label}</Link>} />
            )}
        </StatCard>
    );
};
