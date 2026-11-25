import { describe, expect, it } from "vitest";

import { readViewState, rememberViewState, withViewState } from "./work-view-state";

const memory = (entries: Record<string, string> = {}) => {
    const store = new Map(Object.entries(entries));
    return { store, storage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) } };
};

describe("readViewState", () => {
    it("defaults to similar printings together, as a table, nothing picked", () => {
        expect(readViewState(new URLSearchParams(), null)).toEqual({ mode: "brief", view: "taulukko", painos: null });
    });

    it("reads grouping, view and the picked printing from the URL", () => {
        const p = new URLSearchParams("ryhmittely=kaikki&nakyma=kortit&painos=10207");
        expect(readViewState(p, null)).toEqual({ mode: "all", view: "kortit", painos: 10207 });
        expect(readViewState(new URLSearchParams("ryhmittely=laitoksittain"), null).mode).toBe("brief");
    });

    it("uses the last choice on this device when the URL has none, and the URL when it has", () => {
        const { storage } = memory({ "suomisf.work.ryhmittely": "laitoksittain", "suomisf.work.nakyma": "kortit" });
        expect(readViewState(new URLSearchParams(), storage)).toEqual({ mode: "brief", view: "kortit", painos: null });
        expect(readViewState(new URLSearchParams("ryhmittely=kaikki"), storage).mode).toBe("all");
    });

    it("ignores unknown values and storage that throws", () => {
        const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
        expect(readViewState(new URLSearchParams("ryhmittely=x&nakyma=y&painos=abc"), broken))
            .toEqual({ mode: "brief", view: "taulukko", painos: null });
        expect(() => rememberViewState(broken, { mode: "all", view: "kortit" })).not.toThrow();
    });
});

describe("withViewState", () => {
    it("writes only what differs from the defaults and keeps other parameters", () => {
        const p = withViewState(new URLSearchParams("x=1&ryhmittely=kaikki"), { mode: "brief", view: "kortit" });
        expect(p.toString()).toBe("x=1&nakyma=kortit");
        // "Samanlaiset yhdessä" is no longer the default, so it is written out.
        expect(withViewState(new URLSearchParams(), { mode: "condensed" }).toString()).toBe("ryhmittely=samanlaiset");
        expect(withViewState(new URLSearchParams(), { painos: 5 }).toString()).toBe("painos=5");
        expect(withViewState(new URLSearchParams("painos=5"), { painos: null }).toString()).toBe("");
    });
});

describe("rememberViewState", () => {
    it("stores the reader's choice for the next work", () => {
        const { store, storage } = memory();
        rememberViewState(storage, { mode: "brief", view: "taulukko" });
        expect(store.get("suomisf.work.ryhmittely")).toBe("laitoksittain");
        expect(store.get("suomisf.work.nakyma")).toBe("taulukko");
    });
});
