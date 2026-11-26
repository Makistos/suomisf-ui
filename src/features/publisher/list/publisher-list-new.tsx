import "./publisher-list-new.css";

import { FormEvent, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { getApiContent } from "@services/user-service";
import { getCurrenUser } from "@services/auth-service";
import {
    DEFAULT_DIRECTION, filterPublishers, ListRow, ListState, parseListState, Sort, sortPublishers, withListState, YearRange, yearAxis,
} from "./publisher-list-state";

interface IndexResponse { total: number; publishers: ListRow[] }

const n = (v: number) => v.toLocaleString("fi-FI").replace(/\s/g, " ");
const years = (r: ListRow) => (r.first_year === r.last_year ? String(r.first_year) : `${r.first_year}–${r.last_year}`);
const plural = (v: number, one: string, many: string) => `${n(v)} ${v === 1 ? one : many}`;

const COLUMNS: { sort: Sort; label: string; className: string }[] = [
    { sort: "nimi", label: "Nimi", className: "pl-name" },
    { sort: "painoksia", label: "Painoksia", className: "pl-n" },
    { sort: "vuodet", label: "Vuodet", className: "pl-y" },
];

const SORT_OPTIONS = [
    { value: "nimi:nouseva", label: "Nimi A–Ö" }, { value: "nimi:laskeva", label: "Nimi Ö–A" },
    { value: "painoksia:laskeva", label: "Eniten painoksia" }, { value: "painoksia:nouseva", label: "Vähiten painoksia" },
    { value: "vuodet:nouseva", label: "Vanhimmat ensin" }, { value: "vuodet:laskeva", label: "Uusimmat ensin" },
];

/** A publisher without editions: what it publishes instead, or that nothing is catalogued (publishers.md). */
const NoEditions = ({ r }: { r: ListRow }) => (
    r.magazines.length > 0 ? (
        <>ei kirjoja; julkaisee {r.magazines.length === 1 ? "lehteä" : "lehtiä"}{" "}
            {r.magazines.map((m, i) => (
                <span key={m.id}>{i > 0 && ", "}<Link to={`/magazines/${m.id}`}>{m.name}</Link> ({plural(m.issues, "numero", "numeroa")})</span>
            ))}
        </>
    ) : <>ei luetteloituja painoksia</>
);

/** The publisher list in the identity style, under trial for admins (publishers.md, list page). */
export const PublisherListNew = () => {
    const [params, setParams] = useSearchParams();
    const state = parseListState(params);
    const update = (changes: Partial<ListState>, replace = false) =>
        setParams(withListState(new URLSearchParams(window.location.search), changes), { replace });

    const { data, isError, refetch } = useQuery<IndexResponse>({
        queryKey: ["publisherindex"],
        queryFn: async () => (await getApiContent("publisherindex", getCurrenUser())).data,
    });
    useEffect(() => { document.title = "Kustantajat"; }, []);

    const all = data?.publishers ?? [];
    const rows = sortPublishers(filterPublishers(all, state), state);
    const zero = all.filter(r => r.editions === 0).length;
    const biggest = [...all].sort((a, b) => b.editions - a.editions).slice(0, 5);
    const axis = yearAxis(all);
    const filtered = !!state.nimi || !!state.toiminut || state.piilota;

    const submitYears = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const year = (k: string) => { const v = String(f.get(k) ?? "").trim(); return /^\d{1,4}$/.test(v) ? Number(v) : null; };
        const r: YearRange = { from: year("from"), to: year("to") };
        update({ toiminut: r.from === null && r.to === null ? null : r });
    };
    const sortBy = (sort: Sort) => update({
        jarjestys: sort,
        suunta: state.jarjestys === sort ? (state.suunta === "nouseva" ? "laskeva" : "nouseva") : DEFAULT_DIRECTION[sort],
    });
    const bar = (r: ListRow) => {
        if (!axis || r.first_year === null || r.last_year === null) return null;
        const span = Math.max(1, axis.to - axis.from);
        return { left: `${((r.first_year - axis.from) / span) * 100}%`, width: `${Math.max(0.8, ((r.last_year - r.first_year) / span) * 100)}%` };
    };

    return (
        <main className="pl" data-publishers-page="uusi">
            <header className="pl-head">
                <h1>Kustantajat</h1>
                <p>
                    {data ? <>{plural(data.total, "kustantaja", "kustantajaa")}. Suurimmat:{" "}
                        {biggest.map((p, i) => <span key={p.id}>{i > 0 && ", "}<Link to={`/publishers/${p.id}`}>{p.name}</Link> ({n(p.editions)})</span>)}.</>
                        : "Kaikki bibliografian kustantajat."}
                </p>
            </header>

            <div className="pl-filters" role="search" aria-label="Rajaa kustantajia">
                <label className="pl-search">Nimi
                    {/* filters as it is typed, straight from the URL, without a history entry for every letter */}
                    <input type="search" value={params.get("nimi") ?? ""} autoComplete="off" placeholder="Hae kustantajan nimellä"
                        onChange={e => update({ nimi: e.target.value }, true)} />
                </label>
                {/* key: the year fields follow the URL (back, Tyhjennä) */}
                <form className="pl-range" role="group" aria-label="Toiminut" onSubmit={submitYears}
                    key={JSON.stringify(state.toiminut)}>
                    <span className="pl-flabel" aria-hidden="true">Toiminut</span>
                    <span className="pl-range-in">
                        <input name="from" inputMode="numeric" pattern="\d{1,4}" maxLength={4} defaultValue={state.toiminut?.from ?? ""}
                            aria-label="Toiminut, vuodesta" placeholder="vuodesta" />
                        <span aria-hidden="true">–</span>
                        <input name="to" inputMode="numeric" pattern="\d{1,4}" maxLength={4} defaultValue={state.toiminut?.to ?? ""}
                            aria-label="Toiminut, vuoteen" placeholder="vuoteen" />
                        <button type="submit" className="pl-go">Rajaa</button>
                    </span>
                </form>
                <label className="pl-check">
                    <input type="checkbox" checked={state.piilota} onChange={e => update({ piilota: e.target.checked })} />
                    Piilota ilman painoksia ({n(zero)})
                </label>
            </div>

            <section className="pl-results" aria-labelledby="pl-count">
                <div className="pl-rhead">
                    <p id="pl-count" role="status">
                        {data ? (filtered ? <><b>{n(rows.length)}</b> / {plural(all.length, "kustantaja", "kustantajaa")}</>
                            : <b>{plural(all.length, "kustantaja", "kustantajaa")}</b>) : "Haetaan…"}
                    </p>
                    <span className="pl-tools">
                        {filtered && <button type="button" className="pl-link" onClick={() => setParams(new URLSearchParams())}>Tyhjennä</button>}
                        {/* the column headers sort on a wide screen; the cards on a phone have no headers */}
                        <label className="pl-sort">Järjestys
                            <select value={`${state.jarjestys}:${state.suunta}`} onChange={e => {
                                const [jarjestys, suunta] = e.target.value.split(":") as [Sort, ListState["suunta"]];
                                update({ jarjestys, suunta });
                            }}>
                                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </label>
                    </span>
                </div>

                {isError ? (
                    <div className="pl-err" role="alert">Kustantajia ei saatu haettua.<button type="button" onClick={() => refetch()}>Yritä uudelleen</button></div>
                ) : data && rows.length === 0 ? (
                    <p className="pl-empty">Rajauksilla ei löytynyt kustantajia. <button type="button" className="pl-link" onClick={() => setParams(new URLSearchParams())}>Tyhjennä rajaukset</button></p>
                ) : data && (
                    <table className="pl-table">
                        <thead>
                            <tr>
                                {COLUMNS.map(c => (
                                    <th key={c.sort} className={c.className}
                                        aria-sort={state.jarjestys === c.sort ? (state.suunta === "nouseva" ? "ascending" : "descending") : "none"}>
                                        <button type="button" onClick={() => sortBy(c.sort)}>
                                            {c.label}
                                            <i className={`pi ${state.jarjestys !== c.sort ? "pi-sort-alt" : state.suunta === "nouseva" ? "pi-sort-amount-up-alt" : "pi-sort-amount-down"}`} aria-hidden="true" />
                                        </button>
                                    </th>
                                ))}
                                <th className="pl-bar" aria-hidden="true">{axis && <span><span>{axis.from}</span><span>{axis.to}</span></span>}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map(r => {
                                const b = bar(r);
                                return (
                                    <tr key={r.id}>
                                        <td className="pl-name">
                                            <Link to={`/publishers/${r.id}`}>{r.name}</Link>
                                            {r.fullname && r.fullname.toLocaleLowerCase("fi") !== r.name.toLocaleLowerCase("fi") && <small>{r.fullname}</small>}
                                        </td>
                                        {r.editions > 0 ? (
                                            <>
                                                <td className="pl-n">{n(r.editions)}<span className="pl-unit"> {r.editions === 1 ? "painos" : "painosta"}</span></td>
                                                <td className="pl-y" data-l="Vuodet">{years(r)}</td>
                                                <td className="pl-bar" aria-hidden="true">{b && <span className="pl-track"><i style={b} /></span>}</td>
                                            </>
                                        ) : <td className="pl-zero" colSpan={3}><NoEditions r={r} /></td>}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </section>
        </main>
    );
};
