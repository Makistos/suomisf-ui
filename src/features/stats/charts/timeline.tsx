import { ReactNode, useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    TooltipItem,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { axisColours, baseChartOptions, useChartTheme } from './use-chart-theme';
import { DataView } from './stat-card';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export interface TimelineItem {
    id: number | null;
    label: string;
    // First and last year, inclusive.
    start: number;
    end: number;
    // What the item has in that time (works, issues…), for tooltip and table.
    count: number;
}

interface TimelineProps {
    items: TimelineItem[];
    // Plural after a number: "teosta", "numeroa"…
    unit: string;
    // Header for the count column: "Teoksia", "Numeroita"…
    countHeader: string;
    itemHeader: string;
    ariaLabel: string;
    nameTemplate?: (item: TimelineItem) => ReactNode;
}

const fmt = (n: number) => n.toLocaleString('fi-FI');
const span = (i: TimelineItem) => i.start === i.end ? String(i.start) : `${i.start}–${i.end}`;

const LABEL_MAX = 28;
const shorten = (label: string) =>
    label.length > LABEL_MAX ? `${label.slice(0, LABEL_MAX - 1).trimEnd()}…` : label;

// Spans of years as floating horizontal bars on a shared year axis, one row
// per item in the given order.
export const Timeline = ({ items, unit, countHeader, itemHeader, ariaLabel, nameTemplate }: TimelineProps) => {
    const theme = useChartTheme();

    const chartData = useMemo(() => ({
        labels: items.map(i => i.label),
        datasets: [{
            // A span covers its whole last year, so it ends at end + 1.
            data: items.map(i => [i.start, i.end + 1] as [number, number]),
            backgroundColor: theme.series[0],
            hoverBackgroundColor: theme.series[0],
            borderRadius: 4,
            borderSkipped: false as const,
            barPercentage: 0.7,
            categoryPercentage: 0.9,
        }],
    }), [items, theme]);

    const options = useMemo(() => {
        const base = baseChartOptions(theme);
        const years = items.flatMap(i => [i.start, i.end + 1]);
        return {
            ...base,
            indexAxis: 'y' as const,
            plugins: {
                ...base.plugins,
                legend: { display: false },
                tooltip: {
                    ...base.plugins.tooltip,
                    callbacks: {
                        title: (ctx: TooltipItem<'bar'>[]) => items[ctx[0]?.dataIndex ?? 0]?.label ?? '',
                        label: (ctx: TooltipItem<'bar'>) => {
                            const item = items[ctx.dataIndex];
                            return `${span(item)} · ${fmt(item.count)} ${unit}`;
                        },
                    },
                },
            },
            scales: {
                x: { ...axisColours(theme), type: 'linear' as const, position: 'top' as const,
                    // Whole decades at both ends, so the ticks fall on round years.
                    min: Math.floor(Math.min(...years) / 10) * 10, max: Math.ceil(Math.max(...years) / 10) * 10,
                    ticks: { ...axisColours(theme).ticks, stepSize: 10, callback: (v: string | number) => String(v),
                        maxRotation: 0, autoSkipPadding: 8 } },
                y: { ...axisColours(theme), grid: { display: false },
                    ticks: { ...axisColours(theme).ticks, color: theme.text, autoSkip: false,
                        callback: (_v: string | number, i: number) => shorten(items[i]?.label ?? '') } },
            },
        };
    }, [theme, items, unit]);

    return (
        <>
            <div style={{ height: `${items.length * 22 + 50}px` }}>
                <Bar role="img" aria-label={ariaLabel} data={chartData} options={options} />
            </div>
            <DataView>
                <DataTable value={items} size="small" stripedRows dataKey="label" paginator rows={25}
                    rowsPerPageOptions={[25, 50, 100]}>
                    <Column field="label" header={itemHeader} sortable
                        body={(i: TimelineItem) => nameTemplate ? nameTemplate(i) : i.label} />
                    <Column field="start" header="Ensimmäinen" sortable style={{ width: '8rem' }} />
                    <Column field="end" header="Viimeinen" sortable style={{ width: '8rem' }} />
                    <Column field="count" header={countHeader} sortable body={(i: TimelineItem) => fmt(i.count)}
                        style={{ textAlign: 'right', width: '7rem' }} />
                </DataTable>
            </DataView>
        </>
    );
};
