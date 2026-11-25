// The person page's list state (tab, role, filters, sort, view) and the pure
// functions that apply it. Everything is kept in the URL so back, reload and
// shared links restore the same view; defaults are left out.

export type Sort = "alkuvuosi" | "suomivuosi" | "nimi";
export type View = "lista" | "kannet";
export type YearRange = { from: number; to: number };

export type ListState = {
    osio: string | null;
    rooli: string | null;
    /** Items under one credit: the credited writers' ids ("2370", "2370-5521"). */
    tekija: string | null;
    tyyppi: string | null;
    haku: string;
    vuosi: YearRange | null;
    jarjestys: Sort;
    nakyma: View;
    sarjoittain: boolean;
};

const SORTS: Sort[] = ["alkuvuosi", "suomivuosi", "nimi"];
export const DEFAULT_SORT: Sort = "nimi";

const parseYears = (value: string | null): YearRange | null => {
    const m = value?.match(/^(\d{3,4})(?:-(\d{3,4}))?$/);
    if (!m) return null;
    const from = Number(m[1]);
    return { from, to: m[2] ? Number(m[2]) : from };
};

export const parseListState = (params: URLSearchParams): ListState => {
    const sort = params.get("jarjestys") as Sort;
    return {
        osio: params.get("osio"),
        rooli: params.get("rooli"),
        tekija: params.get("tekija"),
        tyyppi: params.get("tyyppi"),
        haku: params.get("haku") ?? "",
        vuosi: parseYears(params.get("vuosi")),
        // Title by default (decided 2026-11-24).
        jarjestys: SORTS.includes(sort) ? sort : DEFAULT_SORT,
        nakyma: params.get("nakyma") === "kannet" ? "kannet" : "lista",
        sarjoittain: params.get("sarjoittain") === "1",
    };
};

/** A copy of `params` with the given changes. Changing the tab clears that tab's role, type, name and year filters. */
export const withListState = (params: URLSearchParams, changes: Partial<ListState>): URLSearchParams => {
    const next = new URLSearchParams(params);
    if ("osio" in changes && changes.osio !== params.get("osio")) {
        for (const k of ["rooli", "tekija", "tyyppi", "haku", "vuosi"]) next.delete(k);
    }
    // Credits belong to the written items: another role clears the choice.
    if ("rooli" in changes && changes.rooli !== params.get("rooli")) next.delete("tekija");
    const set = (key: string, value: string | null, fallback: string | null = null) => {
        if (value === null || value === "" || value === fallback) next.delete(key);
        else next.set(key, value);
    };
    if ("osio" in changes) set("osio", changes.osio ?? null);
    if ("rooli" in changes) set("rooli", changes.rooli ?? null);
    if ("tekija" in changes) set("tekija", changes.tekija ?? null);
    if ("tyyppi" in changes) set("tyyppi", changes.tyyppi ?? null);
    if ("haku" in changes) set("haku", changes.haku ?? "");
    if ("vuosi" in changes) {
        const v = changes.vuosi;
        set("vuosi", v ? (v.from === v.to ? String(v.from) : `${v.from}-${v.to}`) : null);
    }
    if ("jarjestys" in changes) set("jarjestys", changes.jarjestys ?? null, DEFAULT_SORT);
    if ("nakyma" in changes) set("nakyma", changes.nakyma ?? null, "lista");
    if ("sarjoittain" in changes) set("sarjoittain", changes.sarjoittain ? "1" : null);
    return next;
};

/** "Pitkä novelli" -> "pitka-novelli": type names as URL values. */
export const typeSlug = (name: string) =>
    name.toLowerCase().replace(/[åä]/g, "a").replace(/ö/g, "o").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** What the filters, sorting and grouping need to know about a list row. */
