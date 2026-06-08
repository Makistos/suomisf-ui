import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';

import { getCurrenUser } from '@services/auth-service';
import { getApiContent, postApiContent } from '@services/user-service';
import { Work } from '../types';

interface LinkedProduct {
    id: number;
    antikvaari_product_id: string;
    added: string | null;
    url: string | null;
}

interface SearchResult {
    product_id: string;
    title: string;
    author: string;
    year: string;
    binding: string;
    url: string;
    available_count: number;
}

interface FetchedRow {
    edition_id: number | null;
    edition_pubyear: number | null;
    edition_version: number | null;
    edition_match_level: 'same' | 'close' | 'not_close' | null;
    antikvaari_book_id: string;
    antikvaari_product_id: string;
    antikvaari_product_url: string | null;
    antikvaari_product_year: number | null;
    antikvaari_product_binding: number | null;
    antikvaari_product_version: number | null;
    antikvaari_product_laitos: number | null;
    date_listed: string | null;
    last_updated: string | null;
    condition: string;
    is_library_discard: boolean;
    has_markings: boolean;
    missing_dust_cover: boolean;
    price: number | null;
    match_quality: string | null;
}

interface RowSaveResult {
    status: 'saved' | 'skipped' | 'error';
    reason: 'unchanged' | 'no_edition' | null | string;
}

interface AntikvaariProductPickerProps {
    work: Work;
    onClose: () => void;
}

const BINDING_LABELS: Record<number, string> = {
    1: 'Ei tietoa',
    2: 'Nidottu',
    3: 'Sidottu',
};

function formatDate(iso: string | null): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('fi-FI');
}

