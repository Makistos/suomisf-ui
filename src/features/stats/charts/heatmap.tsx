import { useMemo, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { DataView } from './stat-card';
import './stats-charts.css';

export interface HeatmapRow {
    id: number | null;
    label: string;
    // One value per column.
    values: number[];
}

interface HeatmapProps {
    rows: HeatmapRow[];
    columns: { key: number; label: string }[];
    // Plural of what is counted: "teosta", "numeroa"…
    unit: string;
    rowHeader: string;
    caption: string;
    // Write column labels vertically (for many narrow columns).
    verticalLabels?: boolean;
    onSelect?: (row: HeatmapRow, columnIndex: number) => void;
}

const fmt = (n: number) => n.toLocaleString('fi-FI');

// Square-root scale, so small values next to one large one stay visible.
const shade = (value: number, max: number) => {
    const t = Math.sqrt(value / Math.max(1, max));
    return `color-mix(in srgb, var(--primary-color) ${Math.round(22 + 78 * t)}%, var(--surface-card))`;
};

// A grid of rows (publishers, magazines…) by columns (years, decades) with
// one-hue shading for the count. Each cell is a button labelled with its
// value, so the numbers are reachable by keyboard and screen readers; a
// readout line shows the hovered or focused cell.
export const Heatmap = ({
    rows, columns, unit, rowHeader, caption, verticalLabels, onSelect,
}: HeatmapProps) => {
    const [readout, setReadout] = useState('');
    const max = useMemo(() => Math.max(0, ...rows.flatMap(r => r.values)), [rows]);

    const describe = (row: HeatmapRow, ci: number) =>
        `${row.label}, ${columns[ci].label}: ${fmt(row.values[ci])} ${unit}`;

    const tableRows = useMemo(() => rows.map(r => ({
        label: r.label,
        total: r.values.reduce((a, b) => a + b, 0),
        ...Object.fromEntries(r.values.map((v, i) => [`c${i}`, v])),
    })), [rows]);

    return (
        <>
            <div className="heatmap-scroll">
                <table className="heatmap">
                    <caption className="p-hidden-accessible">{caption}</caption>
                    <thead>
                        <tr>
                            <th scope="col"><span className="p-hidden-accessible">{rowHeader}</span></th>
                            {columns.map(c => (
                                <th key={c.key} scope="col" className={verticalLabels ? 'heatmap-vertical' : undefined}>
                                    {c.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(row => (
                            <tr key={row.label}>
                                <th scope="row" title={row.label}>{row.label}</th>
                                {row.values.map((v, ci) => {
                                    const clickable = !!onSelect && v > 0 && row.id !== null;
                                    return (
                                        <td key={columns[ci].key}>
                                            <button
                                                type="button"
                                                className={`heatmap-cell${v === 0 ? ' heatmap-empty' : ''}${clickable ? ' heatmap-clickable' : ''}`}
                                                style={v > 0 ? { background: shade(v, max) } : undefined}
                                                aria-label={describe(row, ci)}
                                                onMouseEnter={() => setReadout(describe(row, ci))}
                                                onFocus={() => setReadout(describe(row, ci))}
                                                onClick={clickable ? () => onSelect!(row, ci) : undefined}
                                            />
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-content-between align-items-center flex-wrap gap-2 mt-2">
                <div className="heatmap-readout" aria-live="polite">{readout}</div>
                <div className="heatmap-legend" aria-hidden="true">
                    <span>1</span>
                    <span className="heatmap-legend-bar" />
                    <span>{fmt(max)} {unit}</span>
                </div>
            </div>
            <DataView>
                <DataTable value={tableRows} size="small" stripedRows scrollable dataKey="label">
                    <Column field="label" header={rowHeader} frozen sortable />
                    {columns.map((c, i) => (
                        <Column key={c.key} field={`c${i}`} header={c.label} sortable
                            body={(r: Record<string, number>) => r[`c${i}`] ? fmt(r[`c${i}`]) : ''}
                            style={{ textAlign: 'right' }} />
                    ))}
                    <Column field="total" header="Yhteensä" sortable
                        body={(r: { total: number }) => fmt(r.total)} style={{ textAlign: 'right' }} />
                </DataTable>
            </DataView>
        </>
    );
};