export type ListRow = {
    /** Who it is credited to, for grouping by credit (written books and stories). */
    credit?: { key: string; label: string; rank: number };
    id: number;
    title: string;
    origTitle: string;
    origYear: number | null;
    /** First Finnish printing (or publication) year. */
    firstYear: number | null;
    type: string;
    /** Years of the printings or publications listed on the row. */
    years: number[];
    series: string | null;
};

const matchesName = (r: ListRow, q: string) => {
    if (!q) return true;
    const s = q.toLocaleLowerCase("fi");
    return r.title.toLocaleLowerCase("fi").includes(s) || r.origTitle.toLocaleLowerCase("fi").includes(s);
};
const matchesYear = (r: ListRow, v: YearRange | null) => !v || r.years.some(y => y >= v.from && y <= v.to);
const matchesType = (r: ListRow, t: string | null) => !t || typeSlug(r.type) === t;

export const filterRows = <R extends ListRow>(rows: R[], s: ListState): R[] =>
    rows.filter(r => matchesType(r, s.tyyppi) && matchesName(r, s.haku) && matchesYear(r, s.vuosi));

/** Each type with how many rows it would give together with the other active filters, in first-seen order. */
export const typeFacets = (rows: ListRow[], s: ListState): [string, number][] => {
    const counts = new Map<string, number>();
    for (const r of rows) counts.set(r.type, 0);
    for (const r of rows) {
        if (matchesName(r, s.haku) && matchesYear(r, s.vuosi)) counts.set(r.type, (counts.get(r.type) ?? 0) + 1);
    }
    return [...counts.entries()];
};

const byNumber = (a: number | null, b: number | null) =>
    a === null ? (b === null ? 0 : 1) : b === null ? -1 : a - b;
const byTitle = (a: ListRow, b: ListRow) => a.title.localeCompare(b.title, "fi");

/** Sorted copy; empty years last in every order. */
export const sortRows = <R extends ListRow>(rows: R[], sort: Sort): R[] => [...rows].sort((a, b) => {
    if (sort === "nimi") return byTitle(a, b);
    const key = sort === "alkuvuosi" ? (r: ListRow) => r.origYear ?? r.firstYear : (r: ListRow) => r.firstYear;
    return byNumber(key(a), key(b)) || byTitle(a, b);
});

export type RowGroup<R> = { label: string | null; rows: R[] };

/** Decades when sorted by year, series when "Ryhmittele sarjoittain" is on, one unnamed group when sorted by name. */
export const groupRows = <R extends ListRow>(rows: R[], s: ListState): RowGroup<R>[] => {
    const groups = new Map<string, R[]>();
    const add = (label: string, r: R) => groups.set(label, [...(groups.get(label) ?? []), r]);
    if (s.sarjoittain) {
        for (const r of rows) add(r.series ?? "Ei sarjaa", r);
        const named = [...groups.entries()].filter(([l]) => l !== "Ei sarjaa").sort(([a], [b]) => a.localeCompare(b, "fi"));
        const none = groups.get("Ei sarjaa");
        return [...named.map(([label, rs]) => ({ label, rows: rs })), ...(none ? [{ label: "Ei sarjaa", rows: none }] : [])];
    }
    if (s.jarjestys === "nimi") {
        // By credit, as on the old page: own name first, pen names, collaborations last.
        const credits = new Map(rows.filter(r => r.credit).map(r => [r.credit!.key, r.credit!]));
        if (credits.size <= 1) return [{ label: null, rows }];
        const order = [...credits.values()].sort((a, b) => a.rank - b.rank || a.label.localeCompare(b.label, "fi"));
        return order.map(c => ({ label: c.label, rows: rows.filter(r => r.credit?.key === c.key) }));
    }
    for (const r of rows) {
        const y = s.jarjestys === "alkuvuosi" ? r.origYear ?? r.firstYear : r.firstYear;
        add(y ? `${Math.floor(y / 10) * 10}-luku` : "Vuosi ei tiedossa", r);
    }
    return [...groups.entries()].map(([label, rs]) => ({ label, rows: rs }));
};
