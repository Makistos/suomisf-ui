// Which version of a page under trial an admin sees: the current one
// ("vanha", what everyone else sees) or the new identity version ("uusi").
// The choice is per browser and per page type, so it stays while the admin
// moves from person to person, or from work to work (and for the front page).

export type PageVersion = "vanha" | "uusi";
export const PERSON_PAGE_VERSION_KEY = "suomisf.personPageVersion";
export const WORK_PAGE_VERSION_KEY = "suomisf.workPageVersion";
export const FRONT_PAGE_VERSION_KEY = "suomisf.frontPageVersion";
export const PAGE_VERSION_HOTKEY = "Shift+U";

type Storage = { getItem(key: string): string | null; setItem(key: string, value: string): void };

export const readPageVersion = (storage: Storage | null, key: string): PageVersion => {
    try {
        return storage?.getItem(key) === "uusi" ? "uusi" : "vanha";
    } catch {
        return "vanha"; // private mode or blocked storage
    }
};

export const writePageVersion = (storage: Storage | null, key: string, version: PageVersion) => {
    try {
        storage?.setItem(key, version);
    } catch {
        // the choice then lasts only for this page view
    }
};

const isEditable = (target: EventTarget | null) =>
    target instanceof HTMLElement
    && (target.isContentEditable || target.contentEditable === "true" || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/**
 * Shift+U, matched by key position (`code`) so it works on every layout; not while typing in a field.
 * No Alt or Ctrl: browser extensions can only take shortcuts with those (Bitwarden has Alt+Shift+U).
 */
export const isPageVersionHotkey = (e: Pick<KeyboardEvent, "altKey" | "shiftKey" | "ctrlKey" | "metaKey" | "code" | "target">) =>
    e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey && e.code === "KeyU" && !isEditable(e.target);
