import { useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    ChartEvent,
    ActiveElement,
    TooltipItem,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { axisColours, baseChartOptions, useChartTheme } from './use-chart-theme';
import { DataView } from './stat-card';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export interface HistogramBin {
    key: number;
    // Axis and table label, e.g. "0", "10–19", "1 000+".
    label: string;
    count: number;
}

interface HistogramProps {
    bins: HistogramBin[];
    // Plural of what is counted: "teosta", "painosta"…
    unit: string;
    // What the bins measure, for the x axis and table: "Vuosia", "Sivuja"…
    binTitle: string;
    // Value axis title, e.g. "Teoksia".
    axisTitle: string;
    ariaLabel: string;
    height?: number;
    onSelect?: (bin: HistogramBin) => void;
}

const fmt = (n: number) => n.toLocaleString('fi-FI');
const pct = (n: number) => `${n.toLocaleString('fi-FI', { maximumFractionDigits: 1 })} %`;

// A distribution: one bar per bin, bins side by side in value order, one
// colour. Bins may be uneven (e.g. 0, 1, 2 … 10–19, 20+); their labels say so.
export const Histogram = ({
    bins, unit, binTitle, axisTitle, ariaLabel, height = 300, onSelect,
}: HistogramProps) => {
    const theme = useChartTheme();
    const total = useMemo(() => bins.reduce((sum, b) => sum + b.count, 0), [bins]);

    const chartData = useMemo(() => ({
        labels: bins.map(b => b.label),
        datasets: [{
            data: bins.map(b => b.count),
            backgroundColor: theme.series[0],
            hoverBackgroundColor: theme.series[0],
            borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
            borderSkipped: false as const,
            // Bins touch; a 2px surface gap keeps them apart.
            borderColor: theme.surface,
            borderWidth: { left: 1, right: 1 },
            barPercentage: 1,
            categoryPercentage: 1,
        }],
    }), [bins, theme]);

    const options = useMemo(() => {
        const base = baseChartOptions(theme);
        return {
            ...base,
            onHover: (event: ChartEvent, elements: ActiveElement[]) => {
                const target = event.native?.target as HTMLElement | undefined;
                if (target) target.style.cursor = onSelect && elements.length ? 'pointer' : 'default';
            },
            onClick: (_event: ChartEvent, elements: ActiveElement[]) => {
                if (onSelect && elements[0]) onSelect(bins[elements[0].index]);
            },
            plugins: {
                ...base.plugins,
                legend: { display: false },
                tooltip: {
                    ...base.plugins.tooltip,
                    callbacks: {
                        title: (items: TooltipItem<'bar'>[]) => `${binTitle}: ${items[0]?.label ?? ''}`,
                        label: (ctx: TooltipItem<'bar'>) => {
                            const value = ctx.parsed.y ?? 0;
                            return `${fmt(value)} ${unit} (${pct(total ? value / total * 100 : 0)})`;
                        },
                    },
                },
            },
            scales: {
                x: { ...axisColours(theme), grid: { display: false },
                    title: { display: true, text: binTitle, color: theme.textSecondary },
                    ticks: { ...axisColours(theme).ticks, maxRotation: 0, autoSkipPadding: 8 } },
                y: { ...axisColours(theme), beginAtZero: true,
                    title: { display: true, text: axisTitle, color: theme.textSecondary } },
            },
        };
    }, [theme, bins, total, unit, binTitle, axisTitle, onSelect]);

    return (
        <>
            <div style={{ height: `${height}px` }}>
                <Bar role="img" aria-label={ariaLabel} data={chartData} options={options} />
            </div>
            <DataView>
                <table className="w-full text-sm">
                    <thead>
                        <tr>
                            <th className="text-left">{binTitle}</th>
                            <th className="text-right">{axisTitle}</th>
                            <th className="text-right">Osuus</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bins.filter(b => b.count > 0).map(b => (
                            <tr key={b.key}>
                                <td>{b.label}</td>
                                <td className="text-right">
                                    {onSelect
                                        ? <a href="#" onClick={(e) => { e.preventDefault(); onSelect(b); }}>{fmt(b.count)}</a>
                                        : fmt(b.count)}
                                </td>
                                <td className="text-right">{pct(total ? b.count / total * 100 : 0)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </DataView>
        </>
    );
};