export const AntikvaariProductPicker = ({ work, onClose: _onClose }: AntikvaariProductPickerProps) => {
    const user = useMemo(() => getCurrenUser(), []);
    const toastRef = useRef<Toast>(null);

    const initialQuery = `${work.author_str} ${work.title}`.trim();

    const [linkedProducts, setLinkedProducts] = useState<LinkedProduct[]>([]);
    const [loadingLinked, setLoadingLinked] = useState(true);
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [addingIds, setAddingIds] = useState<Set<string>>(new Set());

    const [fetchedRows, setFetchedRows] = useState<FetchedRow[]>([]);
    const [fetching, setFetching] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveResults, setSaveResults] = useState<Record<string, RowSaveResult>>({});

    const loadLinkedProducts = useCallback(async () => {
        setLoadingLinked(true);
        try {
            const resp = await getApiContent(`work/${work.id}/antikvaari/products`, user);
            setLinkedProducts(resp.data ?? []);
        } catch {
            toastRef.current?.show({ severity: 'error', summary: 'Linkitettyjen tuotteiden lataus epäonnistui' });
        } finally {
            setLoadingLinked(false);
        }
    }, [work.id, user]);

    const runSearch = useCallback(async (query: string) => {
        if (!query.trim()) return;
        setSearching(true);
        setSearchResults([]);
        try {
            const resp = await getApiContent(
                `antikvaari/search?q=${encodeURIComponent(query.trim())}`, user
            );
            setSearchResults(resp.data ?? []);
            if ((resp.data ?? []).length === 0) {
                toastRef.current?.show({ severity: 'info', summary: 'Ei hakutuloksia' });
            }
        } catch {
            toastRef.current?.show({ severity: 'error', summary: 'Haku epäonnistui' });
        } finally {
            setSearching(false);
        }
    }, [user]);

    useEffect(() => {
        loadLinkedProducts();
        runSearch(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAdd = async (productId: string, url: string) => {
        setAddingIds(prev => new Set(prev).add(productId));
        try {
            await postApiContent(
                `work/${work.id}/antikvaari/products`,
                [{ product_id: productId, url }],
                user
            );
            await loadLinkedProducts();
            toastRef.current?.show({ severity: 'success', summary: 'Tuote linkitetty' });
        } catch {
            toastRef.current?.show({ severity: 'error', summary: 'Tuotteen lisääminen epäonnistui' });
        } finally {
            setAddingIds(prev => { const s = new Set(prev); s.delete(productId); return s; });
        }
    };

    const handleRowChange = useCallback((bookId: string, changes: Partial<FetchedRow>) => {
        setFetchedRows(prev => prev.map(r =>
            r.antikvaari_book_id === bookId ? { ...r, ...changes } : r
        ));
    }, []);

    const handleFetch = async () => {
        const urls = linkedProducts.map(p => p.url).filter((u): u is string => !!u);
        if (!urls.length) {
            toastRef.current?.show({ severity: 'warn', summary: 'Linkitetyillä tuotteilla ei ole URL-osoitteita' });
            return;
        }
        setFetching(true);
        setFetchedRows([]);
        setSaveResults({});
        try {
            const resp = await postApiContent(
                `work/${work.id}/antikvaari/fetch`,
                { product_urls: urls },
                user
            );
            const rows: FetchedRow[] = (resp.response as unknown as FetchedRow[]) ?? [];
            setFetchedRows(rows);
            if (rows.length === 0) {
                toastRef.current?.show({ severity: 'info', summary: 'Ei löydettyjä hintoja' });
            }
        } catch {
            toastRef.current?.show({ severity: 'error', summary: 'Hintojen haku epäonnistui' });
        } finally {
            setFetching(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const resp = await postApiContent(
                `work/${work.id}/antikvaari/prices`,
                fetchedRows,
                user
            );
            const result = resp.response as unknown as {
                saved: number;
                skipped: number;
                rows: Array<FetchedRow & RowSaveResult>;
            };
            const saved = result?.saved ?? 0;
            const skipped = result?.skipped ?? 0;
            const byId: Record<string, RowSaveResult> = {};
            for (const r of result?.rows ?? []) {
                byId[r.antikvaari_book_id] = { status: r.status, reason: r.reason };
            }
            setSaveResults(byId);
            toastRef.current?.show({
                severity: saved > 0 ? 'success' : 'info',
                summary: `Tallennettu ${saved} riviä${skipped > 0 ? `, ohitettu ${skipped}` : ''}`,
            });
        } catch {
            toastRef.current?.show({ severity: 'error', summary: 'Tallentaminen epäonnistui' });
        } finally {
            setSaving(false);
        }
    };

    const isLinked = (productId: string) =>
        linkedProducts.some(p => p.antikvaari_product_id === productId);

    const savableRows = fetchedRows.filter(r => r.edition_id !== null && r.edition_match_level !== 'not_close');

    return (
        <div className="flex flex-column gap-4">
            <Toast ref={toastRef} />

            {/* Linked products */}
            <section>
                <h4 className="mt-0 mb-3">Linkitetyt tuotteet</h4>
                {loadingLinked ? (
                    <ProgressSpinner style={{ width: '24px', height: '24px' }} strokeWidth="4" />
                ) : linkedProducts.length === 0 ? (
                    <p className="text-600 text-sm m-0">Ei linkitettyjä tuotteita.</p>
                ) : (
                    <div className="flex flex-column gap-2">
                        {linkedProducts.map(p => (
                            <div key={p.id} className="flex align-items-center gap-2">
                                {p.url ? (
                                    <a href={p.url} target="_blank" rel="noopener noreferrer"
                                        className="font-semibold no-underline text-primary hover:underline text-sm">
                                        {p.antikvaari_product_id}
                                    </a>
                                ) : (
                                    <Tag value={p.antikvaari_product_id} />
                                )}
                                {p.added && (
                                    <span className="text-500 text-sm">
                                        {new Date(p.added).toLocaleDateString('fi-FI')}
                                    </span>
                                )}
                            </div>
                        ))}
                        <div className="mt-2">
                            <Button
                                label="Hae hinnat"
                                icon="fa-solid fa-magnifying-glass-dollar"
                                size="small"
                                onClick={handleFetch}
                                loading={fetching}
                                disabled={linkedProducts.every(p => !p.url)}
                            />
                        </div>
                    </div>
                )}
            </section>

            {/* Fetch results */}
            {(fetching || fetchedRows.length > 0) && (
                <>
                    <Divider className="my-0" />
                    <section>
                        <div className="flex align-items-center justify-content-between mb-3">
                            <h4 className="mt-0 mb-0">
                                Haetut hinnat {fetchedRows.length > 0 && `(${fetchedRows.length} kpl)`}
                            </h4>
                            {savableRows.length > 0 && Object.keys(saveResults).length === 0 && (
                                <Button
                                    label={`Tallenna${savableRows.length < fetchedRows.length ? ` (${savableRows.length})` : ''}`}
                                    icon="pi pi-save"
                                    size="small"
                                    onClick={handleSave}
                                    loading={saving}
                                />
                            )}
                        </div>

                        {fetching ? (
                            <div className="flex justify-content-center">
                                <ProgressSpinner style={{ width: '32px', height: '32px' }} strokeWidth="4" />
                            </div>
                        ) : (
                            <div className="flex flex-column gap-2">
                                {fetchedRows.map((row, i) => (
                                    <FetchedRowCard key={`${row.antikvaari_book_id}-${i}`} row={row}
                                        saveResult={saveResults[row.antikvaari_book_id]}
                                        onRowChange={handleRowChange} />
                                ))}
                            </div>
                        )}
                    </section>
                </>
            )}

            <Divider className="my-0" />

            {/* Search */}
            <section>
                <h4 className="mt-0 mb-3">Hae Antikvaari-tuotteita</h4>
                <div className="flex gap-2">
                    <InputText
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && runSearch(searchQuery)}
                        className="flex-1"
                    />
                    <Button
                        label="Hae"
                        icon="pi pi-search"
                        onClick={() => runSearch(searchQuery)}
                        loading={searching}
                        disabled={!searchQuery.trim()}
                    />
                </div>

                {searching && (
                    <div className="flex justify-content-center mt-3">
                        <ProgressSpinner style={{ width: '32px', height: '32px' }} strokeWidth="4" />
                    </div>
                )}

                {!searching && searchResults.length > 0 && (
                    <div className="flex flex-column gap-2 mt-3">
                        {searchResults.map(r => (
                            <div key={r.product_id}
                                className="flex align-items-center justify-content-between p-2 border-1 surface-border border-round gap-3">
                                <div className="flex flex-column gap-1 min-w-0">
                                    <a href={r.url} target="_blank" rel="noopener noreferrer"
                                        className="font-semibold no-underline text-primary hover:underline">
                                        {r.title}
                                    </a>
                                    <span className="text-600 text-sm">
                                        {r.author}{r.year ? ` · ${r.year}` : ''}{r.binding ? ` · ${r.binding}` : ''} · {r.available_count} kpl
                                    </span>
                                </div>
                                <div className="flex-shrink-0">
                                    {isLinked(r.product_id) ? (
                                        <Tag value="Lisätty" severity="success" />
                                    ) : (
                                        <Button
                                            label="Lisää"
                                            size="small"
                                            onClick={() => handleAdd(r.product_id, r.url)}
                                            loading={addingIds.has(r.product_id)}
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

const REASON_LABELS: Record<string, string> = {
    unchanged: 'Ei muutoksia',
    no_edition: 'Painosta ei löydy',
    edition_missing: 'Painos puuttuu tietokannasta',
};

interface FetchedRowCardProps {
    row: FetchedRow;
    saveResult?: RowSaveResult;
    onRowChange: (bookId: string, changes: Partial<FetchedRow>) => void;
}

const FetchedRowCard = ({ row, saveResult, onRowChange }: FetchedRowCardProps) => {
    const noEdition = row.edition_id === null;
    const editionMissing = !noEdition && row.edition_match_level === 'not_close';

    const bindingLabel = row.antikvaari_product_binding != null
        ? BINDING_LABELS[row.antikvaari_product_binding] ?? null
        : null;

    const listingMeta = [
        row.antikvaari_product_year,
        bindingLabel,
    ].filter(Boolean).join(' · ');

    // Matched edition from our database (laitos not detected from Antikvaari, omit it here)
    const editionMeta = row.edition_id != null && row.edition_pubyear != null
        ? String(row.edition_pubyear)
        : null;

    const flags = [
        row.is_library_discard && 'Kirjaston poisto',
        row.has_markings && 'Merkintöjä',
        row.missing_dust_cover && 'Ei kansipaperia',
    ].filter(Boolean) as string[];

    const hasSaveResult = !!saveResult;

    return (
        <div className={`p-2 border-1 border-round flex flex-column gap-1 ${noEdition || editionMissing ? 'surface-100 border-300 text-500' : 'surface-border'}`}>
            <div className="flex align-items-center justify-content-between gap-2">
                <div className="flex align-items-center gap-2">
                    <span className="font-bold">{row.condition || '—'}</span>
                    {row.antikvaari_product_url && (
                        <a href={row.antikvaari_product_url} target="_blank" rel="noopener noreferrer"
                            className="text-400 hover:text-primary" title="Avaa Antikvaari-sivu">
                            <i className="pi pi-external-link text-xs" />
                        </a>
                    )}
                </div>
                <div className="flex align-items-center gap-2">
                    {saveResult && (
                        <Tag
                            value={saveResult.status === 'saved' ? 'Tallennettu'
                                : saveResult.reason ? (REASON_LABELS[saveResult.reason] ?? saveResult.reason)
                                : 'Ohitettu'}
                            severity={saveResult.status === 'saved' ? 'success'
                                : saveResult.status === 'error' ? 'danger'
                                : 'warning'}
                        />
                    )}
                    <span className="font-semibold">
                        {row.price != null ? `${row.price.toFixed(2)} €` : '—'}
                    </span>
                </div>
            </div>

            {listingMeta && (
                <span className="text-sm text-600">{listingMeta}</span>
            )}

            {/* Editable painos + laitos */}
            {!hasSaveResult && (
                <div className="flex align-items-center gap-3 mt-1">
                    <div className="flex align-items-center gap-1">
                        <label className="text-xs text-500 white-space-nowrap">Painos</label>
                        <InputNumber
                            value={row.antikvaari_product_version ?? 1}
                            onValueChange={e => onRowChange(row.antikvaari_book_id, { antikvaari_product_version: e.value ?? 1 })}
                            min={1} max={99} showButtons={false}
                            inputStyle={{ width: '3rem', padding: '2px 4px', fontSize: '0.8rem' }}
                        />
                    </div>
                    <div className="flex align-items-center gap-1">
                        <label className="text-xs text-500 white-space-nowrap">Laitos</label>
                        <InputNumber
                            value={row.antikvaari_product_laitos ?? 1}
                            onValueChange={e => onRowChange(row.antikvaari_book_id, { antikvaari_product_laitos: e.value ?? 1 })}
                            min={1} max={99} showButtons={false}
                            inputStyle={{ width: '3rem', padding: '2px 4px', fontSize: '0.8rem' }}
                        />
                    </div>
                </div>
            )}

            {editionMeta && (
                <span className="text-xs text-500">Tunnistettu painos: {editionMeta}</span>
            )}
            {(flags.length > 0 || noEdition || editionMissing) && (
                <div className="flex flex-wrap gap-1">
                    {flags.map(f => <Tag key={f} value={f} severity="warning" />)}
                    {editionMissing && <Tag value="Painos puuttuu tietokannasta" severity="danger" />}
                    {noEdition && <Tag value="Ei painosta" severity="danger" />}
                </div>
            )}
            {(row.date_listed || row.last_updated) && (
                <span className="text-xs text-500">
                    {row.date_listed && `Lisätty ${formatDate(row.date_listed)}`}
                    {row.date_listed && row.last_updated && ' · '}
                    {row.last_updated && `Päivitetty ${formatDate(row.last_updated)}`}
                </span>
            )}
        </div>
    );
};
