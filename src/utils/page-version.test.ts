// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import {
    FRONT_PAGE_VERSION_KEY, isPageVersionHotkey, readPageVersion, writePageVersion, PERSON_PAGE_VERSION_KEY, SHORT_PAGE_VERSION_KEY, WORK_PAGE_VERSION_KEY, BOOKINDEX_PAGE_VERSION_KEY, PUBLISHERS_PAGE_VERSION_KEY, PUBLISHER_PAGE_VERSION_KEY,
} from "./page-version";

const key = (fields: Partial<KeyboardEvent>, target: EventTarget | null = document.body) =>
    ({ altKey: false, shiftKey: false, ctrlKey: false, metaKey: false, code: "", target, ...fields }) as KeyboardEvent;

describe("isPageVersionHotkey", () => {
    it("is Shift+U, by key position so it works on any keyboard layout", () => {
        expect(isPageVersionHotkey(key({ shiftKey: true, code: "KeyU" }))).toBe(true);
        expect(isPageVersionHotkey(key({ code: "KeyU" }))).toBe(false);
        expect(isPageVersionHotkey(key({ shiftKey: true, code: "KeyY" }))).toBe(false);
    });

    it("leaves Alt, Ctrl and Cmd combinations to the browser and its extensions", () => {
        // Alt+Shift+U opens Bitwarden's side panel.
        expect(isPageVersionHotkey(key({ altKey: true, shiftKey: true, code: "KeyU" }))).toBe(false);
        expect(isPageVersionHotkey(key({ ctrlKey: true, shiftKey: true, code: "KeyU" }))).toBe(false);
        expect(isPageVersionHotkey(key({ metaKey: true, shiftKey: true, code: "KeyU" }))).toBe(false);
    });

    it("does nothing while the admin types in a field", () => {
        const input = document.createElement("input");
        const editable = document.createElement("div");
        editable.contentEditable = "true";
        expect(isPageVersionHotkey(key({ shiftKey: true, code: "KeyU" }, input))).toBe(false);
        expect(isPageVersionHotkey(key({ shiftKey: true, code: "KeyU" }, editable))).toBe(false);
    });
});

describe("readPageVersion / writePageVersion", () => {
    const memory = () => {
        const store = new Map<string, string>();
        return { store, storage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) } };
    };

    it("remembers the choice and defaults to the current page", () => {
        const { store, storage } = memory();
        expect(readPageVersion(storage, PERSON_PAGE_VERSION_KEY)).toBe("vanha");
        writePageVersion(storage, PERSON_PAGE_VERSION_KEY, "uusi");
        expect(store.get(PERSON_PAGE_VERSION_KEY)).toBe("uusi");
        expect(readPageVersion(storage, PERSON_PAGE_VERSION_KEY)).toBe("uusi");
    });

    it("keeps the person and work page choices apart", () => {
        const { storage } = memory();
        writePageVersion(storage, WORK_PAGE_VERSION_KEY, "uusi");
        expect(readPageVersion(storage, WORK_PAGE_VERSION_KEY)).toBe("uusi");
        expect(readPageVersion(storage, PERSON_PAGE_VERSION_KEY)).toBe("vanha");
        expect(PERSON_PAGE_VERSION_KEY).toBe("suomisf.personPageVersion"); // admins' existing choice stays
        writePageVersion(storage, FRONT_PAGE_VERSION_KEY, "uusi");
        expect(FRONT_PAGE_VERSION_KEY).toBe("suomisf.frontPageVersion");
        expect(SHORT_PAGE_VERSION_KEY).toBe("suomisf.shortPageVersion");
        expect(BOOKINDEX_PAGE_VERSION_KEY).toBe("suomisf.bookindexPageVersion");
        expect(PUBLISHERS_PAGE_VERSION_KEY).toBe("suomisf.publishersPageVersion");
        expect(PUBLISHER_PAGE_VERSION_KEY).toBe("suomisf.publisherPageVersion");
        expect(new Set([FRONT_PAGE_VERSION_KEY, WORK_PAGE_VERSION_KEY, PERSON_PAGE_VERSION_KEY, SHORT_PAGE_VERSION_KEY, BOOKINDEX_PAGE_VERSION_KEY,
            PUBLISHERS_PAGE_VERSION_KEY, PUBLISHER_PAGE_VERSION_KEY]).size).toBe(7);
        expect(readPageVersion(storage, PERSON_PAGE_VERSION_KEY)).toBe("vanha");
    });

    it("falls back to the current page when storage is unavailable", () => {
        const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
        expect(readPageVersion(broken, WORK_PAGE_VERSION_KEY)).toBe("vanha");
        expect(() => writePageVersion(broken, WORK_PAGE_VERSION_KEY, "uusi")).not.toThrow();
        expect(readPageVersion(null, WORK_PAGE_VERSION_KEY)).toBe("vanha");
    });
});
