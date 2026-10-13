import { useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend,
    ChartEvent,
    ActiveElement,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { OTHERS_LABEL } from './palette';
import { axisColours, baseChartOptions, useChartTheme } from './use-chart-theme';
import { YearRange, bucketLabel, bucketOf, bucketYears, bucketsIn } from './years';
import { DataView } from './stat-card';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// One count for a year and group (language, publisher, magazine…).
export interface GroupYearCount {
    year: number;
    count: number;
    group_id: number | null;
    group_name: string | null;
}

export interface Series {
    // Matches GroupYearCount.group_name; '*' matches every row.
    key: string;
    label: string;
    color: string;
    id: number | null;
}

interface YearColumnsChartProps {
    rows: GroupYearCount[];
    range: YearRange;
    // Named series, in stacking order (bottom first).
    series: Series[];
    // Fold rows outside `series` into a grey "Muut" series instead of
    // dropping them.
    showOthers: boolean;
    othersColor: string;
    // Show each series' share of the bucket total instead of counts.
    share?: boolean;
    // What is counted, as after a number: "teosta", "numeroa"…
    unit: string;
    // Value axis title, e.g. "Teoksia".
    axisTitle: string;
    ariaLabel: string;
    // Clicked a column segment or table cell. `series` is null for "Muut".
    onSelect?: (years: { min: number; max: number }, series: Series | null) => void;
}

const fmt = (n: number) => n.toLocaleString('fi-FI');
const pct = (n: number) => `${n.toLocaleString('fi-FI', { maximumFractionDigits: 1 })} %`;

// Columns over time, stacked by group. Time runs left to right with every
// year (or decade) in the range on the axis, empty ones included.
export const YearColumnsChart = ({
    rows, range, series, showOthers, othersColor, share = false,
    unit, axisTitle, ariaLabel, onSelect,
}: YearColumnsChartProps) => {
    const theme = useChartTheme();
    const buckets = useMemo(() => bucketsIn(range), [range]);

    // counts[seriesIndex][bucketIndex]; the last row is "Muut" when shown.
    const { counts, allSeries } = useMemo(() => {
        const others: Series = { key: OTHERS_LABEL, label: OTHERS_LABEL, color: othersColor, id: null };
        const all = showOthers ? [...series, others] : series;
        const indexOf = new Map(series.map((s, i) => [s.key, i]));
        const matchAll = series.length === 1 && series[0].key === '*';
        const bucketIndex = new Map(buckets.map((b, i) => [b, i]));
        const matrix = all.map(() => buckets.map(() => 0));
        rows.forEach(r => {
            if (r.year < range.start || r.year > range.end) return;
            const bi = bucketIndex.get(bucketOf(r.year, range.decades));
            if (bi === undefined) return;
            let si = matchAll ? 0 : indexOf.get(r.group_name ?? '');
            if (si === undefined) {
                if (!showOthers) return;
                si = all.length - 1;
            }
            matrix[si][bi] += r.count;
        });
        return { counts: matrix, allSeries: all };
    }, [rows, range, series, showOthers, othersColor, buckets]);

    const totals = useMemo(
        () => buckets.map((_, bi) => counts.reduce((sum, row) => sum + row[bi], 0)),
        [counts, buckets]);

    const chartData = useMemo(() => ({
        labels: buckets.map(b => bucketLabel(b, range.decades)),
        datasets: allSeries.map((s, si) => ({
            label: s.label,
            data: counts[si].map((c, bi) => share ? (totals[bi] ? (c / totals[bi]) * 100 : 0) : c),
            backgroundColor: s.color,
            hoverBackgroundColor: s.color,
            // A hairline in the surface colour separates stacked segments.
            borderColor: theme.surface,
            borderWidth: allSeries.length > 1 ? { top: 1 } : 0,
            borderSkipped: false as const,
            categoryPercentage: 0.9,
            barPercentage: 1,
        })),
    }), [buckets, range.decades, allSeries, counts, totals, share, theme.surface]);

    const options = useMemo(() => {
        const base = baseChartOptions(theme);
        return {
            ...base,
            interaction: { mode: 'index' as const, intersect: false },
            onHover: (event: ChartEvent, elements: ActiveElement[]) => {
                const target = event.native?.target as HTMLElement | undefined;
                if (target) target.style.cursor = onSelect && elements.length ? 'pointer' : 'default';
            },
            onClick: (_event: ChartEvent, elements: ActiveElement[]) => {
                const el = elements[0];
                if (!onSelect || !el) return;
                const s = allSeries[el.datasetIndex];
                onSelect(bucketYears(buckets[el.index], range), s.key === OTHERS_LABEL ? null : s);
            },
            plugins: {
                ...base.plugins,
                legend: { ...base.plugins.legend, display: allSeries.length > 1, position: 'top' as const },
                tooltip: {
                    ...base.plugins.tooltip,
                    filter: (item: { datasetIndex: number; dataIndex: number }) =>
                        counts[item.datasetIndex][item.dataIndex] > 0,
                    callbacks: {
                        label: (ctx: { datasetIndex: number; dataIndex: number; dataset: { label?: string } }) => {
                            const c = counts[ctx.datasetIndex][ctx.dataIndex];
                            const t = totals[ctx.dataIndex];
                            return share
                                ? `${ctx.dataset.label}: ${pct(t ? (c / t) * 100 : 0)} (${fmt(c)} ${unit})`
                                : `${ctx.dataset.label}: ${fmt(c)} ${unit}`;
                        },
                        footer: (items: { dataIndex: number }[]) =>
                            items.length && allSeries.length > 1
                                ? `Yhteensä: ${fmt(totals[items[0].dataIndex])} ${unit}` : '',
                    },
                },
            },
            scales: {
                x: { ...axisColours(theme), stacked: true, grid: { display: false },
                    ticks: { ...axisColours(theme).ticks, maxRotation: 0, autoSkipPadding: 12 } },
                y: { ...axisColours(theme), stacked: true, beginAtZero: true,
                    ...(share ? { max: 100, ticks: { ...axisColours(theme).ticks, callback: (v: string | number) => `${v} %` } } : {}),
                    title: { display: true, text: share ? 'Osuus' : axisTitle, color: theme.textSecondary } },
            },
        };
    }, [theme, allSeries, counts, totals, share, unit, axisTitle, buckets, range, onSelect]);

    // Table view: one row per year/decade with data, a column per series.
    const tableRows = useMemo(() => buckets
        .map((b, bi) => ({
            bucket: b,
            label: bucketLabel(b, range.decades),
            total: totals[bi],
            ...Object.fromEntries(allSeries.map((s, si) => [`s${si}`, counts[si][bi]])),
        }))
        .filter(r => r.total > 0), [buckets, range.decades, totals, allSeries, counts]);

    const cell = (si: number) => (row: { bucket: number } & Record<string, number>) => {
        const value = row[`s${si}`];
        const s = allSeries[si];
        if (!value) return '';
        if (!onSelect || s.key === OTHERS_LABEL) return fmt(value);
        return (
            <a href="#" onClick={(e) => { e.preventDefault(); onSelect(bucketYears(row.bucket, range), s); }}>
                {fmt(value)}
            </a>
        );
    };

    return (
        <>
            <div style={{ height: '360px' }}>
                <Bar role="img" aria-label={ariaLabel} data={chartData} options={options} />
            </div>
            <DataView>
                <DataTable value={tableRows} size="small" stripedRows paginator rows={25}
                    rowsPerPageOptions={[25, 50, 100]} dataKey="bucket" scrollable>
                    <Column field="label" header={range.decades ? 'Vuosikymmen' : 'Vuosi'} sortable sortField="bucket" frozen />
                    {allSeries.length > 1 && allSeries.map((s, si) => (
                        <Column key={s.key} field={`s${si}`} header={s.label} body={cell(si)}
                            style={{ textAlign: 'right' }} sortable />
                    ))}
                    <Column field="total" header="Yhteensä"
                        body={allSeries.length > 1 ? (r: { total: number }) => fmt(r.total) : cell(0)}
                        style={{ textAlign: 'right' }} sortable />
                </DataTable>
            </DataView>
        </>
    );
};
