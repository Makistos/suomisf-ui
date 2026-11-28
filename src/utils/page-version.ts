// Which version of a page under trial an admin sees: the current one
// ("vanha", what everyone else sees) or the new identity version ("uusi").
// The choice is per browser and per page type, so it stays while the admin
// moves from person to person, or from work to work (and for the front page and short stories).

export type PageVersion = "vanha" | "uusi";
export const PERSON_PAGE_VERSION_KEY = "suomisf.personPageVersion";
export const WORK_PAGE_VERSION_KEY = "suomisf.workPageVersion";
export const FRONT_PAGE_VERSION_KEY = "suomisf.frontPageVersion";
export const SHORT_PAGE_VERSION_KEY = "suomisf.shortPageVersion";
export const BOOKINDEX_PAGE_VERSION_KEY = "suomisf.bookindexPageVersion";
export const PUBLISHERS_PAGE_VERSION_KEY = "suomisf.publishersPageVersion";
export const PUBLISHER_PAGE_VERSION_KEY = "suomisf.publisherPageVersion";
export const NONFICTION_PAGE_VERSION_KEY = "suomisf.nonfictionPageVersion";
export const TAGS_PAGE_VERSION_KEY = "suomisf.tagsPageVersion";
export const TAG_PAGE_VERSION_KEY = "suomisf.tagPageVersion";
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
