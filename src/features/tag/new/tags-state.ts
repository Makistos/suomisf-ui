// The new tag pages' URL state, with readable values (tags.md: tab, letter and sort in the URL).

/** Tag groups in tab order, with the work page's names (tags.md); the API's tag type ids. */
export const GROUPS = [
    { slug: "alalajit", id: 2, label: "Alalajit", one: "Alalaji", big: false },
    { slug: "tyylit", id: 3, label: "Tyylit", one: "Tyyli", big: false },
    { slug: "aiheet", id: 1, label: "Aiheet", one: "Aihe", big: true },
    { slug: "hahmot", id: 4, label: "Hahmot ja olennot", one: "Hahmo tai olento", big: true },
    { slug: "paikat", id: 5, label: "Paikat", one: "Paikka", big: true },
    { slug: "aika", id: 6, label: "Aika", one: "Aika", big: false },
    { slug: "listat", id: 7, label: "Listat ja sovitukset", one: "Lista tai sovitus", big: false },
] as const;
export type Group = typeof GROUPS[number];

/** The letter bar for big groups; "0" stands for names that start with something else (1800-luku). */
export const TAG_LETTERS = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ", "0"];
export const letterLabel = (l: string) => (l === "0" ? "0–9" : l);

export interface TagsState {
    ryhma: Group;
    /** null = every letter */
    kirjain: string | null;
    haku: string;
    jarjestys: "nimi" | "maara";
}

/** A type id from the API (null = no type, which the site counts as Aihe). */
export const groupOf = (typeId: number | null | undefined) => GROUPS.find(g => g.id === (typeId ?? 1)) ?? GROUPS[2];

/** The list opens on Alalajit (owner, 2026-11-23); a big group opens at A, the rest show every tag. */
export const parseTagsState = (p: URLSearchParams): TagsState => {
    const ryhma = GROUPS.find(g => g.slug === p.get("ryhma")) ?? GROUPS[0];
    const letter = p.get("kirjain")?.toUpperCase() ?? "";
    return {
        ryhma,
        kirjain: !ryhma.big ? null : letter === "KAIKKI" ? null : TAG_LETTERS.includes(letter) ? letter : "A",
        haku: p.get("haku")?.trim() ?? "",
        jarjestys: p.get("jarjestys") === "maara" ? "maara" : "nimi",
    };
};

/** The URL for a state; defaults are left out ("kaikki" is written, since a big group's default is A). */
export const writeTagsState = (s: TagsState) => {
    const p = new URLSearchParams();
    if (s.ryhma.slug !== GROUPS[0].slug) p.set("ryhma", s.ryhma.slug);
    if (s.ryhma.big && s.kirjain !== "A") p.set("kirjain", s.kirjain === null ? "kaikki" : s.kirjain);
    if (s.haku) p.set("haku", s.haku);
    if (s.jarjestys === "maara") p.set("jarjestys", "maara");
    return p;
};

/** GET /api/tagindex parameters; a search covers the whole group, so the letter is left out then. */
export const tagIndexQuery = (s: TagsState, unused: boolean) => {
    const q = new URLSearchParams({ type: String(s.ryhma.id) });
    if (s.haku) q.set("q", s.haku);
    else if (s.kirjain) q.set("letter", s.kirjain);
    if (s.jarjestys === "maara") q.set("sort", "count");
    if (unused) q.set("unused", "1");
    return q.toString();
};

export type TagTab = "teokset" | "novellit" | "artikkelit";
/** Story types that are articles rather than fiction (Artikkeli, Esipuhe, Jälkisanat), as on the current tag page. */
export const ARTICLE_TYPES = [7, 8, 9];

/** "40 teosta, 12 novellia, 10 artikkelia"; empty parts left out. */
export const tagFacts = (works: number, stories: number, articles: number) => {
    const n = (v: number) => v.toLocaleString("fi-FI").replace(/\s/g, " ");
    return [
        works > 0 && `${n(works)} ${works === 1 ? "teos" : "teosta"}`,
        stories > 0 && `${n(stories)} ${stories === 1 ? "novelli" : "novellia"}`,
        articles > 0 && `${n(articles)} ${articles === 1 ? "artikkeli" : "artikkelia"}`,
    ].filter(Boolean).join(", ");
};
