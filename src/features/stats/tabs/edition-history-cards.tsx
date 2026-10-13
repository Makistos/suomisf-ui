// Cards for the Julkaisut ajallisesti tab built on edition data: first
// editions vs new versions vs reprints, translation delay, and the share
// of Finnish originals.

import { useMemo, useState } from 'react';
import { SelectButton } from 'primereact/selectbutton';
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
    ChartTheme, DataView, EditionTypeYear, GroupYearCount, Histogram, HistogramBin,
    LanguageYearCount, MedianBandLine, QuartilePoint, Series, StatCard, TranslationLag,
    YearColumnsChart, YearRange, axisColours, baseChartOptions, bucketLabel, bucketOf,
    bucketsIn, statsParams, useStatsQuery,
} from '../charts';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

const fmt = (n: number) => n.toLocaleString('fi-FI');
const num = (n: number) => n.toLocaleString('fi-FI', { maximumFractionDigits: 1 });

const Loading = () => <div className="flex justify-content-center p-4"><ProgressSpinner /></div>;

const countShareOptions = [
    { label: 'Määrä', value: false },
    { label: 'Osuus', value: true },
];

const EDITION_TYPES = [
    { key: 'first', label: 'Ensipainokset' },
    { key: 'new_version', label: 'Uudet laitokset' },
    { key: 'reprint', label: 'Uusintapainokset' },
] as const;

// Every printing per year, split by what it is.
export const EditionTypesCard = ({ theme, genre, range, onFirstEditions }: {
    theme: ChartTheme;
    genre: string;
    range: YearRange;
    onFirstEditions: (years: { min: number; max: number }) => void;
}) => {
    const [share, setShare] = useState(false);
    const data = useStatsQuery<EditionTypeYear[]>(`stats/editiontypes${statsParams({ genre })}`);
    const rows = useMemo((): GroupYearCount[] => (data.data ?? []).flatMap(d =>
        EDITION_TYPES.map(t => ({ year: d.year, count: d[t.key], group_id: null, group_name: t.key }))),
    [data.data]);
    const series: Series[] = EDITION_TYPES.map((t, i) => ({ key: t.key, label: t.label, color: theme.series[i], id: null }));

    return (
        <StatCard
            title="Painokset vuosittain"
            subtitle="Kaikki painokset: teoksen ensimmäinen suomenkielinen painos, uuden laitoksen (esim. uuden suomennoksen) ensimmäinen painos ja uusintapainokset."
            controls={
                <SelectButton aria-label="Määrä vai osuus" value={share} options={countShareOptions}
                    optionLabel="label" optionValue="value" allowEmpty={false}
                    onChange={(e) => setShare(e.value)} />
            }
        >
            {!data.data ? <Loading /> : (
                <YearColumnsChart
                    rows={rows}
                    range={range}
                    series={series}
                    showOthers={false}
                    othersColor={theme.other}
                    share={share}
                    unit="painosta"
                    axisTitle="Painoksia"
                    ariaLabel="Painokset vuosittain tyypeittäin"
                    onSelect={(years, s) => { if (s?.key === 'first') onFirstEditions(years); }}
                />
            )}
        </StatCard>
    );
};

// Delay bins: single years up to 9, then widening ranges.
const LAG_BINS: { min: number; max: number; label: string }[] = [
    ...Array.from({ length: 10 }, (_, i) => ({ min: i, max: i, label: String(i) })),
    { min: 10, max: 19, label: '10–19' },
    { min: 20, max: 49, label: '20–49' },
    { min: 50, max: 99, label: '50–99' },
    { min: 100, max: Infinity, label: '100+' },
];

const lagBins = (histogram: TranslationLag['histogram']): HistogramBin[] =>
    LAG_BINS.map((b, i) => ({
        key: i,
        label: b.label,
        count: histogram.reduce((sum, h) => h.lag >= b.min && h.lag <= b.max ? sum + h.count : sum, 0),
    }));

