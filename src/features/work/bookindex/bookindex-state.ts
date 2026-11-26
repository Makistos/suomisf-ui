// The new book index's state, all of it in the URL with readable values (book-index.md: "/bookindex?tekija=le+guin&tyyppi=romaani&sivu=2").

export const WORK_TYPES = {
    romaani: { id: 1, label: "Romaani" },
    kokoelma: { id: 2, label: "Kokoelma" },
    kokoomateos: { id: 6, label: "Kokoomateos" },
    sarjakuva: { id: 3, label: "Sarjakuva" },
    vihko: { id: 5, label: "Vihko" },
    tietokirja: { id: 4, label: "Tietokirja" },
} as const;
export type TypeSlug = keyof typeof WORK_TYPES;

export type Sort = "tekija" | "nimi" | "vuosi" | "uusin";
export const SORTS: { value: Sort; label: string; api: string }[] = [
    { value: "tekija", label: "Tekijä ja nimi", api: "author" },
    { value: "nimi", label: "Nimi", api: "title" },
    { value: "vuosi", label: "Alkuteoksen vuosi", api: "year" },
    { value: "uusin", label: "Uusin ensin", api: "newest" },
];
export const ROWS = [50, 100, 200] as const;
/** The author letter bar, Finnish order. */
export const LETTERS = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ"];

export interface YearRange { from: number | null; to: number | null }

export interface IndexState {
    tekija: string;
    nimi: string;
    alkunimi: string;
    alkuteos: YearRange | null;
    painettu: YearRange | null;
    kansallisuus: number | null;
    tyyppi: TypeSlug[];
    genre: string[];
    kirjain: string | null;
    jarjestys: Sort;
    ryhmittely: boolean;
    nakyma: "lista" | "kannet";
    sivu: number;
    riveja: number;
}

const DEFAULTS: IndexState = {
    tekija: "", nimi: "", alkunimi: "", alkuteos: null, painettu: null, kansallisuus: null, tyyppi: [], genre: [], kirjain: null,
    // Grouped by author and 200 a page (owner, 2026-11-26): the old list grouped by author too.
    jarjestys: "tekija", ryhmittely: true, nakyma: "lista", sivu: 1, riveja: 200,
};
/** Changing any of these is a new search, so it starts from the first page. */
const FILTERS: (keyof IndexState)[] = ["tekija", "nimi", "alkunimi", "alkuteos", "painettu", "kansallisuus", "tyyppi", "genre", "kirjain"];

const positive = (v: string | null) => (v && /^\d+$/.test(v) && Number(v) > 0 ? Number(v) : null);
const list = (v: string | null) => (v ? v.split(",").map(x => x.trim()).filter(Boolean) : []);

/** "1960-1969", "2000-" or "-1969" */
const parseRange = (v: string | null): YearRange | null => {
    const m = v?.match(/^(\d{1,4})?-(\d{1,4})?$/);
    if (!m || (!m[1] && !m[2])) return null;
    return { from: m[1] ? Number(m[1]) : null, to: m[2] ? Number(m[2]) : null };
};
const writeRange = (r: YearRange | null) => (r && (r.from !== null || r.to !== null) ? `${r.from ?? ""}-${r.to ?? ""}` : "");

export const parseIndexState = (p: URLSearchParams): IndexState => {
    const sort = p.get("jarjestys");
    const letter = p.get("kirjain")?.toUpperCase() ?? "";
    const rows = Number(p.get("riveja"));
    return {
        tekija: p.get("tekija")?.trim() ?? "",
        nimi: p.get("nimi")?.trim() ?? "",
        alkunimi: p.get("alkunimi")?.trim() ?? "",
        alkuteos: parseRange(p.get("alkuteos")),
        painettu: parseRange(p.get("painettu")),
        kansallisuus: positive(p.get("kansallisuus")),
        tyyppi: list(p.get("tyyppi")).filter((t): t is TypeSlug => t in WORK_TYPES),
        genre: list(p.get("genre")),
        kirjain: LETTERS.includes(letter) ? letter : null,
        jarjestys: SORTS.some(s => s.value === sort) ? (sort as Sort) : "tekija",
        ryhmittely: p.get("ryhmittely") !== "ei",
        nakyma: p.get("nakyma") === "kannet" ? "kannet" : "lista",
        sivu: positive(p.get("sivu")) ?? 1,
        riveja: (ROWS as readonly number[]).includes(rows) ? rows : DEFAULTS.riveja,
    };
};

