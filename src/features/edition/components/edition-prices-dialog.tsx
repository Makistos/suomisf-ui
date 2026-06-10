import React, { useRef, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { ConfirmPopup, confirmPopup } from 'primereact/confirmpopup';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';

import { getOwnership } from '@api/edition/get-ownership';
import { getCurrenUser } from '@services/auth-service';
import { deleteApiContent, getApiContent } from '@services/user-service';
import { Edition, CombinedEdition } from '../types';

interface PriceRow {
    id: number;
    antikvaari_product_year: number | null;
    antikvaari_product_binding: number | null;
    antikvaari_product_version: number | null;
    date_listed: string | null;
    last_updated: string | null;
    date_fetched: string | null;
    condition: string;
    is_library_discard: boolean;
    has_markings: boolean;
    missing_dust_cover: boolean;
    price: number;
    match_quality: 'Perfect' | 'Good' | 'Decent' | 'Poor' | null;
    product_url: string | null;
    product_page_exists: boolean | null;
}

interface Props {
    edition: Edition | CombinedEdition;
    workTitle?: string;
    visible: boolean;
    onHide: () => void;
}

const QUALITY_RANK: Record<string, number> = { Perfect: 0, Good: 1, Decent: 2, Poor: 3 };
const BINDING_LABELS: Record<number, string> = { 1: 'Ei tietoa', 2: 'Nidottu', 3: 'Sidottu' };
const TEN_YEARS_MS = 10 * 365.25 * 24 * 60 * 60 * 1000;

function formatDate(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Date.now() - d.getTime() > TEN_YEARS_MS) return '—';
    return d.toLocaleDateString('fi-FI');
}

const SWATCH: React.CSSProperties = { display: 'inline-block', width: '12px', height: '12px', borderRadius: '2px', flexShrink: 0 };

const Legend = () => (
    <div className="flex align-items-center gap-3 text-sm text-600 flex-wrap">
        <span className="flex align-items-center gap-1">
            <span className="bg-green-100 border-1 border-300" style={SWATCH} />
            Täydellinen osuma
        </span>
        <span className="flex align-items-center gap-1">
            <span className="bg-blue-50 border-1 border-300" style={SWATCH} />
            Hyvä osuma
        </span>
        <span className="flex align-items-center gap-1">
            <span className="surface-0 border-1 border-300" style={SWATCH} />
            Kohtalainen
        </span>
        <span className="flex align-items-center gap-1 text-400">
            <span className="surface-0 border-1 border-300" style={SWATCH} />
            Heikko
        </span>
    </div>
);

