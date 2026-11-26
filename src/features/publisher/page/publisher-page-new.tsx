import "./publisher-page-new.css";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { SpeedDial } from "primereact/speeddial";
import { Tooltip } from "primereact/tooltip";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";

import { getCurrenUser } from "@services/auth-service";
import { deleteApiContent, getApiContent } from "@services/user-service";
import { isAdmin } from "@features/user";
import { useGlobalToast } from "@components/global-toast";
import { LoadError } from "@components/load-error";
import { safeHtml } from "@utils/safe-html";
import { EditionRows } from "@features/edition/rows/edition-rows";
import type { EditionRow } from "@features/edition/rows/edition-rows-utils";
import { PublisherForm } from "../components/publisher-form";
import type { Publisher } from "../types";
import {
    apiQuery, ORDERS, Order, PageState, parsePageState, ROWS, SERIES_DIRECTION, SeriesRow, SeriesSort, sortSeries, Tab, withPageState, YearRange,
} from "./publisher-page-state";

interface Summary {
    id: number; name: string; fullname: string; description: string | null;
    links: { link: string; description: string | null }[];
    editions: number; works: number; first_year: number | null; last_year: number | null;
    series: SeriesRow[];
    magazines: { id: number; name: string; type: string | null; issues: number; first_year: number | null; last_year: number | null }[];
}
interface EditionsPage { total: number; page: number; rows: number; editions: EditionRow[] }

const fetchJson = async <T,>(url: string): Promise<T> => (await getApiContent(url, getCurrenUser())).data;
const n = (v: number) => v.toLocaleString("fi-FI").replace(/\s/g, " ");
const plural = (v: number, one: string, many: string) => `${n(v)} ${v === 1 ? one : many}`;
const span = (first: number | null, last: number | null) => (first === null ? "" : first === last ? String(first) : `${first}–${last}`);

/** "2 260 painosta (1 320 teosta) vuosina 1889–2026, 59 kustantajan sarjaa, 1 lehti." */
const factsLine = (s: Summary) => {
    const parts = [
        s.editions === 0 ? "Ei luetteloituja painoksia"
            : `${plural(s.editions, "painos", "painosta")} (${plural(s.works, "teos", "teosta")}) ${s.first_year === s.last_year ? "vuonna" : "vuosina"} ${span(s.first_year, s.last_year)}`,
        s.series.length > 0 && plural(s.series.length, "kustantajan sarja", "kustantajan sarjaa"),
        s.magazines.length > 0 && plural(s.magazines.length, "lehti", "lehteä"),
    ].filter(Boolean);
    return `${parts.join(", ")}.`;
};

const SERIES_COLUMNS: { sort: SeriesSort; label: string; className: string }[] = [
    { sort: "nimi", label: "Sarja", className: "pp-name" },
    { sort: "painoksia", label: "Painoksia", className: "pp-n" },
    { sort: "vuodet", label: "Vuodet", className: "pp-y" },
];

