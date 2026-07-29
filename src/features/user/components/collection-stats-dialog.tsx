import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Chart } from 'primereact/chart';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { ProgressSpinner } from 'primereact/progressspinner';

import { getCurrenUser } from '@services/auth-service';
import { getApiContent } from '@services/user-service';

interface QualityDistribution {
    Perfect: number;
    Good: number;
    Decent: number;
    Poor: number;
    not_priced: number;
}

interface TopBook {
    edition_id: number;
    work_id: number;
    title: string;
    author_str: string;
    pubyear: number | null;
    version: number | null;
    price: number;
    match_quality: string;
    condition: string;
    seller: string | null;
    seller_url: string | null;
}

interface NoPriceBook {
    edition_id: number;
    work_id: number;
    title: string;
    author_str: string;
    pubyear: number | null;
    version: number | null;
}

interface PriceRange {
    label: string;
    count: number;
}

interface DistItem {
    name: string;
    count: number;
}

interface CollectionStats {
    total_owned: number;
    priced_count: number;
    total_value: number;
    quality_distribution: QualityDistribution;
    price_distribution: PriceRange[];
    top_expensive: TopBook[];
    no_price_books: NoPriceBook[];
    publisher_distribution: DistItem[];
    language_distribution: DistItem[];
    worktype_distribution: DistItem[];
    short_story_count: number;
    total_pages: number;
    shelf_width_meters: number;
}

const PALETTE = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899',
    '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#94a3b8',
];

interface Props {
    userId: string;
    visible: boolean;
    onHide: () => void;
}

const QUALITY_LABELS: Record<string, string> = {
    Perfect: 'Täydellinen',
    Good: 'Hyvä',
    Decent: 'Kohtalainen',
    Poor: 'Heikko',
};

const QUALITY_COLORS: Record<string, string> = {
    Perfect: 'bg-green-100',
    Good: 'bg-blue-50',
    Decent: '',
    Poor: 'text-400',
};