export const EditionPricesDialog = ({ edition, workTitle, visible, onHide }: Props) => {
    const user = useMemo(() => getCurrenUser(), []);
    const queryClient = useQueryClient();
    const toastRef = useRef<Toast>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const { data: ownership } = useQuery({
        queryKey: ['edition', 'owner', edition.id],
        queryFn: () => getOwnership(edition.id, user!),
        enabled: visible && !!user,
    });

    const targetCondition = ownership?.condition?.value
        ? `K${ownership.condition.value}`
        : undefined;

    const { data: rawPrices, isLoading } = useQuery({
        queryKey: ['edition', 'prices', edition.id, targetCondition],
        queryFn: async () => {
            const qs = targetCondition ? `?target_condition=${targetCondition}` : '';
            const resp = await getApiContent(`edition/${edition.id}/antikvaari/prices${qs}`, user);
            return resp.data as PriceRow[];
        },
        enabled: visible && !!user,
    });

    const prices = useMemo(() => {
        if (!rawPrices) return [];
        return rawPrices.slice().sort((a, b) => {
            const da = a.last_updated ? new Date(a.last_updated).getTime() : 0;
            const db = b.last_updated ? new Date(b.last_updated).getTime() : 0;
            return db - da;
        });
    }, [rawPrices]);

    const bestMatchIndex = useMemo(() => {
        if (!targetCondition) return -1;
        const perfectIdx = prices.findIndex(r => r.match_quality === 'Perfect');
        if (perfectIdx >= 0) return perfectIdx;
        return prices.findIndex(r => r.match_quality === 'Good');
    }, [prices, targetCondition]);

    const minPrice = prices.length ? Math.min(...prices.map(r => r.price)) : null;
    const maxPrice = prices.length ? Math.max(...prices.map(r => r.price)) : null;
    const bestPrice = bestMatchIndex >= 0 ? prices[bestMatchIndex].price : null;

    const editionLabel = [
        edition.pubyear,
        edition.version ? `${edition.version}. painos` : null,
    ].filter(Boolean).join(', ');

    const title = [workTitle, editionLabel].filter(Boolean).join(' — ');

    const handleDelete = async (priceId: number) => {
        setDeletingId(priceId);
        try {
            await deleteApiContent(`antikvaari/prices/${priceId}`);
            await queryClient.invalidateQueries({ queryKey: ['edition', 'prices', edition.id] });
            toastRef.current?.show({ severity: 'success', summary: 'Hinta poistettu' });
        } catch {
            toastRef.current?.show({ severity: 'error', summary: 'Poisto epäonnistui' });
        } finally {
            setDeletingId(null);
        }
    };

    const confirmDelete = (event: React.MouseEvent<HTMLButtonElement>, priceId: number) => {
        confirmPopup({
            target: event.currentTarget,
            message: 'Poistetaanko hinta?',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Poista',
            rejectLabel: 'Peruuta',
            acceptClassName: 'p-button-danger p-button-sm',
            accept: () => handleDelete(priceId),
        });
    };

    const rowClass = (row: PriceRow) => {
        switch (row.match_quality) {
            case 'Perfect': return 'bg-green-100';
            case 'Good': return 'bg-blue-50';
            case 'Poor': return 'text-400';
            default: return '';
        }
    };

    const conditionBody = (row: PriceRow, rowIndex: number) => {
        const flags = [
            row.is_library_discard && 'Kirjaston poisto',
            row.has_markings && 'Merkintöjä',
            row.missing_dust_cover && 'Ei kansipaperia',
        ].filter(Boolean) as string[];
        return (
            <div className="flex flex-column gap-1">
                <span className="flex align-items-center gap-1">
                    {rowIndex === bestMatchIndex && (
                        <i className="pi pi-star-fill text-yellow-500 text-xs" />
                    )}
                    {row.condition || '—'}
                    {row.product_page_exists && row.product_url && (
                        <a href={row.product_url} target="_blank" rel="noopener noreferrer"
                            className="text-400 hover:text-primary ml-1" title="Avaa tuotesivu Antikvaari.fi:ssä">
                            <i className="pi pi-external-link text-xs" />
                        </a>
                    )}
                </span>
                {flags.map(f => (
                    <Tag key={f} value={f} severity="warning" className="text-xs" />
                ))}
            </div>
        );
    };

    const priceBody = (row: PriceRow) => (
        <span className="font-semibold white-space-nowrap">
            {row.price != null ? `${row.price.toFixed(2)} €` : '—'}
        </span>
    );

    const listingBody = (row: PriceRow) => {
        const parts = [
            edition.pubyear || null,
            row.antikvaari_product_binding != null
                ? BINDING_LABELS[row.antikvaari_product_binding] : null,
            edition.editionnum ? `${edition.editionnum}. p.` : null,
        ].filter(Boolean);
        return <span className="text-sm">{parts.join(' · ') || '—'}</span>;
    };

    return (
        <Dialog
            header={`Antikvaari-hinnat${title ? ` — ${title}` : ''}`}
            visible={visible}
            onHide={onHide}
            className="w-11 xl:w-9"
            maximizable
        >
            <Toast ref={toastRef} />
            <ConfirmPopup />
            {isLoading ? (
                <div className="flex justify-content-center p-4">
                    <ProgressSpinner style={{ width: '40px', height: '40px' }} strokeWidth="4" />
                </div>
            ) : prices.length === 0 ? (
                <p className="text-600 text-center p-4">Ei tallennettuja hintoja.</p>
            ) : (
                <div className="flex flex-column gap-3">
                    <div className="flex align-items-center gap-4 text-sm text-600 flex-wrap">
                        <span>{prices.length} hintaa</span>
                        {minPrice != null && maxPrice != null && (
                            <span>
                                {minPrice === maxPrice
                                    ? `${minPrice.toFixed(2)} €`
                                    : `${minPrice.toFixed(2)} – ${maxPrice.toFixed(2)} €`}
                            </span>
                        )}
                        {targetCondition && (
                            <span>Oma kunto: <strong>{targetCondition}</strong></span>
                        )}
                        {bestPrice != null && (
                            <span>
                                Paras osuma: <strong>{bestPrice.toFixed(2)} €</strong>
                            </span>
                        )}
                    </div>

                    <Legend />

                    <DataTable
                        value={prices}
                        rowClassName={rowClass}
                        paginator
                        rows={25}
                        size="small"
                        stripedRows={false}
                        emptyMessage="Ei hintoja"
                    >
                        <Column
                            header="Kunto"
                            body={(row, opts) => conditionBody(row, opts.rowIndex)}
                            style={{ minWidth: '8rem' }}
                        />
                        <Column
                            header="Hinta"
                            body={priceBody}
                            style={{ minWidth: '6rem' }}
                        />
                        <Column
                            header="Ilmoitus"
                            body={listingBody}
                            style={{ minWidth: '10rem' }}
                        />
                        <Column
                            header="Päivitetty"
                            body={(row: PriceRow) => formatDate(row.last_updated)}
                            style={{ minWidth: '7rem' }}
                        />
                        <Column
                            header="Haettu"
                            body={(row: PriceRow) => formatDate(row.date_fetched)}
                            style={{ minWidth: '7rem' }}
                        />
                        <Column
                            body={(row: PriceRow) => (
                                <Button
                                    icon="pi pi-trash"
                                    size="small"
                                    severity="danger"
                                    text
                                    loading={deletingId === row.id}
                                    onClick={e => confirmDelete(e, row.id)}
                                />
                            )}
                            style={{ width: '3rem' }}
                        />
                    </DataTable>
                </div>
            )}
        </Dialog>
    );
};
