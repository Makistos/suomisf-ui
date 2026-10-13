import { ReactNode } from 'react';
import { Card } from 'primereact/card';

interface StatCardProps {
    title: string;
    // What is counted and how, e.g. "Teoksia. Teos lasketaan jokaiseen genreensä."
    subtitle?: ReactNode;
    // Toggles that regroup this card's own data (filters for the whole tab
    // belong in the tab's FilterBar).
    controls?: ReactNode;
    children: ReactNode;
    className?: string;
}

// One card = one statistic: a title, the unit it counts, the chart and its
// table view.
export const StatCard = ({ title, subtitle, controls, children, className }: StatCardProps) => (
    <Card className={`shadow-2 h-full stat-card ${className ?? ''}`}>
        <h3 className="mt-0 mb-1">{title}</h3>
        {subtitle && <p className="text-sm text-600 mt-0 mb-3">{subtitle}</p>}
        {controls && (
            <div className="flex align-items-center gap-3 mb-3 flex-wrap">{controls}</div>
        )}
        {children}
    </Card>
);

// The table view every chart has: collapsed under the chart.
export const DataView = ({ label = 'Näytä data', children }: { label?: string; children: ReactNode }) => (
    <details className="mt-3 text-left">
        <summary className="cursor-pointer text-color-secondary">{label}</summary>
        <div className="mt-3">{children}</div>
    </details>
);

// One row of filters at the top of a tab; applies to every card in it.
export const FilterBar = ({ children }: { children: ReactNode }) => (
    <div className="flex align-items-center gap-3 mb-3 flex-wrap stats-filter-bar" role="group" aria-label="Suodattimet">
        {children}
    </div>
);
