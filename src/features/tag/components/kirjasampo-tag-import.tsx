import { useState, useCallback, useRef } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { AutoComplete } from 'primereact/autocomplete';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';

import { Work } from '@features/work/types';
import { SfTag, TagType } from '../types';
import { User, isAdmin } from '@features/user';
import { getApiContent, postApiContent } from '@services/user-service';
import { filterTags } from '@api/tag/filter-tags';
import { getTagTypes } from '@api/tag/get-tag-types';
import { tagTypeToClass, tagTypeToSeverity } from './tag-type-to-severity';
import {
    ADDED_SECTION, ImportRow, PreviewGroup, addedRow, importItems, isNewTag, previewRows,
} from '../utils/kirjasampo-import';

/** A tag type coloured as on tag pages and tag lists. */
const TypePill = ({ type }: { type: TagType }) => {
    const tag = { id: 0, name: type.name, type_id: type.id, type };
    return <Tag value={type.name} severity={tagTypeToSeverity(tag)} className={tagTypeToClass(tag)} />;
};

interface KirjasampoTagImportProps {
    work: Work;
    user: User | null;
    onImported?: () => void;
    /** Called after a Kirjasampo link was added to the work. */
    onLinkAdded?: () => void;
}

/** The server's message from a rejected postApiContent, if any. */
const serverMessage = (err: unknown): string | null => {
    try {
        const raw = (err as { response?: unknown }).response;
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : null;
        const msg = parsed?.data?.msg;
        return typeof msg === 'string' && msg ? msg : null;
    } catch {
        return null;
    }
};

