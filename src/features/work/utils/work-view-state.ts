// The work page's view state. The URL is the source of truth (links, reload
// and back keep it); without a value there, the reader's last choice on this
// device is used, then the default (work.md, decided 2026-11-23).

import type { GroupingMode } from "./work-facts";

export type WorkView = "taulukko" | "kortit";
export interface WorkViewState {
    mode: GroupingMode;
    view: WorkView;
    /** The printing picked on the shelf (an edition id). */
    painos: number | null;
}

type Storage = { getItem(key: string): string | null; setItem(key: string, value: string): void };

const MODE_KEY = "suomisf.work.ryhmittely";
const VIEW_KEY = "suomisf.work.nakyma";
const MODES: Record<string, GroupingMode> = { kaikki: "all", samanlaiset: "condensed", laitoksittain: "brief" };
const MODE_NAMES: Record<GroupingMode, string> = { all: "kaikki", condensed: "samanlaiset", brief: "laitoksittain" };
const VIEWS: WorkView[] = ["taulukko", "kortit"];

const stored = (storage: Storage | null, key: string) => {
    try { return storage?.getItem(key) ?? null; } catch { return null; }
};

export const readViewState = (params: URLSearchParams, storage: Storage | null): WorkViewState => {
    const mode = MODES[params.get("ryhmittely") ?? ""] ?? MODES[stored(storage, MODE_KEY) ?? ""] ?? "condensed";
    const view = [params.get("nakyma"), stored(storage, VIEW_KEY)].find((v): v is WorkView => VIEWS.includes(v as WorkView)) ?? "taulukko";
    const painos = Number(params.get("painos"));
    return { mode, view, painos: Number.isInteger(painos) && painos > 0 ? painos : null };
};

/** A copy of the params with the changes; defaults are left out of the URL. */
export const withViewState = (params: URLSearchParams, changes: Partial<WorkViewState>) => {
    const next = new URLSearchParams(params);
    if (changes.mode !== undefined) {
        if (changes.mode === "condensed") next.delete("ryhmittely"); else next.set("ryhmittely", MODE_NAMES[changes.mode]);
    }
    if (changes.view !== undefined) {
        if (changes.view === "taulukko") next.delete("nakyma"); else next.set("nakyma", changes.view);
    }
    if (changes.painos !== undefined) {
        if (changes.painos === null) next.delete("painos"); else next.set("painos", String(changes.painos));
    }
    return next;
};

export const rememberViewState = (storage: Storage | null, state: Pick<WorkViewState, "mode" | "view">) => {
    try {
        storage?.setItem(MODE_KEY, MODE_NAMES[state.mode]);
        storage?.setItem(VIEW_KEY, state.view);
    } catch {
        // the choice then lasts only for this page view
    }
};
