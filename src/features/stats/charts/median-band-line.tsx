import { useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
    TooltipItem,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { axisColours, baseChartOptions, useChartTheme } from './use-chart-theme';
import { DataView } from './stat-card';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export interface QuartilePoint {
    key: number;
    label: string;
    // How many items the quartiles are computed from; 0 leaves a gap.
    count: number;
    q1: number;
    median: number;
    q3: number;
}

interface MedianBandLineProps {
    points: QuartilePoint[];
    // Unit after a value: "vuotta", "sivua"…
    valueUnit: string;
    // Plural of the items behind a point: "teosta", "painosta"…
    countUnit: string;
    // Table header for the counts: "Teoksia", "Painoksia"…
    countHeader: string;
    // Value axis title, e.g. "Vuosia".
    axisTitle: string;
    // Header for the point labels in the table: "Vuosi", "Vuosikymmen".
    labelHeader: string;
    ariaLabel: string;
    // Leave out points computed from fewer items than this (noisy).
    minCount?: number;
}

const num = (n: number) => n.toLocaleString('fi-FI', { maximumFractionDigits: 1 });

// The median of a measure over time as a line, with the middle half of the
// values (lower to upper quartile) as a shaded band around it.
export const MedianBandLine = ({
    points, valueUnit, countUnit, countHeader, axisTitle, labelHeader, ariaLabel, minCount = 1,
}: MedianBandLineProps) => {
    const theme = useChartTheme();
    const colour = theme.series[0];
    const shown = useMemo(() => points.map(p => p.count >= minCount ? p : null), [points, minCount]);

    const chartData = useMemo(() => {
        const pick = (f: (p: QuartilePoint) => number) => shown.map(p => p ? f(p) : null);
        const edge = { borderWidth: 0, pointRadius: 0, pointHoverRadius: 0, tension: 0.2, spanGaps: false };
        return {
            labels: points.map(p => p.label),
            datasets: [
                // Upper quartile, filled down to the lower quartile below it.
                { label: 'Yläkvartiili', data: pick(p => p.q3), fill: '+1', backgroundColor: `${colour}33`, borderColor: colour, ...edge },
                { label: 'Alakvartiili', data: pick(p => p.q1), fill: false, backgroundColor: `${colour}33`, borderColor: colour, ...edge },
                { label: 'Mediaani', data: pick(p => p.median), fill: false, borderColor: colour, backgroundColor: colour,
                    borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, tension: 0.2, spanGaps: false },
            ],
        };
    }, [points, shown, colour]);

    const options = useMemo(() => {
        const base = baseChartOptions(theme);
        return {
            ...base,
            interaction: { mode: 'index' as const, intersect: false },
            plugins: {
                ...base.plugins,
                legend: { display: false },
                tooltip: {
                    ...base.plugins.tooltip,
                    // One tooltip line set per point, from the median dataset.
                    filter: (item: TooltipItem<'line'>) => item.datasetIndex === 2,
                    callbacks: {
                        label: (ctx: TooltipItem<'line'>) => {
                            const p = shown[ctx.dataIndex];
                            if (!p) return '';
                            return [
                                `Mediaani: ${num(p.median)} ${valueUnit}`,
                                `Keskimmäinen puolikas: ${num(p.q1)}–${num(p.q3)} ${valueUnit}`,
                                `${p.count.toLocaleString('fi-FI')} ${countUnit}`,
                            ];
                        },
                    },
                },
            },
            scales: {
                x: { ...axisColours(theme), grid: { display: false },
                    ticks: { ...axisColours(theme).ticks, maxRotation: 0, autoSkipPadding: 12 } },
                y: { ...axisColours(theme), beginAtZero: true,
                    title: { display: true, text: axisTitle, color: theme.textSecondary } },
            },
        };
    }, [theme, shown, valueUnit, countUnit, axisTitle]);

    return (
        <>
            <div className="flex align-items-center gap-3 text-sm mb-2" aria-hidden="true">
                <span className="flex align-items-center gap-2">
                    <span style={{ width: 16, height: 2, background: colour, display: 'inline-block' }} />Mediaani
                </span>
                <span className="flex align-items-center gap-2">
                    <span style={{ width: 16, height: 10, background: `${colour}33`, display: 'inline-block' }} />
                    Keskimmäinen puolikas (ala- ja yläkvartiilin väli)
                </span>
            </div>
            <div style={{ height: '300px' }}>
                <Line role="img" aria-label={ariaLabel} data={chartData} options={options} />
            </div>
            <DataView>
                <table className="w-full text-sm">
                    <thead>
                        <tr>
                            <th className="text-left">{labelHeader}</th>
                            <th className="text-right">Alakvartiili</th>
                            <th className="text-right">Mediaani</th>
                            <th className="text-right">Yläkvartiili</th>
                            <th className="text-right">{countHeader}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {points.filter(p => p.count > 0).map(p => (
                            <tr key={p.key}>
                                <td>{p.label}</td>
                                <td className="text-right">{num(p.q1)}</td>
                                <td className="text-right">{num(p.median)}</td>
                                <td className="text-right">{num(p.q3)}</td>
                                <td className="text-right">{p.count.toLocaleString('fi-FI')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </DataView>
        </>
    );
};
