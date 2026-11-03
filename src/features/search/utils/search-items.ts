/** One hit from GET /api/search/<term>. */
export interface SearchItem {
    id: number;
    type: string;
    header: string;
    author?: string;
    description?: string;
}

interface SearchItemType {
    path: string;
    icon: string;
    // Heading for this type's group on the results page.
    label: string;
}

// In the order the results page lists the groups.
export const SEARCH_ITEM_TYPES: Record<string, SearchItemType> = {
    work: { path: "works", icon: "fa-book", label: "Teokset" },
    edition: { path: "editions", icon: "fa-book-bookmark", label: "Painokset" },
    shortstory: { path: "shorts", icon: "fa-scroll", label: "Novellit ja artikkelit" },
    person: { path: "people", icon: "fa-user", label: "Henkilöt" },
    magazine: { path: "magazines", icon: "fa-newspaper", label: "Lehdet" },
    issue: { path: "issues", icon: "fa-file", label: "Lehtien numerot" },
    publisher: { path: "publishers", icon: "fa-building", label: "Kustantajat" },
    bookseries: { path: "bookseries", icon: "fa-list", label: "Kirjasarjat" },
    pubseries: { path: "pubseries", icon: "fa-list-ol", label: "Kustantajien sarjat" },
    tag: { path: "tags", icon: "fa-tag", label: "Asiasanat" },
    award: { path: "awards", icon: "fa-trophy", label: "Palkinnot" },
};

/** Font Awesome icon class for a hit's type. */
export const searchItemIcon = (type: string) => SEARCH_ITEM_TYPES[type]?.icon ?? "fa-question";

/** Site path of a hit, e.g. "/works/12"; null for an unknown type. */
export const searchItemPath = (item: SearchItem) => {
    const type = SEARCH_ITEM_TYPES[item.type];
    return type ? `/${type.path}/${item.id}` : null;
};

/** Plain text of an HTML description, cut to max characters. */
export const searchItemText = (html: string, max = 200) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    const text = (div.textContent ?? "").trim();
    return text.length > max ? text.slice(0, max) + "..." : text;
};

/** Search terms shorter than this don't start a search. */
export const SEARCH_MIN_LENGTH = 3;

/** Path of the search results page for a term. */
export const searchResultsPath = (term: string, titlesOnly: boolean) =>
    `/search?q=${encodeURIComponent(term.trim())}${titlesOnly ? "&titles=1" : ""}`;

/** Group hits by type, in SEARCH_ITEM_TYPES order; unknown types last. */
export const groupSearchItems = (items: SearchItem[]) => {
    const order = Object.keys(SEARCH_ITEM_TYPES);
    const groups = new Map<string, SearchItem[]>();
    for (const item of items) {
        groups.set(item.type, [...(groups.get(item.type) ?? []), item]);
    }
    const rank = (type: string) => (order.includes(type) ? order.indexOf(type) : order.length);
    return [...groups.entries()]
        .sort(([a], [b]) => rank(a) - rank(b))
        .map(([type, groupItems]) => ({ type, items: groupItems }));
};