export const CollectionStatsDialog = ({ userId, visible, onHide }: Props) => {
    const user = useMemo(() => getCurrenUser(), []);

    const { data: stats, isLoading } = useQuery({
        queryKey: ['user', 'collection-stats', userId],
        queryFn: async () => {
            const resp = await getApiContent(`user/${userId}/collection/stats`, user);
            return resp.data as CollectionStats;
        },
        enabled: visible,
    });

    const dist = stats?.quality_distribution;
    const pricedTotal = dist
        ? dist.Perfect + dist.Good + dist.Decent + dist.Poor
        : 0;

    const priceChartData = useMemo(() => {
        const pd = stats?.price_distribution;
        if (!pd || pd.every(r => r.count === 0)) return null;
        return {
            labels: pd.map(r => r.label),
            datasets: [{
                label: 'Kirjoja',
                data: pd.map(r => r.count),
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
                borderRadius: 4,
            }],
        };
    }, [stats?.price_distribution]);

    const priceChartOptions = {
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } },
        },
        responsive: true,
        maintainAspectRatio: false,
    };

    const doughnutData = (items?: DistItem[]) => {
        if (!items || items.length === 0) return null;
        return {
            labels: items.map(i => i.name),
            datasets: [{
                data: items.map(i => i.count),
                backgroundColor: items.map((_, i) => PALETTE[i % PALETTE.length]),
                borderWidth: 0,
            }],
        };
    };
    const doughnutOptions = {
        plugins: {
            legend: {
                position: 'right' as const,
                labels: { boxWidth: 12, font: { size: 11 } },
            },
        },
        responsive: true,
        maintainAspectRatio: false,
    };

    const langChartData = useMemo(() => doughnutData(stats?.language_distribution),
        [stats?.language_distribution]);
    const typeChartData = useMemo(() => doughnutData(stats?.worktype_distribution),
        [stats?.worktype_distribution]);

    const pubChartData = useMemo(() => {
        const d = stats?.publisher_distribution?.slice(0, 10);
        if (!d || d.length === 0) return null;
        return {
            labels: d.map(p => p.name),
            datasets: [{
                label: 'Kirjoja',
                data: d.map(p => p.count),
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
                borderRadius: 4,
            }],
        };
    }, [stats?.publisher_distribution]);
    const pubChartOptions = {
        indexAxis: 'y' as const,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
        responsive: true,
        maintainAspectRatio: false,
    };

    const titleBody = (row: TopBook) => (
        <Link to={`/works/${row.work_id}`} className="no-underline text-primary hover:underline">
            {row.title}
        </Link>
    );

    const editionBody = (row: TopBook) => {
        const parts = [row.pubyear, row.version ? `${row.version}. l.` : null].filter(Boolean);
        return <span className="text-sm text-600">{parts.join(', ') || '—'}</span>;
    };

    const priceBody = (row: TopBook) => (
        <span className="font-semibold">{row.price.toFixed(2)} €</span>
    );

    const sellerBody = (row: TopBook) => (
        <span className="text-sm text-600">
            {row.seller
                ? (row.seller_url
                    ? <a href={row.seller_url} target="_blank" rel="noopener noreferrer">{row.seller}</a>
                    : row.seller)
                : '—'}
        </span>
    );

    const qualityBody = (row: TopBook) => (
        <span className={`text-sm ${QUALITY_COLORS[row.match_quality] ?? ''}`}>
            {QUALITY_LABELS[row.match_quality] ?? row.match_quality}
        </span>
    );

    const rowClass = (row: TopBook) => QUALITY_COLORS[row.match_quality] ?? '';

    return (
        <Dialog
            header="Kokoelman arvo"
            visible={visible}
            onHide={onHide}
            className="w-11 xl:w-7"
            maximizable
        >
            {isLoading || !stats ? (
                <div className="flex justify-content-center p-4">
                    <ProgressSpinner style={{ width: '40px', height: '40px' }} strokeWidth="4" />
                </div>
            ) : (
                <div className="flex flex-column gap-4">
                    {/* Summary stats */}
                    <div className="grid">
                        <div className="col-12 md:col-4">
                            <div className="text-600 text-sm mb-1">Kirjoja yhteensä</div>
                            <div className="text-3xl font-bold">{stats.total_owned}</div>
                        </div>
                        <div className="col-12 md:col-4">
                            <div className="text-600 text-sm mb-1">Hinnoiteltu</div>
                            <div className="text-3xl font-bold">{stats.priced_count}</div>
                            <div className="text-500 text-xs">
                                {stats.total_owned > 0
                                    ? `${Math.round(stats.priced_count / stats.total_owned * 100)} %`
                                    : '—'}
                            </div>
                        </div>
                        <div className="col-12 md:col-4">
                            <div className="text-600 text-sm mb-1">Arvioitu kokonaisarvo</div>
                            <div className="text-3xl font-bold">{stats.total_value.toFixed(2)} €</div>
                        </div>
                    </div>

                    {/* Collection composition counts */}
                    <div className="grid">
                        <div className="col-6 md:col-3">
                            <div className="text-600 text-sm mb-1">Novelleja kokoelmissa</div>
                            <div className="text-2xl font-bold">
                                {stats.short_story_count.toLocaleString('fi-FI')}
                            </div>
                        </div>
                        <div className="col-6 md:col-3">
                            <div className="text-600 text-sm mb-1">Sivuja yhteensä</div>
                            <div className="text-2xl font-bold">
                                {stats.total_pages.toLocaleString('fi-FI')}
                            </div>
                        </div>
                        <div className="col-6 md:col-3">
                            <div className="text-600 text-sm mb-1">Hyllynleveys</div>
                            <div className="text-2xl font-bold">
                                {stats.shelf_width_meters.toLocaleString('fi-FI')} m
                            </div>
                        </div>
                    </div>

                    {/* Publishers */}
                    {pubChartData && (
                        <div>
                            <div className="text-600 text-sm mb-2">Kustantajat (10 yleisintä)</div>
                            <div style={{ height: '260px' }}>
                                <Chart type="bar" data={pubChartData} options={pubChartOptions} style={{ height: '100%' }} />
                            </div>
                        </div>
                    )}

                    {/* Original language + work type */}
                    <div className="grid">
                        {langChartData && (
                            <div className="col-12 md:col-6">
                                <div className="text-600 text-sm mb-2">Alkukieli</div>
                                <div style={{ height: '220px' }}>
                                    <Chart type="doughnut" data={langChartData} options={doughnutOptions} style={{ height: '100%' }} />
                                </div>
                            </div>
                        )}
                        {typeChartData && (
                            <div className="col-12 md:col-6">
                                <div className="text-600 text-sm mb-2">Teostyypit</div>
                                <div style={{ height: '220px' }}>
                                    <Chart type="doughnut" data={typeChartData} options={doughnutOptions} style={{ height: '100%' }} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quality distribution */}
                    {pricedTotal > 0 && (
                        <div>
                            <div className="text-600 text-sm mb-2">Hintojen osuvuus</div>
                            <div className="flex flex-wrap gap-3">
                                {(['Perfect', 'Good', 'Decent', 'Poor'] as const).map(q => (
                                    dist![q] > 0 && (
                                        <div key={q}
                                            className={`border-round p-2 px-3 border-1 border-200 ${QUALITY_COLORS[q]}`}>
                                            <span className="font-semibold">{dist![q]}</span>
                                            <span className="text-sm ml-1 text-600">
                                                {QUALITY_LABELS[q]}
                                            </span>
                                        </div>
                                    )
                                ))}
                                {dist!.not_priced > 0 && (
                                    <div className="border-round p-2 px-3 border-1 border-200 text-400">
                                        <span className="font-semibold">{dist!.not_priced}</span>
                                        <span className="text-sm ml-1">Ei hintaa</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Price range distribution */}
                    {priceChartData && (
                        <div>
                            <div className="text-600 text-sm mb-2">Hintojen jakauma</div>
                            <div style={{ height: '180px' }}>
                                <Chart type="bar" data={priceChartData} options={priceChartOptions} style={{ height: '100%' }} />
                            </div>
                        </div>
                    )}

                    {/* Top 10 most expensive */}
                    {stats.top_expensive.length > 0 && (
                        <div>
                            <div className="text-600 text-sm mb-2">
                                10 arvokkaimmat kirjat
                            </div>
                            <DataTable
                                value={stats.top_expensive}
                                rowClassName={rowClass}
                                size="small"
                                showGridlines={false}
                            >
                                <Column header="#" body={(_row, opts) => opts.rowIndex + 1}
                                    style={{ width: '2rem' }} />
                                <Column header="Teos" body={titleBody} />
                                <Column header="Tekijä"
                                    field="author_str"
                                    style={{ minWidth: '8rem' }} />
                                <Column header="Painos" body={editionBody}
                                    style={{ minWidth: '6rem' }} />
                                <Column header="Kunto" field="condition"
                                    style={{ width: '4rem' }} />
                                <Column header="Hinta" body={priceBody}
                                    style={{ width: '6rem' }} />
                                <Column header="Myyjä" body={sellerBody}
                                    style={{ minWidth: '8rem' }} />
                                <Column header="Osuvuus" body={qualityBody}
                                    style={{ minWidth: '7rem' }} />
                            </DataTable>
                        </div>
                    )}

                    {stats.no_price_books.length > 0 && (
                        <div className="border-round p-2 px-3 border-1 border-200 text-400 inline-block">
                            <span className="font-semibold">{stats.no_price_books.length}</span>
                            <span className="text-sm ml-1">Hintaa ei löydy</span>
                        </div>
                    )}

                    {stats.priced_count === 0 && stats.no_price_books.length === 0 && (
                        <p className="text-600 text-center">
                            Omistetuille kirjoille ei löydy Antikvaari-hintoja.
                        </p>
                    )}
                </div>
            )}
        </Dialog>
    );
};
