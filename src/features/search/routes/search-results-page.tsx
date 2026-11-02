import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Checkbox } from "primereact/checkbox";
import { ProgressSpinner } from "primereact/progressspinner";

import { getApiContent } from "@services/user-service";
import { getCurrenUser } from "@services/auth-service";
import { LoadError } from "@components/load-error";
import {
    groupSearchItems, SEARCH_ITEM_TYPES, SEARCH_MIN_LENGTH, SearchItem,
    searchItemIcon, searchItemPath, searchItemText,
} from "../utils/search-items";

// The menu's suggestions show 50 hits; this page asks for the most the API gives.
export const SEARCH_RESULTS_LIMIT = 500;

/**
 * Full results of a main-menu search (/search?q=<term>[&titles=1]),
 * opened by pressing Enter in the search bar. Hits are grouped by type.
 */
export const SearchResultsPage = () => {
    const user = useMemo(() => getCurrenUser(), []);
    const [searchParams, setSearchParams] = useSearchParams();
    const term = (searchParams.get("q") ?? "").trim();
    const titlesOnly = searchParams.get("titles") === "1";
    const searchable = term.length >= SEARCH_MIN_LENGTH;

    useEffect(() => {
        document.title = `SF-Bibliografia - Haku: ${term}`;
    }, [term]);

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["search", term, titlesOnly],
        queryFn: async (): Promise<SearchItem[]> =>
            getApiContent(`search/${encodeURIComponent(term)}?limit=${SEARCH_RESULTS_LIMIT}`
                + (titlesOnly ? "&titles=1" : ""), user).then(response => response.data),
        enabled: searchable,
    });

    const setTitlesOnly = (value: boolean) => {
        // Same preference as the menu's "Vain nimet" checkbox.
        localStorage.setItem("searchTitlesOnly", value ? "1" : "0");
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            if (value) next.set("titles", "1"); else next.delete("titles");
            return next;
        }, { replace: true });
    };

    if (error) return <LoadError error={error} notFoundTitle="Haku epäonnistui" onRetry={() => refetch()} />;

    const groups = groupSearchItems(data ?? []);

    return (
        <main className="all-content search-results-page">
            <h1>Haku: {term}</h1>
            <div className="flex align-items-center gap-3 flex-wrap mb-4">
                <span className="flex align-items-center gap-2">
                    <Checkbox
                        inputId="searchPageTitlesOnly"
                        checked={titlesOnly}
                        onChange={e => setTitlesOnly(!!e.checked)}
                    />
                    <label htmlFor="searchPageTitlesOnly">Vain nimet</label>
                </span>
                {data && (
                    <span className="text-color-secondary">
                        {data.length.toLocaleString("fi-FI")} tulosta
                        {data.length >= SEARCH_RESULTS_LIMIT && ` (näytetään ${SEARCH_RESULTS_LIMIT} ensimmäistä)`}
                    </span>
                )}
            </div>

            {!searchable ? (
                <p>Kirjoita hakuun vähintään {SEARCH_MIN_LENGTH} merkkiä.</p>
            ) : isLoading ? (
                <div className="flex justify-content-center p-4"><ProgressSpinner /></div>
            ) : groups.length === 0 ? (
                <p>Ei tuloksia.</p>
            ) : (
                <>
                    {/* Jump links to the groups, when there is more than one. */}
                    {groups.length > 1 && (
                        <nav aria-label="Tulosryhmät" className="flex flex-wrap gap-3 mb-4">
                            {groups.map(({ type, items }) => (
                                <a key={type} href={`#search-${type}`}>
                                    {SEARCH_ITEM_TYPES[type]?.label ?? type} ({items.length})
                                </a>
                            ))}
                        </nav>
                    )}
                    {groups.map(({ type, items }) => (
                        <section key={type} id={`search-${type}`} aria-labelledby={`search-${type}-heading`}
                            className="mb-4">
                            <h2 id={`search-${type}-heading`} className="mb-2">
                                {SEARCH_ITEM_TYPES[type]?.label ?? type}
                                <span className="text-color-secondary font-normal text-base ml-2">{items.length}</span>
                            </h2>
                            <ul className="list-none p-0 m-0">
                                {items.map(item => {
                                    const path = searchItemPath(item);
                                    return (
                                        <li key={`${item.type}-${item.id}`} className="search-result mb-2">
                                            <i className={`fa ${searchItemIcon(item.type)} mr-2 text-color-secondary`}
                                                aria-hidden="true" />
                                            {path ? <Link to={path}>{item.header}</Link> : item.header}
                                            {item.author && <span className="searchItemAuthor">: {item.author}</span>}
                                            {item.description && (
                                                <div className="text-sm text-color-secondary mt-1">
                                                    {searchItemText(item.description)}
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    ))}
                </>
            )}
        </main>
    );
};

export default SearchResultsPage;