/** The publisher page in the identity style, under trial for admins (publishers.md): its printings, series and magazines. */
export const PublisherPageNew = () => {
    const { itemId } = useParams();
    const id = String(itemId ?? "");
    const [params, setParams] = useSearchParams();
    const state = parsePageState(params);
    const update = (changes: Partial<PageState>) => setParams(withPageState(new URLSearchParams(window.location.search), changes));
    const user = getCurrenUser();
    const admin = isAdmin(user);
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const showGlobalToast = useGlobalToast();
    const toast = useRef<Toast>(null);
    const [editing, setEditing] = useState(false);

    const summary = useQuery<Summary>({ queryKey: ["publisher-summary", id], queryFn: () => fetchJson(`publishers/${id}/summary`) });
    // The printings show on their own tab, and when the address names a tab the publisher has no rows for.
    const sd = summary.data;
    const showsEditions = state.valilehti === "painokset" || (!!sd
        && ((state.valilehti === "sarjat" && sd.series.length === 0) || (state.valilehti === "lehdet" && sd.magazines.length === 0)));
    const query = apiQuery(state);
    const editions = useQuery<EditionsPage>({
        queryKey: ["publisher-editions", id, query],
        queryFn: () => fetchJson(`publishers/${id}/editions?${query}`),
        placeholderData: keepPreviousData,
        enabled: showsEditions,
    });
    useEffect(() => { if (summary.data) document.title = summary.data.name; }, [summary.data]);

    if (summary.isError) {
        return <LoadError error={summary.error} notFoundTitle="Kustantajaa ei löytynyt" onRetry={() => summary.refetch()} />;
    }
    const s = summary.data;
    const tabs: { tab: Tab; label: string; count: number }[] = s ? [
        { tab: "painokset" as Tab, label: "Painokset", count: s.editions },
        ...(s.series.length > 0 ? [{ tab: "sarjat" as Tab, label: "Sarjat", count: s.series.length }] : []),
        ...(s.magazines.length > 0 ? [{ tab: "lehdet" as Tab, label: "Lehdet", count: s.magazines.length }] : []),
    ] : [];
    // An address with a tab the publisher has no rows for opens the printings.
    const tab = tabs.some(t => t.tab === state.valilehti) ? state.valilehti : "painokset";

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const text = (k: string) => String(f.get(k) ?? "").trim();
        const year = (k: string) => (/^\d{1,4}$/.test(text(k)) ? Number(text(k)) : null);
        const range: YearRange = { from: year("from"), to: year("to") };
        update({ haku: text("haku"), vuodet: range.from === null && range.to === null ? null : range });
    };
    const page = editions.data;
    const pages = page ? Math.max(1, Math.ceil(page.total / page.rows)) : 1;
    const filtered = !!state.haku || !!state.vuodet;
    const goTo = (sivu: number) => {
        update({ sivu });
        document.getElementById("pp-count")?.scrollIntoView({ block: "start" });
    };
    const sortSeriesBy = (sort: SeriesSort) => update({
        sarjat: sort,
        suunta: state.sarjat === sort ? (state.suunta === "nouseva" ? "laskeva" : "nouseva") : SERIES_DIRECTION[sort],
    });

    const dial = [
        { label: "Muokkaa", icon: "fa-solid fa-pen-to-square", command: () => setEditing(true) },
        {
            label: "Poista", icon: "fa-solid fa-trash",
            // The database refuses the delete while editions, magazines or publisher's series refer to the publisher.
            disabled: !s || s.editions > 0 || s.magazines.length > 0 || s.series.length > 0,
            command: () => confirmDialog({
                message: "Haluatko varmasti poistaa kustantajan?", header: "Varmistus", icon: "pi pi-exclamation-triangle",
                acceptClassName: "p-button-danger",
                accept: () => deleteApiContent(`publishers/${id}`).then(r => {
                    if (r.status === 200) { showGlobalToast({ severity: "success", summary: "Kustantaja poistettu" }); navigate(-1); }
                    else toast.current?.show({ severity: "error", summary: "Kustantajan poisto ei onnistunut", detail: r.response });
                }),
            }),
        },
    ];

    return (
        <main className="pp" data-publisher-page="uusi">
            <Toast ref={toast} />
            {admin && (
                <>
                    <ConfirmDialog />
                    <Tooltip position="left" target=".fixed-dial .p-speeddial-action" />
                    <SpeedDial model={dial} direction="up" className="fixed-dial" showIcon="pi pi-plus" hideIcon="pi pi-times" buttonClassName="p-button-primary" />
                    <Dialog visible={editing} onHide={() => setEditing(false)} header="Kustantajan muokkaus" maximizable blockScroll className="w-full xl:w-6">
                        {editing && s && (
                            <PublisherForm publisher={s as unknown as Publisher} onSubmitCallback={() => {
                                setEditing(false);
                                queryClient.invalidateQueries({ queryKey: ["publisher-summary", id] });
                            }} />
                        )}
                    </Dialog>
                </>
            )}

            <nav className="pp-crumbs" aria-label="Murupolku"><Link to="/publishers">Kustantajat</Link> /</nav>
            <header className="pp-head">
                <h1>{s?.name ?? "Kustantaja"}</h1>
                {s && s.fullname && s.fullname.toLocaleLowerCase("fi") !== s.name.toLocaleLowerCase("fi") && <p className="pp-full">{s.fullname}</p>}
                <p className="pp-facts">{s ? factsLine(s) : "Haetaan…"}</p>
                {s?.description && <div className="pp-desc" dangerouslySetInnerHTML={safeHtml(s.description)} />}
                {s && s.links.length > 0 && (
                    <ul className="pp-links" aria-label="Linkit">
                        {s.links.map(l => <li key={l.link}><a href={l.link} target="_blank" rel="noopener noreferrer">{l.description || l.link}</a></li>)}
                    </ul>
                )}
            </header>

            {s && (
                <div className="pp-tabs" role="tablist" aria-label="Kustantajan tiedot">
                    {tabs.map(t => (
                        <button key={t.tab} type="button" role="tab" id={`pp-tab-${t.tab}`} aria-selected={tab === t.tab} aria-controls="pp-panel"
                            onClick={() => update({ valilehti: t.tab })}>
                            {t.label}<small>{n(t.count)}</small>
                        </button>
                    ))}
                </div>
            )}

            {s && (
                <section className="pp-panel" id="pp-panel" role="tabpanel" aria-labelledby={`pp-tab-${tab}`}>
                    {tab === "painokset" && (
                        <>
                            {s.editions > 0 && (
                                // key: the fields follow the URL (back, Tyhjennä)
                                <form className="pp-filters" role="search" aria-label="Rajaa painoksia" onSubmit={submit}
                                    key={[state.haku, JSON.stringify(state.vuodet)].join("|")}>
                                    <label className="pp-text">Tekijä tai nimi<input name="haku" type="search" defaultValue={state.haku} autoComplete="off" /></label>
                                    <div className="pp-range" role="group" aria-label="Vuodet">
                                        <span className="pp-flabel" aria-hidden="true">Vuodet</span>
                                        <span className="pp-range-in">
                                            <input name="from" inputMode="numeric" pattern="\d{1,4}" maxLength={4} defaultValue={state.vuodet?.from ?? ""} aria-label="Vuodet, vuodesta" placeholder="vuodesta" />
                                            <span aria-hidden="true">–</span>
                                            <input name="to" inputMode="numeric" pattern="\d{1,4}" maxLength={4} defaultValue={state.vuodet?.to ?? ""} aria-label="Vuodet, vuoteen" placeholder="vuoteen" />
                                        </span>
                                    </div>
                                    <button type="submit" className="pp-go">Hae</button>
                                    {filtered && <button type="button" className="pp-link" onClick={() => update({ haku: "", vuodet: null })}>Tyhjennä</button>}
                                </form>
                            )}
                            <div className="pp-rhead">
                                <p id="pp-count" role="status">
                                    {/* the previous page stays on screen while the next loads, but its count isn't this one's */}
                                    {page && !editions.isPlaceholderData
                                        ? (filtered ? <><b>{plural(page.total, "painos", "painosta")}</b> / {n(s.editions)}</> : <b>{plural(page.total, "painos", "painosta")}</b>)
                                        : s.editions === 0 ? "" : "Haetaan…"}
                                </p>
                                {s.editions > 0 && (
                                    <div className="pp-tools">
                                        <label>Järjestys
                                            <select value={state.jarjestys} onChange={e => update({ jarjestys: e.target.value as Order })}>
                                                {ORDERS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                            </select>
                                        </label>
                                        <button type="button" className="pp-toggle" aria-pressed={state.kannet} onClick={() => update({ kannet: !state.kannet })}>
                                            <i className="pi pi-images" aria-hidden="true" />Kannet
                                        </button>
                                    </div>
                                )}
                            </div>
                            {editions.isError ? (
                                <div className="pp-err" role="alert">Painoksia ei saatu haettua.<button type="button" onClick={() => editions.refetch()}>Yritä uudelleen</button></div>
                            ) : page && page.total === 0 ? (
                                <p className="pp-empty">
                                    {filtered ? <>Rajauksilla ei löytynyt painoksia. <button type="button" className="pp-link" onClick={() => update({ haku: "", vuodet: null })}>Tyhjennä rajaukset</button></>
                                        : "Kustantajalta ei ole luetteloitu painoksia."}
                                </p>
                            ) : page && (
                                <div aria-busy={editions.isFetching} className="pp-list">
                                    <EditionRows editions={page.editions} byYear={state.jarjestys === "vanhin" || state.jarjestys === "uusin"} covers={state.kannet} />
                                </div>
                            )}
                            {page && page.total > 0 && (
                                <nav className="pp-paging" aria-label="Sivut">
                                    <span>Näytetään {n((page.page - 1) * page.rows + 1)}–{n(Math.min(page.total, page.page * page.rows))} / {n(page.total)}</span>
                                    <span className="pp-pages">
                                        <button type="button" disabled={state.sivu <= 1} onClick={() => goTo(state.sivu - 1)}>‹ Edellinen</button>
                                        <span>Sivu {n(state.sivu)} / {n(pages)}</span>
                                        <button type="button" disabled={state.sivu >= pages} onClick={() => goTo(state.sivu + 1)}>Seuraava ›</button>
                                    </span>
                                    <label>Rivejä
                                        <select value={state.riveja} onChange={e => update({ riveja: Number(e.target.value) })}>
                                            {ROWS.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </label>
                                </nav>
                            )}
                        </>
                    )}

                    {tab === "sarjat" && (
                        <table className="pp-table" aria-label="Kustantajan sarjat">
                            <thead>
                                <tr>
                                    {SERIES_COLUMNS.map(c => (
                                        <th key={c.sort} className={c.className}
                                            aria-sort={state.sarjat === c.sort ? (state.suunta === "nouseva" ? "ascending" : "descending") : "none"}>
                                            <button type="button" onClick={() => sortSeriesBy(c.sort)}>
                                                {c.label}
                                                <i className={`pi ${state.sarjat !== c.sort ? "pi-sort-alt" : state.suunta === "nouseva" ? "pi-sort-amount-up-alt" : "pi-sort-amount-down"}`} aria-hidden="true" />
                                            </button>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sortSeries(s.series, state).map(x => (
                                    <tr key={x.id}>
                                        <td className="pp-name"><Link to={`/pubseries/${x.id}`}>{x.name}</Link></td>
                                        <td className="pp-n">{x.editions > 0 ? <>{n(x.editions)}<span className="pp-unit"> {x.editions === 1 ? "painos" : "painosta"}</span></> : <span className="pp-none">ei painoksia</span>}</td>
                                        <td className="pp-y">{span(x.first_year, x.last_year)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {tab === "lehdet" && (
                        <table className="pp-table" aria-label="Kustantajan lehdet">
                            <thead><tr><th className="pp-name">Lehti</th><th>Tyyppi</th><th className="pp-n">Numeroita</th><th className="pp-y">Vuodet</th></tr></thead>
                            <tbody>
                                {s.magazines.map(m => (
                                    <tr key={m.id}>
                                        <td className="pp-name"><Link to={`/magazines/${m.id}`}>{m.name}</Link></td>
                                        <td className="pp-type">{m.type ?? ""}</td>
                                        <td className="pp-n">{n(m.issues)}<span className="pp-unit"> {m.issues === 1 ? "numero" : "numeroa"}</span></td>
                                        <td className="pp-y">{span(m.first_year, m.last_year)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>
            )}
        </main>
    );
};
