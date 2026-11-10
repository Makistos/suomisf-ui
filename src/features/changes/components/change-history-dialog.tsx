import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog } from "primereact/dialog";
import { MultiSelect } from "primereact/multiselect";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import { InputSwitch } from "primereact/inputswitch";
import { SelectButton } from "primereact/selectbutton";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Timeline } from "primereact/timeline";
import { ConfirmPopup } from "primereact/confirmpopup";
import { ProgressSpinner } from "primereact/progressspinner";

import { getCurrenUser } from "@services/auth-service";
import { isAdmin } from "@features/user";
import { getWorkChanges } from "@api/work/get-work-changes";
import { deleteLogItem } from "@api/changed/delete-log-item";
import { LogItem } from "../types";
import {
    HistoryFilters, SaveGroup, distinct, emptyFilters, fieldKind, filterRows, groupSaves,
    isUnchanged, listDiff, plainText, rowField, splitList, tagEvent, wordDiff,
} from "../utils/change-history";

const PAGE = 25;

// Field column text for rows that change the whole object.
const ACTION_LABELS: Record<string, string> = { Uusi: 'Luotu', Poisto: 'Poistettu' };

const formatTime = (date: Date) => date.toLocaleString('fi-FI', {
    weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
});

const actionSeverity = (action: string) =>
    action === 'Uusi' ? 'success' : action === 'Poisto' ? 'danger' : action === 'Päivitys' ? 'info' : 'warning';

const Empty = () => <span className="text-color-secondary">(tyhjä)</span>;

const Unknown = () => (
    <span className="text-color-secondary font-italic"
        title="Uutta arvoa ei voi päätellä: kenttää ei enää ole tai sen nykyistä arvoa ei osata lukea.">
        ei tiedossa
    </span>
);

/** A list item that was added or removed. */
const Chip = ({ added, text }: { added: boolean; text: string }) => (
    <span className={`change-chip ${added ? 'added' : 'removed'}`}>
        <span aria-hidden>{added ? '+' : '−'}</span>
        <span className="p-hidden-accessible">{added ? 'Lisätty: ' : 'Poistettu: '}</span>
        <span className={added ? undefined : 'line-through'}>{text}</span>
    </span>
);

/** A field's value before and after one change. */
const ChangeValue = ({ row }: { row: LogItem }) => {
    const field = rowField(row);
    const event = tagEvent(row);
    if (event) {
        return <Chip added={event.added} text={event.name} />;
    }
    if (row.action !== 'Päivitys') {
        // Uusi / Poisto rows name the object; others (Kansikuva) say what.
        const text = row.old_value || row.object_name;
        return text ? <span className="white-space-pre-line">{text}</span> : <Empty />;
    }
    const known = !!row.new_value_source;
    const kind = fieldKind(field);

    if (kind === 'list') {
        const before = splitList(field, row.old_value);
        if (!known) {
            return <div className="flex flex-column gap-1">
                <span>{before.join(', ') || <Empty />}</span>
                <span>→ <Unknown /></span>
            </div>;
        }
        const { added, removed, kept } = listDiff(before, splitList(field, row.new_value));
        return (
            <div className="flex flex-wrap gap-1 align-items-center">
                {removed.map(x => <Chip key={`r${x}`} added={false} text={x} />)}
                {added.map(x => <Chip key={`a${x}`} added text={x} />)}
                {kept.length > 0 && (
                    <span className="text-color-secondary text-sm" title={kept.join('\n')}>
                        {kept.length} ennallaan
                    </span>
                )}
                {added.length === 0 && removed.length === 0 && kept.length === 0 && <Empty />}
            </div>
        );
    }

    if (kind === 'text' && known) {
        const parts = wordDiff(plainText(row.old_value), plainText(row.new_value));
        if (parts.length === 0) return <Empty />;
        return (
            <span className="change-diff">
                {parts.map((p, i) => p.type === 'same' ? <span key={i}>{p.text}</span>
                    : p.type === 'added' ? <ins key={i}>{p.text}</ins>
                        : <del key={i}>{p.text}</del>)}
            </span>
        );
    }

    const old = kind === 'text' ? plainText(row.old_value) : row.old_value;
    const now = kind === 'text' ? plainText(row.new_value) : row.new_value;
    return (
        <span className="flex flex-wrap gap-2 align-items-center">
            <span className="change-old">{old || <Empty />}</span>
            <i className="pi pi-arrow-right text-sm text-color-secondary" aria-label="muuttui arvoksi" />
            <span className="change-new">{known ? (now || <Empty />) : <Unknown />}</span>
        </span>
    );
};

