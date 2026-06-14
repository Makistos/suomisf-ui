import React, { useRef, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { Column } from 'primereact/column';
import { ConfirmPopup, confirmPopup } from 'primereact/confirmpopup';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';

import { getOwnership } from '@api/edition/get-ownership';
import { getCurrenUser } from '@services/auth-service';
import { deleteApiContent, getApiContent, postApiContent } from '@services/user-service';
import { Edition, CombinedEdition } from '../types';

interface PriceRow {
    id: number;
    source_id: number | null;
    source_name: string | null;
    book_id: string | null;
    url: string | null;
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

interface PriceSource {
    id: number;
    name: string;
}

interface Props {
    edition: Edition | CombinedEdition;
    workTitle?: string;
    visible: boolean;
    onHide: () => void;
}

const BINDING_LABELS: Record<number, string> = { 1: 'Ei tietoa', 2: 'Nidottu', 3: 'Sidottu' };
const TEN_YEARS_MS = 10 * 365.25 * 24 * 60 * 60 * 1000;
const CONDITIONS = ['K5', 'K4', 'K3', 'K2', 'K1'];

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

const emptyForm = { url: '', source_id: null as number | null, book_id: '', condition: '', price: null as number | null, last_updated: null as Date | null, is_library_discard: false, has_markings: false, missing_dust_cover: false };

export const EditionPricesDialog = ({ edition, workTitle, visible, onHide }: Props) => {
    const user = useMemo(() => getCurrenUser(), []);
    const queryClient = useQueryClient();
    const toastRef = useRef<Toast>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [fetching, setFetching] = useState(false);

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

    const { data: sources } = useQuery({
        queryKey: ['price-sources'],
        queryFn: async () => {
            const resp = await getApiContent('price-sources', user);
            return resp.data as PriceSource[];
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

    const handleFetchUrl = async () => {
        if (!form.url.trim()) return;
        setFetching(true);
        try {
            const resp = await postApiContent('prices/scrape-url', { url: form.url.trim() }, user);
            const d = resp.response as any;
            setForm(f => ({
                ...f,
                source_id: d.source_id ?? f.source_id,
                book_id: d.book_id ?? f.book_id,
                condition: d.condition ?? f.condition,
                price: d.price ?? f.price,
                last_updated: d.last_updated ? new Date(d.last_updated) : f.last_updated,
            }));
        } catch {
            toastRef.current?.show({ severity: 'error', summary: 'Sivun haku epäonnistui' });
        } finally {
            setFetching(false);
        }
    };

    const handleSaveManual = async () => {
        if (!form.source_id || !form.condition || form.price == null) return;
        setSaving(true);
        try {
            await postApiContent(`edition/${edition.id}/prices/manual`, {
                source_id: form.source_id,
                book_id: form.book_id || null,
                url: form.url || null,
                condition: form.condition,
                price: form.price,
                last_updated: form.last_updated ? form.last_updated.toISOString() : new Date().toISOString(),
                is_library_discard: form.is_library_discard,
                has_markings: form.has_markings,
                missing_dust_cover: form.missing_dust_cover,
            }, user);
            await queryClient.invalidateQueries({ queryKey: ['edition', 'prices', edition.id] });
            toastRef.current?.show({ severity: 'success', summary: 'Hinta tallennettu' });
            setForm(emptyForm);
            setShowForm(false);
        } catch {
            toastRef.current?.show({ severity: 'error', summary: 'Tallennus epäonnistui' });
        } finally {
            setSaving(false);
        }
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
            row.is_library_discard && 'Kirjastonpoisto',
            row.has_markings && 'Merkintöjä',
            row.missing_dust_cover && 'Kansipaperi puuttuu',
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
        const bindingName = row.antikvaari_product_binding != null
            ? BINDING_LABELS[row.antikvaari_product_binding]
            : (edition.binding?.id > 1 ? edition.binding?.name : null);
        const parts = [
            edition.pubyear || null,
            bindingName || null,
            edition.editionnum ? `${edition.editionnum}. p.` : null,
        ].filter(Boolean);
        return <span className="text-sm">{parts.join(' · ') || '—'}</span>;
    };

    const sourceBody = (row: PriceRow) => (
        <span className="text-sm">
            {row.url
                ? <a href={row.url} target="_blank" rel="noopener noreferrer">{row.source_name ?? '—'}</a>
                : (row.source_name ?? '—')}
        </span>
    );

    const formValid = form.source_id != null && form.condition !== '' && form.price != null;

    return (
        <Dialog
            header={`Hinnat${title ? ` — ${title}` : ''}`}
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
            ) : (
                <div className="flex flex-column gap-3">
                    {prices.length > 0 && (
                        <>
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
                                    header="Lähde"
                                    body={sourceBody}
                                    style={{ minWidth: '8rem' }}
                                />
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
                        </>
                    )}

                    {prices.length === 0 && !showForm && (
                        <p className="text-600 text-center p-4">Ei tallennettuja hintoja.</p>
                    )}

                    {!showForm ? (
                        <div>
                            <Button
                                label="Lisää hinta"
                                icon="pi pi-plus"
                                size="small"
                                outlined
                                onClick={() => setShowForm(true)}
                            />
                        </div>
                    ) : (
                        <div className="border-1 border-300 border-round p-3 flex flex-column gap-3">
                            <span className="font-semibold">Lisää hinta manuaalisesti</span>
                            <div className="flex align-items-end gap-2">
                                <div className="flex-1">
                                    <label className="block mb-1 text-sm">Osoite</label>
                                    <InputText
                                        value={form.url}
                                        placeholder="https://www.antikvariaatti.net/tuotteet/..."
                                        className="w-full"
                                        onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                                    />
                                </div>
                                <Button
                                    label="Hae"
                                    icon="pi pi-download"
                                    size="small"
                                    disabled={!form.url.trim()}
                                    loading={fetching}
                                    onClick={handleFetchUrl}
                                />
                            </div>
                            <div className="formgrid grid">
                                <div className="field col-12 md:col-4">
                                    <label className="block mb-1 text-sm">Lähde *</label>
                                    <Dropdown
                                        value={form.source_id}
                                        options={sources ?? []}
                                        optionLabel="name"
                                        optionValue="id"
                                        placeholder="Valitse lähde"
                                        className="w-full"
                                        onChange={e => setForm(f => ({ ...f, source_id: e.value }))}
                                    />
                                </div>
                                <div className="field col-12 md:col-4">
                                    <label className="block mb-1 text-sm">Kirjan ID</label>
                                    <InputText
                                        value={form.book_id}
                                        placeholder="esim. 640332182"
                                        className="w-full"
                                        onChange={e => setForm(f => ({ ...f, book_id: e.target.value }))}
                                    />
                                </div>
                                <div className="field col-12 md:col-4">
                                    <label className="block mb-1 text-sm">Kunto *</label>
                                    <Dropdown
                                        value={form.condition}
                                        options={CONDITIONS}
                                        placeholder="Valitse kunto"
                                        className="w-full"
                                        onChange={e => setForm(f => ({ ...f, condition: e.value }))}
                                    />
                                </div>
                                <div className="field col-12 md:col-4">
                                    <label className="block mb-1 text-sm">Hinta (€) *</label>
                                    <InputNumber
                                        value={form.price}
                                        mode="decimal"
                                        minFractionDigits={2}
                                        maxFractionDigits={2}
                                        min={0}
                                        className="w-full"
                                        onChange={e => setForm(f => ({ ...f, price: e.value }))}
                                    />
                                </div>
                                <div className="field col-12 md:col-4">
                                    <label className="block mb-1 text-sm">Päivitetty</label>
                                    <Calendar
                                        value={form.last_updated}
                                        dateFormat="dd.mm.yy"
                                        showIcon
                                        className="w-full"
                                        onChange={e => setForm(f => ({ ...f, last_updated: e.value as Date | null }))}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <div className="flex align-items-center gap-2">
                                    <Checkbox
                                        inputId="cb_library"
                                        checked={form.is_library_discard}
                                        onChange={e => setForm(f => ({ ...f, is_library_discard: !!e.checked }))}
                                    />
                                    <label htmlFor="cb_library" className="text-sm cursor-pointer">Kirjastonpoisto</label>
                                </div>
                                <div className="flex align-items-center gap-2">
                                    <Checkbox
                                        inputId="cb_markings"
                                        checked={form.has_markings}
                                        onChange={e => setForm(f => ({ ...f, has_markings: !!e.checked }))}
                                    />
                                    <label htmlFor="cb_markings" className="text-sm cursor-pointer">Merkintöjä</label>
                                </div>
                                <div className="flex align-items-center gap-2">
                                    <Checkbox
                                        inputId="cb_dust"
                                        checked={form.missing_dust_cover}
                                        onChange={e => setForm(f => ({ ...f, missing_dust_cover: !!e.checked }))}
                                    />
                                    <label htmlFor="cb_dust" className="text-sm cursor-pointer">Kansipaperi puuttuu</label>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    label="Tallenna"
                                    icon="pi pi-save"
                                    size="small"
                                    disabled={!formValid}
                                    loading={saving}
                                    onClick={handleSaveManual}
                                />
                                <Button
                                    label="Peruuta"
                                    size="small"
                                    text
                                    onClick={() => { setShowForm(false); setForm(emptyForm); }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Dialog>
    );
};
