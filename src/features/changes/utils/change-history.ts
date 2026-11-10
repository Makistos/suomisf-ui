import { LogItem } from "../types";

/**
 * Helpers for the change history dialog: how each field's value is shown
 * and compared, grouping log rows into saves, and list and word diffs.
 *
 * The backend adds to each row the field's current name ("field"), the
 * value the change set ("new_value", derived: the next change's old value
 * or the current value) and the changed object ("target").
 */

/** How a field's value is shown and compared. */
export type FieldKind = 'list' | 'text' | 'value';

// List fields and the separator the backend logs them with.
const LIST_SEPARATORS: Record<string, string | RegExp> = {
    Asiasanat: ',',
    Genret: ',',
    Linkit: ', ',
    Tekijät: '\n',
    Novellit: '; ',
    Kokoomateos: '; ',
};

// Long texts get a word diff.
const TEXT_FIELDS = new Set(['Kuvaus', 'Muuta', 'Kuvauksen lähde', 'Lähde', 'Biografia', 'Muistiinpanot']);

const EVENT = /^(Lisätty|Poistettu): (.*)$/s;

export const fieldKind = (field: string): FieldKind =>
    field in LIST_SEPARATORS ? 'list' : TEXT_FIELDS.has(field) ? 'text' : 'value';

/** The field's current name; old rows from before the backend added it. */
export const rowField = (row: LogItem): string => row.field ?? row.field_name ?? '';

/** A list value as its items. */
export const splitList = (field: string, value: string | null | undefined): string[] =>
    (value ?? '').split(LIST_SEPARATORS[field] ?? ',').map(x => x.trim()).filter(Boolean);

/** HTML (descriptions) as plain text. */
export const plainText = (value: string | null | undefined): string =>
    (value ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

/** A single tag added or removed: "Lisätty: x" / "Poistettu: x". */
export const tagEvent = (row: LogItem): { added: boolean; name: string } | null => {
    const m = EVENT.exec(row.old_value ?? '');
    return m && rowField(row) === 'Asiasanat' ? { added: m[1] === 'Lisätty', name: m[2] } : null;
};

/** Items only in after (added) and only in before (removed). */
export const listDiff = (before: string[], after: string[]) => {
    const b = new Set(before);
    const a = new Set(after);
    return {
        added: after.filter(x => !b.has(x)),
        removed: before.filter(x => !a.has(x)),
        kept: after.filter(x => b.has(x)),
    };
};

/** True when the change has a known new value equal to the old one. */
export const isUnchanged = (row: LogItem): boolean => {
    if (row.action !== 'Päivitys' || !row.new_value_source) return false;
    const field = rowField(row);
    switch (fieldKind(field)) {
        case 'list': {
            const d = listDiff(splitList(field, row.old_value), splitList(field, row.new_value));
            return d.added.length === 0 && d.removed.length === 0;
        }
        case 'text':
            return plainText(row.old_value) === plainText(row.new_value);
        default:
            return (row.old_value ?? '') === (row.new_value ?? '');
    }
};

export type DiffPart = { text: string; type: 'same' | 'added' | 'removed' };

/** Word-level diff of two texts (longest common subsequence). */
export const wordDiff = (before: string, after: string): DiffPart[] => {
    const a = before.split(/(\s+)/).filter(Boolean);
    const b = after.split(/(\s+)/).filter(Boolean);
    // Texts are cut to 200 characters in the log; this stays small.
    const lcs: number[][] = Array.from({ length: a.length + 1 }, () => Array.from({ length: b.length + 1 }, () => 0));
    for (let i = a.length - 1; i >= 0; i--) {
        for (let j = b.length - 1; j >= 0; j--) {
            lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
        }
    }
    const parts: DiffPart[] = [];
    const push = (text: string, type: DiffPart['type']) => {
        const last = parts[parts.length - 1];
        if (last && last.type === type) last.text += text;
        else parts.push({ text, type });
    };
    let i = 0;
    let j = 0;
    while (i < a.length && j < b.length) {
        if (a[i] === b[j]) { push(a[i], 'same'); i++; j++; }
        else if (lcs[i + 1][j] >= lcs[i][j + 1]) { push(a[i], 'removed'); i++; }
        else { push(b[j], 'added'); j++; }
    }
    while (i < a.length) push(a[i++], 'removed');
    while (j < b.length) push(b[j++], 'added');
    return parts;
};

/** One save: rows by the same editor to the same object written together. */
export interface SaveGroup {
    key: string;
    date: Date;
    user: string;
    target: string;
    action: string;
    rows: LogItem[];
}

// A save writes its rows within milliseconds; quick saves after each
// other are still told apart when a field repeats.
const SAVE_WINDOW_MS = 2000;

/** Rows grouped into saves, newest first. */
export const groupSaves = (rows: LogItem[]): SaveGroup[] => {
    const sorted = [...rows].sort((x, y) => Date.parse(y.date) - Date.parse(x.date) || y.id - x.id);
    const groups: SaveGroup[] = [];
    for (const row of sorted) {
        const date = new Date(row.date);
        const user = row.user?.name ?? '–';
        const target = row.target ?? row.table_name;
        const last = groups[groups.length - 1];
        if (last && last.user === user && last.target === target && last.action === row.action
            && last.date.getTime() - date.getTime() <= SAVE_WINDOW_MS
            && !last.rows.some(r => rowField(r) === rowField(row) && rowField(row) !== '')) {
            last.rows.push(row);
        } else {
            groups.push({ key: String(row.id), date, user, target, action: row.action, rows: [row] });
        }
    }
    return groups;
};

/** Filters of the dialog; empty arrays mean "all". */
export interface HistoryFilters {
    targets: string[];
    fields: string[];
    users: string[];
    actions: string[];
    from: Date | null;
    to: Date | null;
    text: string;
    hideUnchanged: boolean;
}

export const emptyFilters: HistoryFilters = {
    targets: [], fields: [], users: [], actions: [], from: null, to: null, text: '', hideUnchanged: true,
};

/** The rows that pass the filters. */
export const filterRows = (rows: LogItem[], f: HistoryFilters): LogItem[] => {
    const text = f.text.trim().toLowerCase();
    // The end date includes the whole day.
    const to = f.to ? new Date(f.to.getFullYear(), f.to.getMonth(), f.to.getDate() + 1) : null;
    return rows.filter(row => {
        const date = new Date(row.date);
        return (f.targets.length === 0 || f.targets.includes(row.target ?? row.table_name))
            && (f.fields.length === 0 || f.fields.includes(rowField(row)))
            && (f.users.length === 0 || f.users.includes(row.user?.name ?? '–'))
            && (f.actions.length === 0 || f.actions.includes(row.action))
            && (!f.from || date >= f.from)
            && (!to || date < to)
            && (!text || `${row.old_value ?? ''}\n${row.new_value ?? ''}`.toLowerCase().includes(text))
            && !(f.hideUnchanged && isUnchanged(row));
    });
};

/** Distinct values for a filter's options, in first-seen order. */
export const distinct = (values: string[]): string[] => [...new Set(values)];
