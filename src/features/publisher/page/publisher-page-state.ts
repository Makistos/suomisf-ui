// The new publisher page's state, all of it in the URL with readable values (publishers.md: state in the URL):
// /publishers/387?haku=le+guin&vuodet=1970-1979&jarjestys=uusin&sivu=2&nakyma=kannet, /publishers/387?valilehti=sarjat&sarjat=painoksia

export type Tab = "painokset" | "sarjat" | "lehdet";
export type Order = "vanhin" | "uusin" | "nimi" | "tekija";
export type SeriesSort = "nimi" | "painoksia" | "vuodet";
export type Direction = "nouseva" | "laskeva";
export interface YearRange { from: number | null; to: number | null }

export interface PageState {
    valilehti: Tab;
    haku: string;
    vuodet: YearRange | null;
    jarjestys: Order;
    sivu: number;
    riveja: number;
    kannet: boolean;
    sarjat: SeriesSort;
    suunta: Direction;
    /** Only first editions: laitos 1 and printing 1 (owner, #89). */
    ensipainokset: boolean;
    /** One genre's abbreviation, picked in the Genret breakdown (owner, #90); "" for all. */
    genre: string;
}

export const ORDERS: { value: Order; label: string; api: string }[] = [
    { value: "vanhin", label: "Vanhin ensin", api: "oldest" },
    { value: "uusin", label: "Uusin ensin", api: "newest" },
    { value: "nimi", label: "Nimi", api: "title" },
    { value: "tekija", label: "Tekijä", api: "author" },
];
export const ROWS = [50, 100, 200] as const;
const TABS: Tab[] = ["painokset", "sarjat", "lehdet"];
/** Each series column's first click: names A–Ö, the biggest first, the oldest first. */
export const SERIES_DIRECTION: Record<SeriesSort, Direction> = { nimi: "nouseva", painoksia: "laskeva", vuodet: "nouseva" };

const positive = (v: string | null) => (v && /^\d+$/.test(v) && Number(v) > 0 ? Number(v) : null);
const parseRange = (v: string | null): YearRange | null => {
    const m = v?.match(/^(\d{1,4})?-(\d{1,4})?$/);
    if (!m || (!m[1] && !m[2])) return null;
    return { from: m[1] ? Number(m[1]) : null, to: m[2] ? Number(m[2]) : null };
};

export const parsePageState = (p: URLSearchParams): PageState => {
    const tab = p.get("valilehti") as Tab;
    const order = p.get("jarjestys");
    const rows = Number(p.get("riveja"));
    const series = p.get("sarjat") as SeriesSort;
    const sarjat = series in SERIES_DIRECTION ? series : "nimi";
    const dir = p.get("suunta");
    return {
        valilehti: TABS.includes(tab) ? tab : "painokset",
        haku: p.get("haku")?.trim() ?? "",
        vuodet: parseRange(p.get("vuodet")),
        jarjestys: ORDERS.some(o => o.value === order) ? (order as Order) : "vanhin",
        sivu: positive(p.get("sivu")) ?? 1,
        riveja: (ROWS as readonly number[]).includes(rows) ? rows : 100,
        kannet: p.get("nakyma") === "kannet",
        sarjat,
        suunta: dir === "nouseva" || dir === "laskeva" ? dir : SERIES_DIRECTION[sarjat],
        ensipainokset: p.get("ensipainokset") === "1",
        genre: p.get("genre")?.trim() ?? "",
    };
};

/** These change which printings are on page 1, so changing one goes back to it. */
const RESETS: (keyof PageState)[] = ["haku", "vuodet", "jarjestys", "riveja", "ensipainokset", "genre"];

/** A copy of the params with the changes; defaults are left out. */
export const withPageState = (params: URLSearchParams, changes: Partial<PageState>) => {
    const s = { ...parsePageState(params), ...changes };
    if (RESETS.some(k => k in changes) && !("sivu" in changes)) s.sivu = 1;
    const next = new URLSearchParams();
    const set = (key: string, value: string) => { if (value) next.set(key, value); };
    // the order of the keys as a person would read the address
    set("valilehti", s.valilehti === "painokset" ? "" : s.valilehti);
    set("sivu", s.sivu > 1 ? String(s.sivu) : "");
    set("haku", s.haku);
    set("genre", s.genre);
    set("ensipainokset", s.ensipainokset ? "1" : "");
    set("vuodet", s.vuodet && (s.vuodet.from !== null || s.vuodet.to !== null) ? `${s.vuodet.from ?? ""}-${s.vuodet.to ?? ""}` : "");
    set("jarjestys", s.jarjestys === "vanhin" ? "" : s.jarjestys);
    set("riveja", s.riveja === 100 ? "" : String(s.riveja));
    set("nakyma", s.kannet ? "kannet" : "");
    set("sarjat", s.sarjat === "nimi" ? "" : s.sarjat);
    set("suunta", s.suunta === SERIES_DIRECTION[s.sarjat] ? "" : s.suunta);
    return next;
};

/** GET /api/publishers/:id/editions parameters for the state. */
export const apiQuery = (s: PageState) => {
    const q = new URLSearchParams();
    if (s.haku) q.set("q", s.haku);
    if (s.genre) q.set("genre", s.genre);
    if (s.ensipainokset) q.set("first", "1");
    if (s.vuodet?.from != null) q.set("year_min", String(s.vuodet.from));
    if (s.vuodet?.to != null) q.set("year_max", String(s.vuodet.to));
    q.set("sort", ORDERS.find(o => o.value === s.jarjestys)!.api);
    q.set("page", String(s.sivu));
    q.set("rows", String(s.riveja));
    return q.toString();
};

export interface SeriesRow { id: number; name: string; editions: number; first_year: number | null; last_year: number | null }

/** The Sarjat table's order; series without printings last in either direction, then by name. */
export const sortSeries = <R extends SeriesRow>(rows: R[], s: PageState) => {
    const sign = s.suunta === "nouseva" ? 1 : -1;
    const byName = (a: R, b: R) => a.name.localeCompare(b.name, "fi") || a.id - b.id;
    const key = (r: R) => (s.sarjat === "painoksia" ? (r.editions || null) : r.first_year);
    return [...rows].sort((a, b) => {
        if (s.sarjat === "nimi") return sign * byName(a, b);
        const ka = key(a), kb = key(b);
        if (ka === null || kb === null) return ka === kb ? byName(a, b) : ka === null ? 1 : -1;
        return sign * (ka - kb) || byName(a, b);
    });
};