export const KirjasampoTagImport = ({ work, user, onImported, onLinkAdded }: KirjasampoTagImportProps) => {
    const [dialogVisible, setDialogVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);
    const [saving, setSaving] = useState(false);
    const [rows, setRows] = useState<ImportRow[]>([]);
    const [tagTypes, setTagTypes] = useState<TagType[]>([]);
    const [suggestions, setSuggestions] = useState<SfTag[]>([]);
    // A tag to add by hand: one picked from the list, or a typed new name.
    const [toAdd, setToAdd] = useState<SfTag | string | null>(null);
    // Kirjasampo address typed in the dialog when the work has no link.
    const [newLink, setNewLink] = useState('');
    // Work whose link was just saved, until the work is reloaded.
    const [linkAddedFor, setLinkAddedFor] = useState<number | null>(null);
    const toastRef = useRef<Toast>(null);

    const searchTags = useCallback(async (e: { query: string }) => {
        if (e.query.length < 2) {
            setSuggestions([]);
            return;
        }
        try {
            const tags = await filterTags(encodeURIComponent(e.query), user);
            setSuggestions(tags);
        } catch {
            setSuggestions([]);
        }
    }, [user]);

    if (!isAdmin(user)) return null;

    // Without a link the dialog asks for one; it is saved to the work
    // before the tags are fetched.
    const hasLink = linkAddedFor === work.id || !!work.links?.some(l => l.link.includes('kirjasampo.fi'));

    const openDialog = () => {
        setRows([]);
        setFetched(false);
        setNewLink('');
        setDialogVisible(true);
    };

    const fetchTags = async () => {
        setLoading(true);
        try {
            if (!hasLink) {
                try {
                    await postApiContent(`work/${work.id}/kirjasampo/link`, { link: newLink.trim() }, user);
                } catch (err) {
                    toastRef.current?.show({
                        severity: 'error', summary: 'Linkin lisääminen epäonnistui',
                        detail: serverMessage(err) ?? `Palvelin vastasi ${(err as { status?: number }).status ?? '?'}.`,
                        life: 6000,
                    });
                    return;
                }
                setLinkAddedFor(work.id);
                onLinkAdded?.();
            }
            const [previewRes, types] = await Promise.all([
                getApiContent(`work/${work.id}/tags/import/preview`, user),
                getTagTypes(user),
            ]);
            const groups: PreviewGroup[] = previewRes.data;
            setTagTypes(types);
            setRows(previewRows(groups, types));
            setFetched(true);
        } catch {
            toastRef.current?.show({ severity: 'error', summary: 'Virhe', detail: 'Asiasanojen haku epäonnistui' });
        } finally {
            setLoading(false);
        }
    };

    // A name can be in several sections; its rows change together.
    const updateName = (name: string, updates: Partial<ImportRow>) => {
        setRows(prev => prev.map(row => row.name === name ? { ...row, ...updates } : row));
    };

    const addTag = () => {
        const name = (typeof toAdd === 'string' ? toAdd : toAdd?.name ?? '').trim();
        if (!toAdd || !name) return;
        if (rows.some(row => row.name.toLowerCase() === name.toLowerCase())) {
            toastRef.current?.show({ severity: 'info', summary: 'Asiasana on jo listalla', detail: name });
            return;
        }
        const workTags = (work.tags ?? []) as SfTag[];
        const tag = typeof toAdd === 'string' ? name : { id: toAdd.id, name: toAdd.name, type: toAdd.type ?? null };
        const onWork = typeof toAdd !== 'string' && workTags.some(t => t.id === toAdd.id);
        setRows(prev => [...prev, addedRow(tag, tagTypes, onWork)]);
        setToAdd(null);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await postApiContent(`work/${work.id}/tags/import`, importItems(rows), user);
            // postApiContent reports HTTP errors in the status rather than throwing.
            if (response.status !== 200) throw new Error(response.response);
            const results = response.response as unknown as { name: string; status: string }[];
            const failed = results.filter(r => r.status === 'error');
            if (failed.length > 0) {
                toastRef.current?.show({
                    severity: 'warn', summary: 'Osa asiasanoista jäi tuomatta',
                    detail: failed.map(r => r.name).join(', '),
                });
            } else {
                toastRef.current?.show({ severity: 'success', summary: 'Asiasanat tuotu' });
            }
            setDialogVisible(false);
            onImported?.();
        } catch {
            toastRef.current?.show({ severity: 'error', summary: 'Virhe', detail: 'Tallennus epäonnistui' });
        } finally {
            setSaving(false);
        }
    };

    // Nothing to add: saving just records that the work was checked.
    const nothingToImport = rows.every(row => row.skip || row.skipHere);

    const nameBody = (row: ImportRow) => (
        <span className="text-sm" title={row.rawName !== row.name ? row.rawName : undefined}>
            {row.name}
        </span>
    );

    const onWorkBody = (row: ImportRow) => row.onWork ? (
        <i className="pi pi-check text-green-600" title="Teoksella on jo tämä asiasana"
            aria-label="Teoksella on jo tämä asiasana" role="img" />
    ) : null;

    const localTagBody = (row: ImportRow) => (
        <AutoComplete
            value={row.localTag}
            field="name"
            suggestions={suggestions}
            completeMethod={searchTags}
            onChange={e => updateName(row.name, { localTag: e.value })}
            disabled={row.skip || row.skipHere}
            aria-label={`Asiasana tietokannassa: ${row.name}`}
            inputClassName="w-full"
            className="w-full"
        />
    );

    const typeBody = (row: ImportRow) => {
        if (!isNewTag(row)) {
            const type = typeof row.localTag === 'object' ? row.localTag.type : null;
            return type ? <TypePill type={type} /> : null;
        }
        return (
            <div className="flex align-items-center gap-2">
                <Dropdown
                    value={row.typeId}
                    options={tagTypes}
                    optionLabel="name"
                    optionValue="id"
                    itemTemplate={(type: TagType) => <TypePill type={type} />}
                    valueTemplate={(type: TagType | null) => type ? <TypePill type={type} /> : null}
                    onChange={e => updateName(row.name, { typeId: e.value })}
                    disabled={row.skip || row.skipHere}
                    aria-label={`Tyyppi: ${row.name}`}
                    className="w-full"
                />
                <Tag value="Uusi" className="surface-300 text-color" title="Uusi asiasana" />
            </div>
        );
    };

    // Skipped for good: stored, so the name is never imported again. Not
    // for a tag added by hand, which isn't a Kirjasampo name.
    const skipBody = (row: ImportRow) => row.section === ADDED_SECTION ? null : (
        <InputSwitch
            checked={row.skip}
            onChange={e => updateName(row.name, { skip: !!e.value, skipHere: false })}
            aria-label={`Ohita aina ${row.name}`}
            tooltip="Ei tuoda mihinkään teokseen"
            tooltipOptions={{ position: 'left' }}
        />
    );

    // Skipped for this work only: nothing is stored.
    const skipHereBody = (row: ImportRow) => (
        <InputSwitch
            checked={row.skipHere}
            onChange={e => updateName(row.name, { skipHere: !!e.value })}
            disabled={row.skip}
            aria-label={`Ohita tästä teoksesta ${row.name}`}
            tooltip="Ei tuoda tähän teokseen"
            tooltipOptions={{ position: 'left' }}
        />
    );

    const addControls = (
        <div className="mt-3">
            <label htmlFor="kirjasampo-add-tag" className="block font-bold mb-2">Lisää asiasana</label>
            <div className="flex gap-2">
                <AutoComplete
                    inputId="kirjasampo-add-tag"
                    value={toAdd}
                    field="name"
                    suggestions={suggestions}
                    completeMethod={searchTags}
                    onChange={e => setToAdd(e.value)}
                    placeholder="Hae asiasanaa tai kirjoita uusi"
                    className="flex-1"
                    inputClassName="w-full"
                />
                <Button label="Lisää" icon="pi pi-plus" onClick={addTag}
                    disabled={!toAdd || !(typeof toAdd === 'string' ? toAdd.trim() : toAdd.name)} />
            </div>
        </div>
    );

    const footer = (
        <div className="flex justify-content-end gap-2">
            <Button
                label="Peruuta"
                icon="pi pi-times"
                severity="secondary"
                onClick={() => setDialogVisible(false)}
            />
            <Button
                label={nothingToImport ? 'Merkitse tuoduksi' : 'Tallenna'}
                icon={nothingToImport ? 'pi pi-check' : 'pi pi-save'}
                onClick={handleSave}
                loading={saving}
                disabled={!fetched}
            />
        </div>
    );

    return (
        <>
            <Toast ref={toastRef} />
            <Button
                label="Tuo Kirjasampo-asiasanat"
                icon="pi pi-tags"
                size="small"
                severity="secondary"
                onClick={openDialog}
            />
            <Dialog
                header="Kirjasampo-asiasanat"
                visible={dialogVisible}
                onHide={() => setDialogVisible(false)}
                className="w-full xl:w-8"
                maximizable
                blockScroll
                footer={footer}
            >
                {loading ? (
                    <div className="flex justify-content-center p-4">
                        <ProgressSpinner />
                    </div>
                ) : !fetched ? (
                    <div className="flex flex-column align-items-center gap-3 p-4">
                        <p className="text-color-secondary m-0">
                            Hae asiasanat Kirjasammosta ja tarkista ne ennen tallennusta.
                        </p>
                        {!hasLink && (
                            <div className="flex flex-column gap-2 w-full md:w-9">
                                <label htmlFor="kirjasampo-link" className="font-bold">
                                    Kirjasampo-linkki
                                </label>
                                <InputText
                                    id="kirjasampo-link"
                                    value={newLink}
                                    onChange={e => setNewLink(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && newLink.trim()) fetchTags(); }}
                                    placeholder="https://www.kirjasampo.fi/fi/kulsa/..."
                                    aria-describedby="kirjasampo-link-help"
                                    className="w-full"
                                />
                                <small id="kirjasampo-link-help" className="text-color-secondary">
                                    Teoksella ei ole Kirjasampo-linkkiä. Kopioi tähän teoksen
                                    sivun osoite Kirjasammosta; se lisätään teoksen linkkeihin.
                                </small>
                            </div>
                        )}
                        <Button
                            label="Hae asiasanat"
                            icon="pi pi-download"
                            onClick={fetchTags}
                            disabled={!hasLink && !newLink.trim()}
                        />
                    </div>
                ) : (
                    <>
                    {rows.length === 0 ? (
                    <p className="text-center text-color-secondary">Ei asiasanoja löydetty.</p>
                    ) : (
                    <DataTable
                        value={rows}
                        dataKey="key"
                        rowGroupMode="subheader"
                        groupRowsBy="section"
                        rowGroupHeaderTemplate={(row: ImportRow) => <span className="font-bold">{row.section}</span>}
                        rowClassName={(row: ImportRow) => ({ 'opacity-50': row.skip || row.skipHere })}
                        size="small"
                        // For the column titles; App.css stacks the cells on
                        // narrow screens (PrimeReact adds its stack styles only
                        // when the breakpoint changes after mounting).
                        responsiveLayout="stack"
                        className="kirjasampo-import-table"
                    >
                        <Column header="Kirjasampo-asiasana" body={nameBody} style={{ width: '25%' }} />
                        <Column header="Teoksessa" body={onWorkBody} bodyClassName="kirjasampo-on-work text-center"
                            headerClassName="kirjasampo-on-work" style={{ width: '7%' }} />
                        <Column header="Asiasana tietokannassa" body={localTagBody} style={{ width: '30%' }} />
                        <Column header="Tyyppi" body={typeBody} style={{ width: '20%' }} />
                        <Column header="Ohita tästä" body={skipHereBody} style={{ width: '9%' }} />
                        <Column header="Ohita aina" body={skipBody} style={{ width: '9%' }} />
                    </DataTable>
                    )}
                    {addControls}
                    </>
                )}
            </Dialog>
        </>
    );
};