// How long translations took: the distribution, and its median by decade.
export const TranslationLagCards = ({ genre, range }: { genre: string; range: YearRange }) => {
    const data = useStatsQuery<TranslationLag>(
        `stats/translationlag${statsParams({ genre, start: range.start, end: range.end })}`);
    const bins = useMemo(() => lagBins(data.data?.histogram ?? []), [data.data]);
    const points = useMemo((): QuartilePoint[] => {
        const byDecade = new Map((data.data?.by_decade ?? []).map(d => [d.decade, d]));
        return bucketsIn({ ...range, decades: true }).map(decade => {
            const d = byDecade.get(decade);
            return { key: decade, label: bucketLabel(decade, true), count: d?.count ?? 0,
                q1: d?.q1 ?? 0, median: d?.median ?? 0, q3: d?.q3 ?? 0 };
        });
    }, [data.data, range]);
    const lag = data.data;

    return (
        <>
            <div className="col-12 lg:col-6">
                <StatCard
                    title="Suomennosviive"
                    subtitle={lag
                        ? `Vuosia alkuteoksen julkaisusta ensimmäiseen suomenkieliseen painokseen. ${fmt(lag.total)} käännösteosta valitulla aikavälillä; mediaani ${lag.median === null ? '–' : num(lag.median)} vuotta.`
                        : 'Vuosia alkuteoksen julkaisusta ensimmäiseen suomenkieliseen painokseen.'}
                >
                    {!lag ? <Loading /> : (
                        <Histogram bins={bins} unit="teosta" binTitle="Vuosia" axisTitle="Teoksia"
                            ariaLabel="Suomennosviiveen jakauma" />
                    )}
                </StatCard>
            </div>
            <div className="col-12 lg:col-6">
                <StatCard
                    title="Suomennosviive vuosikymmenittäin"
                    subtitle="Viiveen mediaani suomennoksen ilmestymisvuosikymmenen mukaan. Varjostettu alue on keskimmäinen puolikas teoksista. Vuosikymmenet, joilla on alle 5 teosta, jätetään pois."
                >
                    {!lag ? <Loading /> : (
                        <MedianBandLine points={points} valueUnit="vuotta" countUnit="teosta" countHeader="Teoksia"
                            axisTitle="Vuosia" labelHeader="Vuosikymmen" minCount={5}
                            ariaLabel="Suomennosviiveen mediaani vuosikymmenittäin" />
                    )}
                </StatCard>
            </div>
        </>
    );
};

// Share of first editions originally written in Finnish, per year/decade.
export const DomesticShareCard = ({ theme, range, firstEditions }: {
    theme: ChartTheme;
    range: YearRange;
    firstEditions: LanguageYearCount[];
}) => {
    const buckets = useMemo(() => bucketsIn(range), [range]);
    const { finnish, total } = useMemo(() => {
        const f = new Map<number, number>();
        const t = new Map<number, number>();
        firstEditions.forEach(d => {
            if (d.year < range.start || d.year > range.end) return;
            const b = bucketOf(d.year, range.decades);
            t.set(b, (t.get(b) ?? 0) + d.count);
            if (d.language_name === 'suomi') f.set(b, (f.get(b) ?? 0) + d.count);
        });
        return { finnish: buckets.map(b => f.get(b) ?? 0), total: buckets.map(b => t.get(b) ?? 0) };
    }, [firstEditions, range, buckets]);
    const share = total.map((t, i) => t ? finnish[i] / t * 100 : null);
    const base = baseChartOptions(theme);

    return (
        <StatCard title="Kotimaisten osuus"
            subtitle="Alun perin suomeksi kirjoitettujen teosten osuus ensipainoksista.">
            <div style={{ height: '280px' }}>
                <Line
                    role="img"
                    aria-label="Kotimaisten teosten osuus ensipainoksista"
                    data={{
                        labels: buckets.map(b => bucketLabel(b, range.decades)),
                        datasets: [{
                            label: 'Kotimaisten osuus', data: share,
                            borderColor: theme.series[1], backgroundColor: theme.series[1],
                            borderWidth: 2, pointRadius: range.decades ? 3 : 0, pointHoverRadius: 4, tension: 0.2, spanGaps: true,
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
                                        `${num(ctx.parsed.y ?? 0)} % (${fmt(finnish[ctx.dataIndex])} / ${fmt(total[ctx.dataIndex])} ensipainosta)`,
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
                            <th className="text-left">{range.decades ? 'Vuosikymmen' : 'Vuosi'}</th>
                            <th className="text-right">Kotimaisia</th>
                            <th className="text-right">Kaikki</th>
                            <th className="text-right">Osuus</th>
                        </tr>
                    </thead>
                    <tbody>
                        {buckets.map((b, i) => total[i] ? (
                            <tr key={b}>
                                <td>{bucketLabel(b, range.decades)}</td>
                                <td className="text-right">{fmt(finnish[i])}</td>
                                <td className="text-right">{fmt(total[i])}</td>
                                <td className="text-right">{num(share[i] ?? 0)} %</td>
                            </tr>
                        ) : null)}
                    </tbody>
                </table>
            </DataView>
        </StatCard>
    );
};
