import { Fragment, ReactNode } from "react";
import { Link } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { getApiContent } from "@services/user-service";
import { getCurrenUser } from "@services/auth-service";
import { apiQuery, groupByAuthor, IndexState, ROWS, SORTS, statsQuery } from "./bookindex-state";
import { BookIndexStats } from "./book-index-stats";
import { IndexPage, IndexRow, WorkRow } from "./work-row";

const n = (v: number) => v.toLocaleString("fi-FI").replace(/\s/g, " ");
const plural = (v: number, one: string, many: string) => `${n(v)} ${v === 1 ? one : many}`;

interface BookResultsProps {
    state: IndexState;
    update: (changes: Partial<IndexState>) => void;
    /** GET /api/bookindex parameters the page adds to the state's, e.g. "tag=303" */
    extra?: string;
    /** what was searched, in words, after the count; "" for nothing */
    summary: string;
    /** clears the page's filters; shown with an empty result when given */
    clear?: () => void;
    empty: string;
    note?: (w: IndexRow) => ReactNode;
}

const withExtra = (query: string, extra?: string) => (extra ? `${query}&${extra}` : query);

/**
 * A paged list of works with the agreed rows (book-index.md): the count and what was searched, sorting, grouping by author,
 * "Tilastot tästä hausta", the rows, paging. The book index, /nonfiction and the tag page share it; the page owns the filters.
 */
export const BookResults = ({ state, update, extra, summary, clear, empty, note }: BookResultsProps) => {
    const query = withExtra(apiQuery(state), extra);
    const { data, isError, isFetching, isPlaceholderData, refetch } = useQuery<IndexPage>({
        queryKey: ["bookindex", query],
        queryFn: async () => (await getApiContent(`bookindex?${query}`, getCurrenUser())).data,
        placeholderData: keepPreviousData,
    });
    const goTo = (sivu: number) => {
        update({ sivu });
        document.getElementById("bn-count")?.scrollIntoView({ block: "start" });
    };
    const works = data?.works ?? [];
    const first = data && data.total > 0 ? (data.page - 1) * data.rows + 1 : 0;
    const last = data ? Math.min(data.total, data.page * data.rows) : 0;
    const pages = data ? Math.max(1, Math.ceil(data.total / data.rows)) : 1;
    const groups = state.ryhmittely ? groupByAuthor(works) : [{ key: "all", name: "", id: undefined, rows: works }];

    return (
        <section className="bn-results" aria-labelledby="bn-count" aria-busy={isFetching}>
            <div className="bn-rhead">
                <p id="bn-count" role="status">
                    {/* the previous results stay on screen while a new search loads, but their count isn't this search's */}
                    {data && !isPlaceholderData
                        ? <><b>{plural(data.total, "teos", "teosta")}</b>{summary && <span> {summary}</span>}</>
                        : "Haetaan…"}
                </p>
                <div className="bn-tools">
                    <label>Järjestys
                        <select value={state.jarjestys} onChange={e => update({ jarjestys: e.target.value as IndexState["jarjestys"] })}>
                            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </label>
                    <label className="bn-check">
                        <input type="checkbox" checked={state.ryhmittely} onChange={e => update({ ryhmittely: e.target.checked })} />Ryhmittele tekijöittäin
                    </label>
                    <button type="button" className="bn-link" aria-expanded={state.tilastot} aria-controls="bn-stats"
                        onClick={() => update({ tilastot: !state.tilastot })}>
                        {state.tilastot ? "Piilota tilastot" : "Tilastot tästä hausta"}
                    </button>
                </div>
            </div>

            {state.tilastot && <BookIndexStats query={withExtra(statsQuery(state), extra)} />}

            {isError ? (
                <div className="bn-err" role="alert">Kirjoja ei saatu haettua.<button type="button" onClick={() => refetch()}>Yritä uudelleen</button></div>
            ) : data && data.total === 0 ? (
                <p className="bn-empty">{empty} {clear && <button type="button" className="bn-link" onClick={clear}>Tyhjennä rajaukset</button>}</p>
            ) : (
                groups.map(g => (
                    <Fragment key={g.key}>
                        {state.ryhmittely && (
                            <h2 className="bn-group">{g.id ? <Link to={`/people/${g.id}`}>{g.name}</Link> : g.name}<small>{g.rows.length}</small></h2>
                        )}
                        <ul className="bn-rows">{g.rows.map(w => <WorkRow key={w.id} w={w} showAuthor={!state.ryhmittely} note={note?.(w)} />)}</ul>
                    </Fragment>
                ))
            )}

            {data && data.total > 0 && (
                <nav className="bn-paging" aria-label="Sivut">
                    <span>Näytetään {n(first)}–{n(last)} / {n(data.total)}</span>
                    <span className="bn-pages">
                        <button type="button" disabled={state.sivu <= 1} onClick={() => goTo(state.sivu - 1)}>‹ Edellinen</button>
                        <span>Sivu {n(state.sivu)} / {n(pages)}</span>
                        <button type="button" disabled={state.sivu >= pages} onClick={() => goTo(state.sivu + 1)}>Seuraava ›</button>
                    </span>
                    <label>Rivejä
                        <select value={state.riveja} onChange={e => update({ riveja: Number(e.target.value), sivu: 1 })}>
                            {ROWS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </label>
                </nav>
            )}
        </section>
    );
};