export const hasFilters = (s: IndexState) => FILTERS.some(k => JSON.stringify(s[k]) !== JSON.stringify(DEFAULTS[k]));

const serial = (key: keyof IndexState, value: IndexState[keyof IndexState]): string => {
    switch (key) {
        case "alkuteos": case "painettu": return writeRange(value as YearRange | null);
        case "tyyppi": case "genre": return (value as string[]).join(",");
        case "ryhmittely": return value ? "" : "ei";
        case "kansallisuus": return value === null ? "" : String(value);
        default: return value === DEFAULTS[key] ? "" : String(value ?? "");
    }
};

/** A copy of the params with the changes; defaults are left out, and a new search starts from page 1. */
export const withIndexState = (params: URLSearchParams, changes: Partial<IndexState>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes) as [keyof IndexState, IndexState[keyof IndexState]][]) {
        const text = serial(key, value);
        if (text) next.set(key, text); else next.delete(key);
    }
    if (FILTERS.some(k => k in changes) && !("sivu" in changes)) next.delete("sivu");
    return next;
};

/** GET /api/bookindex parameters for the state. */
export const apiQuery = (s: IndexState) => {
    const q = new URLSearchParams();
    const add = (k: string, v: string | number | null | undefined) => { if (v !== null && v !== undefined && v !== "") q.set(k, String(v)); };
    add("author", s.tekija);
    add("title", s.nimi);
    add("orig_title", s.alkunimi);
    add("origyear_min", s.alkuteos?.from);
    add("origyear_max", s.alkuteos?.to);
    add("printyear_min", s.painettu?.from);
    add("printyear_max", s.painettu?.to);
    add("nationality", s.kansallisuus);
    add("type", s.tyyppi.map(t => WORK_TYPES[t].id).join(","));
    add("genre", s.genre.join(","));
    add("initial", s.kirjain);
    add("sort", SORTS.find(x => x.value === s.jarjestys)!.api);
    add("page", s.sivu);
    add("rows", s.riveja);
    return q.toString();
};

type Named = { id: number; name: string; alt_name: string | null };
const personName = (p: Named) => p.alt_name || (p.name.includes(", ") ? p.name.split(", ").reverse().join(" ") : p.name);
/** "Le Guin, Ursula K. & Halme, Jukka (toim.)" → "Ursula K. Le Guin & Jukka Halme (toim.)" */
export const naturalAuthors = (s: string | null | undefined) => {
    if (!s) return "";
    const editor = /\s*\(toim\.\)$/.test(s);
    return s.replace(/\s*\(toim\.\)$/, "").split(" & ").map(p => (p.includes(", ") ? p.split(", ").reverse().join(" ") : p)).join(" & ")
        + (editor ? " (toim.)" : "");
};

/**
 * Author groups for one page, in the order the rows came: a new group whenever the first author changes.
 * The same author can come back later on a page (sorted by the author string, a co-written book sits between),
 * so each group's key carries its position: repeated React keys left stale rows on screen.
 */
export const groupByAuthor = <W extends { id: number; authors: Named[]; author_str: string | null }>(works: W[]) =>
    works.reduce<{ key: string; name: string; id?: number; rows: W[] }[]>((acc, w) => {
        const a = w.authors[0];
        const who = a ? `p${a.id}` : `s${w.author_str ?? ""}`;
        const last = acc[acc.length - 1];
        if (last && last.key.endsWith(`:${who}`)) last.rows.push(w);
        else acc.push({ key: `${acc.length}:${who}`, name: a ? personName(a) : naturalAuthors(w.author_str) || "Tekijä ei tiedossa", id: a?.id, rows: [w] });
        return acc;
    }, []);
