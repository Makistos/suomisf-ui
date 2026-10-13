import { ReactNode } from 'react';

export interface StatTile {
    label: string;
    value: number;
    // Optional line under the value, e.g. a unit or what the figure means.
    note?: ReactNode;
}

const fmt = (n: number) => n.toLocaleString('fi-FI');

// Headline figures as a row of tiles. `columnClass` sets the tile width
// (PrimeFlex grid classes); the default suits a full-width row.
export const StatTiles = ({ tiles, columnClass = 'col-6 md:col-4 lg:col-3' }: {
    tiles: StatTile[];
    columnClass?: string;
}) => (
    <div className="grid">
        {tiles.map(t => (
            <div key={t.label} className={columnClass}>
                <div className="surface-card shadow-1 border-round p-3 h-full">
                    <div className="text-sm text-600 mb-1">{t.label}</div>
                    <div className="text-3xl font-bold">{fmt(t.value)}</div>
                    {t.note && <div className="text-sm text-600 mt-1">{t.note}</div>}
                </div>
            </div>
        ))}
    </div>
);

// A share against a whole, e.g. hardbacks among first editions.
export const Meter = ({ label, part, whole, note }: { label: string; part: number; whole: number; note?: ReactNode }) => {
    const percent = whole ? (part / whole) * 100 : 0;
    const shown = percent.toLocaleString('fi-FI', { maximumFractionDigits: 1 });
    return (
        <div>
            <div className="flex justify-content-between mb-1">
                <span>{label}</span>
                <span className="font-bold">{shown} %</span>
            </div>
            {/* A share, not progress: role="meter", drawn like the theme's progress bar. */}
            <div role="meter" aria-label={label} aria-valuenow={Math.round(percent)}
                aria-valuemin={0} aria-valuemax={100} aria-valuetext={`${shown} %`}
                className="border-round overflow-hidden"
                style={{ height: '0.625rem', background: 'var(--highlight-bg)' }}>
                <div style={{ width: `${percent}%`, height: '100%', background: 'var(--primary-color)' }} />
            </div>
            {note && <div className="text-sm text-600 mt-1">{note}</div>}
        </div>
    );
};