interface ChangeHistoryDialogProps {
    workId: number;
    visible: boolean;
    onHide: () => void;
}

/**
 * The change history of a work and its editions: who changed what, when,
 * from which value to which. Filters narrow the list; "Kentän historia"
 * shows one field's values over time.
 */
export const ChangeHistoryDialog = ({ workId, visible, onHide }: ChangeHistoryDialogProps) => {
    const user = useMemo(() => getCurrenUser(), []);
    const admin = isAdmin(user);
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState<HistoryFilters>(emptyFilters);
    const [shown, setShown] = useState(PAGE);
    const [view, setView] = useState<'changes' | 'field'>('changes');
    const [historyField, setHistoryField] = useState<string | null>(null);
    const [historyTarget, setHistoryTarget] = useState<string | null>(null);
    const [confirm, setConfirm] = useState<{ el: HTMLElement; id: number } | null>(null);
    // The filters fill a phone screen: closed there until asked for.
    const [filtersOpen, setFiltersOpen] = useState(
        () => typeof window === 'undefined' || window.matchMedia('(min-width: 768px)').matches);

    const { data, isLoading, isError } = useQuery({
        queryKey: ["changes", "work", workId, "history"],
        queryFn: () => getWorkChanges(workId, user),
        enabled: visible,
    });
    const rows = useMemo(() => data ?? [], [data]);

    const { mutate: remove } = useMutation({
        mutationFn: (id: number) => deleteLogItem(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["changes", "work", workId] }),
    });

    const options = useMemo(() => ({
        targets: distinct(rows.map(r => r.target ?? r.table_name)),
        fields: distinct(rows.map(rowField)).sort((a, b) => a.localeCompare(b, 'fi')),
        users: distinct(rows.map(r => r.user?.name ?? '–')).sort((a, b) => a.localeCompare(b, 'fi')),
        actions: distinct(rows.map(r => r.action)),
    }), [rows]);

    const filtered = useMemo(() => filterRows(rows, filters), [rows, filters]);
    const saves = useMemo(() => groupSaves(filtered), [filtered]);
    const hiddenUnchanged = useMemo(
        () => filters.hideUnchanged ? rows.filter(isUnchanged).length : 0, [rows, filters.hideUnchanged]);

    const set = (update: Partial<HistoryFilters>) => {
        setFilters(f => ({ ...f, ...update }));
        setShown(PAGE);
    };

    const fieldTarget = historyTarget ?? options.targets[0] ?? null;
    const fieldRows = useMemo(() => rows
        .filter(r => rowField(r) === historyField && (r.target ?? r.table_name) === fieldTarget
            && r.action === 'Päivitys')
        .sort((a, b) => Date.parse(b.date) - Date.parse(a.date)), [rows, historyField, fieldTarget]);

    const deleteButton = (row: LogItem) => admin && (
        <Button icon="pi pi-trash" text rounded size="small" severity="danger"
            aria-label="Poista lokirivi" tooltip="Poista lokirivi" tooltipOptions={{ position: 'left' }}
            onClick={e => setConfirm({ el: e.currentTarget, id: row.id })} />
    );

    const saveCard = (save: SaveGroup) => (
        <section key={save.key} className="change-save surface-border border-1 border-round p-3"
            aria-label={`${formatTime(save.date)}, ${save.user}`}>
            <header className="flex flex-wrap align-items-center gap-2 mb-2">
                <span className="font-bold">{formatTime(save.date)}</span>
                <span><i className="pi pi-user text-sm mr-1" aria-hidden />{save.user}</span>
                <Tag value={save.target} className="surface-200 text-color" />
                <Tag value={save.action} severity={actionSeverity(save.action)} />
            </header>
            <div className="change-rows">
                {save.rows.map(row => (
                    <div key={row.id} className="change-row">
                        <span className="change-field font-semibold" title={
                            row.field_name !== rowField(row) ? `Lokissa: ${row.field_name}` : undefined}>
                            {rowField(row) || ACTION_LABELS[row.action] || row.action}
                        </span>
                        <span className="change-value"><ChangeValue row={row} /></span>
                        <span className="change-actions">{deleteButton(row)}</span>
                    </div>
                ))}
            </div>
        </section>
    );

    const activeFilters = [filters.targets.length, filters.fields.length, filters.users.length,
        filters.actions.length, filters.from ? 1 : 0, filters.text.trim() ? 1 : 0].filter(Boolean).length;

    const filterBar = !filtersOpen ? null : (
        <div className="grid formgrid p-fluid mb-2" id="ch-filters">
            {options.targets.length > 1 && (
                <div className="field col-12 md:col-6 lg:col-3">
                    <label htmlFor="ch-target">Kohde</label>
                    <MultiSelect inputId="ch-target" value={filters.targets} options={options.targets}
                        onChange={e => set({ targets: e.value })} placeholder="Kaikki" display="chip" filter />
                </div>
            )}
            <div className="field col-12 md:col-6 lg:col-3">
                <label htmlFor="ch-field">Kenttä</label>
                <MultiSelect inputId="ch-field" value={filters.fields} options={options.fields}
                    onChange={e => set({ fields: e.value })} placeholder="Kaikki" display="chip" filter />
            </div>
            <div className="field col-12 md:col-6 lg:col-3">
                <label htmlFor="ch-user">Muokkaaja</label>
                <MultiSelect inputId="ch-user" value={filters.users} options={options.users}
                    onChange={e => set({ users: e.value })} placeholder="Kaikki" display="chip" />
            </div>
            <div className="field col-12 md:col-6 lg:col-3">
                <label htmlFor="ch-action">Muutos</label>
                <MultiSelect inputId="ch-action" value={filters.actions} options={options.actions}
                    onChange={e => set({ actions: e.value })} placeholder="Kaikki" display="chip" />
            </div>
            <div className="field col-12 md:col-6 lg:col-3">
                <label htmlFor="ch-dates">Aikaväli</label>
                <Calendar inputId="ch-dates" selectionMode="range" readOnlyInput showButtonBar
                    dateFormat="d.m.yy" placeholder="Koko historia"
                    value={filters.from ? [filters.from, filters.to] : null}
                    onChange={e => {
                        const [from, to] = (e.value as (Date | null)[] | null) ?? [null, null];
                        set({ from: from ?? null, to: to ?? from ?? null });
                    }} />
            </div>
            <div className="field col-12 md:col-6 lg:col-3">
                <label htmlFor="ch-text">Hae arvoista</label>
                <InputText id="ch-text" value={filters.text} onChange={e => set({ text: e.target.value })}
                    placeholder="esim. ISBN tai nimi" />
            </div>
            <div className="field col-12 md:col-6 lg:col-4 flex align-items-center gap-2 md:mt-4">
                <InputSwitch inputId="ch-hide" checked={filters.hideUnchanged}
                    onChange={e => set({ hideUnchanged: !!e.value })} />
                <label htmlFor="ch-hide" className="m-0">Piilota muuttumattomat</label>
            </div>
            <div className="field col-12 md:col-6 lg:col-2 md:mt-4">
                <Button label="Tyhjennä" icon="pi pi-filter-slash" text
                    onClick={() => set({ ...emptyFilters })} />
            </div>
        </div>
    );

    const changesView = (
        <>
            <Button className="md:hidden mb-2" size="small" outlined icon="pi pi-filter"
                label={`Suodattimet${activeFilters ? ` (${activeFilters})` : ''}`}
                aria-expanded={filtersOpen} aria-controls="ch-filters"
                onClick={() => setFiltersOpen(o => !o)} />
            {filterBar}
            <p className="text-sm text-color-secondary mt-0">
                {filtered.length} muutosta, {saves.length} tallennusta
                {hiddenUnchanged > 0 && ` · ${hiddenUnchanged} muuttumatonta piilotettu`}
            </p>
            <div className="flex flex-column gap-3">
                {saves.slice(0, shown).map(saveCard)}
            </div>
            {saves.length === 0 && <p className="text-center text-color-secondary">Ei muutoksia.</p>}
            {saves.length > shown && (
                <div className="flex justify-content-center mt-3">
                    <Button label={`Näytä lisää (${saves.length - shown})`} icon="pi pi-angle-down"
                        text onClick={() => setShown(s => s + PAGE)} />
                </div>
            )}
        </>
    );

    const fieldView = (
        <>
            <div className="grid formgrid p-fluid mb-2">
                {options.targets.length > 1 && (
                    <div className="field col-12 md:col-6">
                        <label htmlFor="ch-ftarget">Kohde</label>
                        <Dropdown inputId="ch-ftarget" value={fieldTarget} options={options.targets}
                            onChange={e => setHistoryTarget(e.value)} />
                    </div>
                )}
                <div className="field col-12 md:col-6">
                    <label htmlFor="ch-ffield">Kenttä</label>
                    <Dropdown inputId="ch-ffield" value={historyField} options={options.fields}
                        onChange={e => setHistoryField(e.value)} placeholder="Valitse kenttä" filter />
                </div>
            </div>
            {historyField && fieldRows.length === 0 && (
                <p className="text-center text-color-secondary">Kenttää ei ole muutettu tässä kohteessa.</p>
            )}
            {fieldRows.length > 0 && (
                <Timeline value={fieldRows} className="change-timeline" content={(row: LogItem) => (
                    <div className="mb-3">
                        <div className="text-sm text-color-secondary mb-1">
                            {formatTime(new Date(row.date))} · {row.user?.name ?? '–'}
                        </div>
                        <ChangeValue row={row} />
                    </div>
                )} />
            )}
        </>
    );

    return (
        <Dialog header="Muutoshistoria" visible={visible} onHide={onHide} maximizable blockScroll
            className="w-full lg:w-10 xl:w-8" contentClassName="change-history">
            {isLoading ? (
                <div className="flex justify-content-center p-4"><ProgressSpinner /></div>
            ) : isError ? (
                <p className="text-center">Muutoshistorian haku epäonnistui.</p>
            ) : (
                <>
                    <SelectButton className="mb-3" value={view} allowEmpty={false}
                        options={[{ label: 'Muutokset', value: 'changes' }, { label: 'Kentän historia', value: 'field' }]}
                        onChange={e => setView(e.value)} />
                    {view === 'changes' ? changesView : fieldView}
                    <p className="text-xs text-color-secondary mt-4 mb-0">
                        Lokiin on tallennettu vain kentän vanha arvo. Uusi arvo on päätelty seuraavasta saman
                        kentän muutoksesta tai, viimeisimmässä muutoksessa, kentän nykyisestä arvosta.
                    </p>
                </>
            )}
            <ConfirmPopup target={confirm?.el} visible={confirm !== null} onHide={() => setConfirm(null)}
                message="Poistetaanko lokirivi?" acceptLabel="Poista" rejectLabel="Peruuta"
                accept={() => { if (confirm) remove(confirm.id); }} />
        </Dialog>
    );
};
