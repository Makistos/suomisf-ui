import { ReactNode, useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    ChartEvent,
    ActiveElement,
    Plugin,
    TooltipItem,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { OTHERS_LABEL } from './palette';
import { axisColours, baseChartOptions, useChartTheme } from './use-chart-theme';
import { DataView } from './stat-card';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export interface RankedItem {
    id: number | null;
    label: string;
    count: number;
}

interface RankedBarChartProps {
    items: RankedItem[];
    // Bars drawn by name; the rest are summed into "Muut" when showOthers.
    topN: number;
    showOthers?: boolean;
    // Count outside `items` altogether (e.g. a server-side "Muut"), added to
    // the "Muut" bar.
    restCount?: number;
    // Plural of what is counted: "teosta", "henkilöä"…
    unit: string;
    // Column header for the item names in the table view.
    itemHeader: string;
    ariaLabel: string;
    onSelect?: (item: RankedItem) => void;
    // Optional cell renderer for names in the table (e.g. links).
    nameTemplate?: (item: RankedItem) => ReactNode;
}

const fmt = (n: number) => n.toLocaleString('fi-FI');

// Writes each bar's value just past its end, in the theme's text colour.
const valueLabels = (colour: string): Plugin<'bar'> => ({
    id: 'valueLabels',
    afterDatasetsDraw(chart) {
        const { ctx } = chart;
        const meta = chart.getDatasetMeta(0);
        const data = chart.data.datasets[0]?.data as number[] | undefined;
        if (!data) return;
        ctx.save();
        ctx.fillStyle = colour;
        ctx.font = '12px Roboto, sans-serif';
        ctx.textBaseline = 'middle';
        meta.data.forEach((bar, i) => {
            const { x, y } = bar.getProps(['x', 'y'], true) as { x: number; y: number };
            ctx.fillText(fmt(data[i]), x + 6, y);
        });
        ctx.restore();
    },
});

// A ranking as horizontal bars, biggest first, in one colour: the bars are
// one series, so length carries the value and colour carries nothing.
export const RankedBarChart = ({
    items, topN, showOthers = true, restCount = 0, unit, itemHeader, ariaLabel, onSelect, nameTemplate,
}: RankedBarChartProps) => {
    const theme = useChartTheme();

    const sorted = useMemo(
        () => [...items].filter(i => i.count > 0).sort((a, b) => b.count - a.count),
        [items]);
    const total = useMemo(() => sorted.reduce((sum, i) => sum + i.count, restCount), [sorted, restCount]);

    const shown = useMemo(() => {
        const top = sorted.slice(0, topN);
        const rest = sorted.slice(topN).reduce((sum, i) => sum + i.count, restCount);
        return showOthers && rest > 0
            ? [...top, { id: null, label: OTHERS_LABEL, count: rest }]
            : top;
    }, [sorted, topN, showOthers, restCount]);

    const chartData = useMemo(() => ({
        labels: shown.map(i => i.label),
        datasets: [{
            data: shown.map(i => i.count),
            backgroundColor: shown.map(i => i.id === null && i.label === OTHERS_LABEL ? theme.other : theme.series[0]),
            borderRadius: { topRight: 4, bottomRight: 4, topLeft: 0, bottomLeft: 0 },
            borderSkipped: false as const,
            barPercentage: 0.8,
            categoryPercentage: 0.9,
        }],
    }), [shown, theme]);

    const plugins = useMemo(() => [valueLabels(theme.text)], [theme.text]);

    const options = useMemo(() => {
        const base = baseChartOptions(theme);
        const max = Math.max(1, ...shown.map(i => i.count));
        return {
            ...base,
            indexAxis: 'y' as const,
            // Room for the value labels after the longest bar.
            layout: { padding: { right: 48 } },
            onHover: (event: ChartEvent, elements: ActiveElement[]) => {
                const target = event.native?.target as HTMLElement | undefined;
                const clickable = elements.length && shown[elements[0].index]?.id !== null;
                if (target) target.style.cursor = onSelect && clickable ? 'pointer' : 'default';
            },
            onClick: (_event: ChartEvent, elements: ActiveElement[]) => {
                const item = elements[0] ? shown[elements[0].index] : undefined;
                if (onSelect && item && item.id !== null) onSelect(item);
            },
            plugins: {
                ...base.plugins,
                legend: { display: false },
                tooltip: {
                    ...base.plugins.tooltip,
                    callbacks: {
                        label: (ctx: TooltipItem<'bar'>) => {
                            const value = ctx.parsed.x ?? 0;
                            const share = (value / Math.max(1, total) * 100)
                                .toLocaleString('fi-FI', { maximumFractionDigits: 1 });
                            return `${fmt(value)} ${unit} (${share} %)`;
                        },
                    },
                },
            },
            scales: {
                x: { ...axisColours(theme), beginAtZero: true, suggestedMax: max, position: 'top' as const },
                y: { ...axisColours(theme), grid: { display: false },
                    ticks: { ...axisColours(theme).ticks, color: theme.text, autoSkip: false } },
            },
        };
    }, [theme, shown, total, unit, onSelect]);

    const tableRows = useMemo(() => sorted.map((item, i) => ({
        ...item,
        rank: i + 1,
        share: total ? item.count / total * 100 : 0,
    })), [sorted, total]);

    const name = (row: RankedItem) => {
        if (nameTemplate) return nameTemplate(row);
        if (!onSelect || row.id === null) return row.label;
        return <a href="#" onClick={(e) => { e.preventDefault(); onSelect(row); }}>{row.label}</a>;
    };

    return (
        <>
            <div style={{ height: `${shown.length * 26 + 40}px` }}>
                <Bar role="img" aria-label={ariaLabel} data={chartData} options={options} plugins={plugins} />
            </div>
            <DataView label={`Näytä kaikki (${sorted.length})`}>
                <DataTable value={tableRows} size="small" stripedRows paginator rows={25}
                    rowsPerPageOptions={[25, 50, 100]} dataKey="label">
                    <Column field="rank" header="#" style={{ width: '4rem' }} />
                    <Column field="label" header={itemHeader} body={name} sortable />
                    <Column field="count" header={unit.charAt(0).toUpperCase() + unit.slice(1)}
                        body={(r: RankedItem) => fmt(r.count)} style={{ textAlign: 'right', width: '8rem' }} sortable />
                    <Column field="share" header="Osuus"
                        body={(r: { share: number }) => `${r.share.toLocaleString('fi-FI', { maximumFractionDigits: 1 })} %`}
                        style={{ textAlign: 'right', width: '7rem' }} sortable />
                </DataTable>
            </DataView>
        </>
    );
};
