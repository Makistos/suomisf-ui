// The new publisher list's state, all of it in the URL with readable values (publishers.md: "state in the URL"):
// /publishers?nimi=werner&toiminut=1950-1980&piilota=tyhjat&jarjestys=painoksia

export interface ListRow {
    id: number;
    name: string;
    fullname: string;
    editions: number;
    first_year: number | null;
    last_year: number | null;
    magazines: { id: number; name: string; issues: number }[];
}

export type Sort = "nimi" | "painoksia" | "vuodet";
export type Direction = "nouseva" | "laskeva";
export interface YearRange { from: number | null; to: number | null }

export interface ListState {
    nimi: string;
    toiminut: YearRange | null;
    /** Hide publishers without editions ("Piilota ilman painoksia"). */
    piilota: boolean;
    jarjestys: Sort;
    suunta: Direction;
}

/** Each column's first click: names A–Ö, the biggest publishers first, the oldest first. */
export const DEFAULT_DIRECTION: Record<Sort, Direction> = { nimi: "nouseva", painoksia: "laskeva", vuodet: "nouseva" };
const SORTS = Object.keys(DEFAULT_DIRECTION) as Sort[];

const parseRange = (v: string | null): YearRange | null => {
    const m = v?.match(/^(\d{1,4})?-(\d{1,4})?$/);
    if (!m || (!m[1] && !m[2])) return null;
    return { from: m[1] ? Number(m[1]) : null, to: m[2] ? Number(m[2]) : null };
};

export const parseListState = (p: URLSearchParams): ListState => {
    const sort = p.get("jarjestys");
    const jarjestys = SORTS.includes(sort as Sort) ? (sort as Sort) : "nimi";
    const dir = p.get("suunta");
    return {
        nimi: p.get("nimi")?.trim() ?? "",
        toiminut: parseRange(p.get("toiminut")),
        piilota: p.get("piilota") === "tyhjat",
        jarjestys,
        suunta: dir === "nouseva" || dir === "laskeva" ? dir : DEFAULT_DIRECTION[jarjestys],
    };
};

/** A copy of the params with the changes; defaults are left out. */
export const withListState = (params: URLSearchParams, changes: Partial<ListState>) => {
    const next = new URLSearchParams(params);
    const state = { ...parseListState(params), ...changes };
    const set = (key: string, value: string) => (value ? next.set(key, value) : next.delete(key));
    set("nimi", state.nimi.trim() ? state.nimi : "");
    set("toiminut", state.toiminut && (state.toiminut.from !== null || state.toiminut.to !== null)
        ? `${state.toiminut.from ?? ""}-${state.toiminut.to ?? ""}` : "");
    set("piilota", state.piilota ? "tyhjat" : "");
    set("jarjestys", state.jarjestys === "nimi" ? "" : state.jarjestys);
    set("suunta", state.suunta === DEFAULT_DIRECTION[state.jarjestys] ? "" : state.suunta);
    return next;
};

const words = (s: string) => s.toLocaleLowerCase("fi").split(/[\s/,-]+/);

export const filterPublishers = <R extends ListRow>(rows: R[], s: ListState) => {
    const q = s.nimi.toLocaleLowerCase("fi");
    return rows.filter(r => {
        if (q && ![...words(r.name), ...words(r.fullname)].some(w => w.startsWith(q))
            && !r.name.toLocaleLowerCase("fi").startsWith(q) && !r.fullname.toLocaleLowerCase("fi").startsWith(q)) return false;
        if (s.piilota && r.editions === 0) return false;
        if (s.toiminut) {
            if (r.first_year === null || r.last_year === null) return false;
            if (s.toiminut.from !== null && r.last_year < s.toiminut.from) return false;
            if (s.toiminut.to !== null && r.first_year > s.toiminut.to) return false;
        }
        return true;
    });
};

const byName = (a: ListRow, b: ListRow) => a.name.localeCompare(b.name, "fi") || a.id - b.id;

/** Sorted by the chosen column; publishers without editions last in either direction, then by name. */
export const sortPublishers = <R extends ListRow>(rows: R[], s: ListState) => {
    const sign = s.suunta === "nouseva" ? 1 : -1;
    const key = (r: ListRow) => (s.jarjestys === "painoksia" ? (r.editions || null) : s.jarjestys === "vuodet" ? r.first_year : null);
    return [...rows].sort((a, b) => {
        if (s.jarjestys === "nimi") return sign * byName(a, b);
        const ka = key(a), kb = key(b);
        if (ka === null || kb === null) return ka === kb ? byName(a, b) : ka === null ? 1 : -1;
        return sign * (ka - kb) || byName(a, b);
    });
};

/** The activity bars' common axis: the earliest first year to the latest last year. */
export const yearAxis = (rows: ListRow[]) => {
    const firsts = rows.map(r => r.first_year).filter((y): y is number => y !== null);
    const lasts = rows.map(r => r.last_year).filter((y): y is number => y !== null);
    return firsts.length ? { from: Math.min(...firsts), to: Math.max(...lasts) } : null;
};
