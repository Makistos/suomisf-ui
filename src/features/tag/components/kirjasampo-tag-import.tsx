import React, { useState, useCallback, useRef } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { AutoComplete } from 'primereact/autocomplete';
import { InputSwitch } from 'primereact/inputswitch';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';

import { Work } from '@features/work/types';
import { SfTag } from '../types';
import { User, isAdmin } from '@features/user';
import { getApiContent, postApiContent } from '@services/user-service';
import { filterTags } from '@api/tag/filter-tags';

interface LocalTagValue {
    id: number;
    name: string;
}

interface TagRow {
    kirjasampoName: string;
    localTag: LocalTagValue | string;
    skip: boolean;
}

interface KirjasampoTagImportProps {
    work: Work;
    user: User | null;
    onImported?: () => void;
}

export const KirjasampoTagImport = ({ work, user, onImported }: KirjasampoTagImportProps) => {
    const [dialogVisible, setDialogVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);
    const [saving, setSaving] = useState(false);
    const [rows, setRows] = useState<TagRow[]>([]);
    const [suggestions, setSuggestions] = useState<SfTag[]>([]);
    const toastRef = useRef<Toast>(null);

    const searchTags = useCallback(async (e: { query: string }) => {
        if (e.query.length < 2) {
            setSuggestions([]);
            return;
        }
        try {
            const tags = await filterTags(e.query, user);
            setSuggestions(tags);
        } catch {
            setSuggestions([]);
        }
    }, [user]);

    if (!isAdmin(user)) return null;

    const kirjasampoLink = work.links?.find(l => l.link.includes('kirjasampo.fi'));
    if (!kirjasampoLink) return null;

    const openDialog = () => {
        setRows([]);
        setFetched(false);
        setDialogVisible(true);
    };

    const SKIPPED_SECTIONS = ['Tekijä', 'Päähenkilöt', 'Alkukieli', 'julkaisut'];
    const SECTION_OVERRIDES: Record<string, string> = { 'Elokuvat': 'elokuva' };

    const stripParens = (name: string) => name.replace(/\s*\(.*?\)\s*/g, '').trim();

    const fetchTags = async () => {
        setLoading(true);
        try {
            const [tagsRes, mappingsRes] = await Promise.all([
                getApiContent(`kirjasampo/tags?url=${encodeURIComponent(kirjasampoLink.link)}`, user),
                getApiContent('tags/import/mappings', user),
            ]);

            const tagSections: Record<string, string[]> = tagsRes.data;
            const mappings = mappingsRes.data;
            const omitSet = new Set<string>(
                (mappings.omit ?? []).map((n: string) => n.toLowerCase())
            );
            const replaceMap = new Map<string, { tag_id: number; tag_name: string }>(
                (mappings.replace ?? []).map((r: any) => [r.name.toLowerCase(), { tag_id: r.tag_id, tag_name: r.tag_name }])
            );

            const allNames = Object.entries(tagSections)
                .filter(([section]) => !SKIPPED_SECTIONS.includes(section))
                .flatMap(([section, tags]) =>
                    section in SECTION_OVERRIDES
                        ? (tags.length > 0 ? [SECTION_OVERRIDES[section]] : [])
                        : tags.map(stripParens)
                );
            const uniqueNames = [...new Set(allNames)];

            const newRows: TagRow[] = uniqueNames.map(name => {
                const rep = replaceMap.get(name.toLowerCase());
                return {
                    kirjasampoName: name,
                    localTag: rep ? { id: rep.tag_id, name: rep.tag_name } : { id: 0, name },
                    skip: omitSet.has(name.toLowerCase()),
                };
            });

            setRows(newRows);
            setFetched(true);
        } catch {
            toastRef.current?.show({ severity: 'error', summary: 'Virhe', detail: 'Asiasanojen haku epäonnistui' });
        } finally {
            setLoading(false);
        }
    };

    const updateRow = (idx: number, updates: Partial<TagRow>) => {
        setRows(prev => prev.map((row, i) => i === idx ? { ...row, ...updates } : row));
    };

    const resolveItem = async (row: TagRow) => {
        if (row.skip) {
            return { name: row.kirjasampoName, id: null, action: 'omit' };
        }
        const local = row.localTag;
        const localId = typeof local === 'object' ? local.id : 0;
        const localName = (typeof local === 'object' ? local.name : local as string).trim();

        // User picked an existing tag from suggestions with a different name → replace + store mapping
        if (localId > 0 && localName !== row.kirjasampoName) {
            return { name: row.kirjasampoName, id: localId, action: 'replace' };
        }

        // User typed a different name without selecting from dropdown →
        // look up by name so we get the id and can store the replace mapping
        if (localId === 0 && localName && localName !== row.kirjasampoName) {
            try {
                const matches = await filterTags(encodeURIComponent(localName), user);
                const exact = matches.find(
                    t => t.name.toLowerCase() === localName.toLowerCase()
                );
                if (exact) {
                    return { name: row.kirjasampoName, id: exact.id, action: 'replace' };
                }
            } catch (e) {
                console.error('resolveItem lookup failed for', localName, e);
            }
            return { name: localName, id: null, action: 'add' };
        }

        return { name: localName || row.kirjasampoName, id: null, action: 'add' };
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const items = await Promise.all(rows.map(resolveItem));
            await postApiContent(`work/${work.id}/tags/import`, items, user);
            toastRef.current?.show({ severity: 'success', summary: 'Asiasanat tuotu' });
            setDialogVisible(false);
            onImported?.();
        } catch {
            toastRef.current?.show({ severity: 'error', summary: 'Virhe', detail: 'Tallennus epäonnistui' });
        } finally {
            setSaving(false);
        }
    };

    const footer = (
        <div className="flex justify-content-end gap-2">
            <Button
                label="Peruuta"
                icon="pi pi-times"
                severity="secondary"
                onClick={() => setDialogVisible(false)}
            />
            <Button
                label="Tallenna"
                icon="pi pi-save"
                onClick={handleSave}
                loading={saving}
                disabled={!fetched || rows.length === 0}
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
                            Hae asiasanat Kirjasamposta ja tarkista ne ennen tallennusta.
                        </p>
                        <Button
                            label="Hae asiasanat"
                            icon="pi pi-download"
                            onClick={fetchTags}
                        />
                    </div>
                ) : rows.length === 0 ? (
                    <p className="text-center text-color-secondary">Ei asiasanoja löydetty.</p>
                ) : (
                    <div>
                        <div className="grid font-bold pb-2 border-bottom-1 surface-border text-sm text-600 uppercase">
                            <div className="col-5">Kirjasampo-asiasana</div>
                            <div className="col-5">Asiasana tietokannassa</div>
                            <div className="col-2 text-center">Ohita</div>
                        </div>
                        {rows.map((row, idx) => (
                            <div
                                key={row.kirjasampoName}
                                className={`grid align-items-center py-1 border-bottom-1 surface-border${row.skip ? ' opacity-50' : ''}`}
                            >
                                <div className="col-5 text-sm">{row.kirjasampoName}</div>
                                <div className="col-5">
                                    <AutoComplete
                                        value={row.localTag}
                                        field="name"
                                        suggestions={suggestions}
                                        completeMethod={searchTags}
                                        onChange={e => updateRow(idx, { localTag: e.value })}
                                        disabled={row.skip}
                                        inputClassName="w-full"
                                        className="w-full"
                                    />
                                </div>
                                <div className="col-2 flex justify-content-center">
                                    <InputSwitch
                                        checked={row.skip}
                                        onChange={e => updateRow(idx, { skip: !!e.value })}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Dialog>
        </>
    );
};
