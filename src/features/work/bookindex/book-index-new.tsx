import "./book-index-new.css";

import { FormEvent, Fragment, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { getApiContent } from "@services/user-service";
import { getCurrenUser } from "@services/auth-service";
import type { Genre } from "@features/genre";
import { getGenreColors } from "@features/genre/utils/genre-colors";
import type { Country } from "../../../types/country";
import {
    apiQuery, groupByAuthor, hasFilters, IndexKind, IndexState, LETTERS, parseIndexState, printingLabel, printingLines, ROWS, SORTS, statsQuery, TypeSlug,
    withIndexState, WORK_TYPES, YearRange,
} from "./bookindex-state";
import { BookIndexStats } from "./book-index-stats";

type PersonBrief = { id: number; name: string; alt_name: string | null };
type Named = { id: number; name: string };
interface IndexEdition {
    id: number; title: string; pubyear: number | null; editionnum: number | null; version: number | null;
    translators: PersonBrief[]; publisher: Named | null; pubseries: Named | null; owned: boolean; wishlisted: boolean;
}
interface IndexRow {
    id: number;
    title: string;
    subtitle: string | null;
    orig_title: string | null;
    pubyear: number | null;
    author_str: string | null;
    type: number;
    authors: PersonBrief[];
    real_authors: PersonBrief[];
    bookseries: { id: number; name: string; partof: { id: number; name: string } | null } | null;
    bookseriesnum: string | null;
    genres: { id: number; abbr: string; name: string }[];
    editions: IndexEdition[];
}
interface IndexPage { total: number; page: number; rows: number; works: IndexRow[] }

const fetchJson = async <T,>(url: string): Promise<T> => (await getApiContent(url, getCurrenUser())).data;
const n = (v: number) => v.toLocaleString("fi-FI").replace(/\s/g, " ");
const plural = (v: number, one: string, many: string) => `${n(v)} ${v === 1 ? one : many}`;
const personName = (p: PersonBrief) =>
    p.alt_name || (p.name.includes(", ") ? p.name.split(", ").reverse().join(" ") : p.name);
/** "Le Guin, Ursula K. & Halme, Jukka (toim.)" → "Ursula K. Le Guin & Jukka Halme (toim.)" */
const naturalAuthors = (s: string | null) => {
    if (!s) return "";
    const editor = /\s*\(toim\.\)$/.test(s);
    return s.replace(/\s*\(toim\.\)$/, "").split(" & ").map(p => (p.includes(", ") ? p.split(", ").reverse().join(" ") : p)).join(" & ")
        + (editor ? " (toim.)" : "");
};

/** What was searched, in words: 'tekijä "Le Guin", romaani, 1960–1969'. */
const summary = (s: IndexState, genres: Genre[], countries: Country[], kind: IndexKind) => {
    const range = (r: YearRange | null, label: string) =>
        r ? `${label} ${r.from ?? ""}–${r.to ?? ""}` : null;
    return [
        s.tekija && `tekijä "${s.tekija}"`, s.nimi && `nimi "${s.nimi}"`, s.alkunimi && `alkuperäinen nimi "${s.alkunimi}"`,
        range(s.alkuteos, "alkuteos"), range(s.painettu, "painettu"),
        s.kansallisuus !== null && (countries.find(c => c.id === s.kansallisuus)?.name ?? null),
        ...(kind === "tietokirjat" ? [] : s.tyyppi.map(t => WORK_TYPES[t].label.toLowerCase())),
        ...s.genre.map(a => genres.find(g => g.abbr === a)?.name ?? a),
        s.kirjain && `tekijä alkaa ${s.kirjain}`,
    ].filter(Boolean).join(", ");
};

const RangeFields = ({ label, name, value }: { label: string; name: string; value: YearRange | null }) => (
    <div className="bn-range" role="group" aria-label={label}>
        <span className="bn-flabel" aria-hidden="true">{label}</span>
        <span className="bn-range-in">
            <input name={`${name}-from`} inputMode="numeric" pattern="\d{1,4}" maxLength={4} defaultValue={value?.from ?? ""} aria-label={`${label}, vuodesta`} placeholder="vuodesta" />
            <span aria-hidden="true">–</span>
            <input name={`${name}-to`} inputMode="numeric" pattern="\d{1,4}" maxLength={4} defaultValue={value?.to ?? ""} aria-label={`${label}, vuoteen`} placeholder="vuoteen" />
        </span>
    </div>
);

const People = ({ people, sep = " & " }: { people: PersonBrief[]; sep?: string }) => (
    <>{people.map((p, i) => <Fragment key={p.id}>{i > 0 && sep}<Link to={`/people/${p.id}`}>{personName(p)}</Link></Fragment>)}</>
);
const Mark = ({ e }: { e: IndexEdition }) => (
    e.owned ? <i className="pi pi-star-fill bn-mark" role="img" aria-label="Omistat tämän painoksen" title="Omistat tämän painoksen" />
        : e.wishlisted ? <i className="pi pi-bookmark-fill bn-mark bn-wish" role="img" aria-label="Muistilistallasi" title="Muistilistallasi" />
            : null
);
/** "Suom. Jarkko Laine. Otava 1977. Keskiyön kirjasto." */
const Publication = ({ e, translators }: { e: IndexEdition; translators: boolean }) => (
    <span className="bn-pub">
        {translators && e.translators.length > 0 && <>Suom. <People people={e.translators} sep=", " />. </>}
        {e.publisher && <><Link to={`/publishers/${e.publisher.id}`}>{e.publisher.name}</Link> </>}
        {e.pubyear ?? "?"}.
        {e.pubseries && <> <Link to={`/pubseries/${e.pubseries.id}`}>{e.pubseries.name}</Link>.</>}
    </span>
);

/**
 * One work as on the old list (owner, 2026-11-26): the title with the original's name and year; series and the first printing;
 * then every other printing on its own line with its title when it differs from the work's, translators when they change,
 * publisher, year and series. A reprint that differs only by number and year is left out (printingLines).
 */
const Row = ({ w, showAuthor }: { w: IndexRow; showAuthor: boolean }) => {
    const [firstLine, ...rest] = printingLines(w.editions);
    const first = firstLine?.edition;
    const foreign = !!w.orig_title && w.orig_title !== w.title;
    return (
        <li className="bn-row">
            <div className="bn-row-main">
                <p className="bn-tline">
                    {showAuthor && (
                        <><span className="bn-a">{w.authors.length > 0 && !/\(toim\.\)/.test(w.author_str ?? "") ? <People people={w.authors} /> : naturalAuthors(w.author_str)}</span>: </>
                    )}
                    <Link className="bn-t" to={`/works/${w.id}`}>{w.title}</Link>
                    {w.subtitle && <span className="bn-sub"> {w.subtitle}</span>}
                    {(foreign || w.pubyear) && (
                        <span className="bn-orig"> ({foreign && <i>{w.orig_title}</i>}{foreign && w.pubyear && ", "}{w.pubyear && <span className="bn-y">{w.pubyear}</span>})</span>
                    )}
                </p>
                <p className="bn-s bn-first">
                    {first && <Mark e={first} />}
                    {w.bookseries && (
                        <span className="bn-ser">
                            {w.bookseries.partof && <><Link to={`/bookseries/${w.bookseries.partof.id}`}>{w.bookseries.partof.name}</Link> › </>}
                            <Link to={`/bookseries/${w.bookseries.id}`}>{w.bookseries.name}</Link>{w.bookseriesnum ? ` ${w.bookseriesnum}` : ""}.{" "}
                        </span>
                    )}
                    {w.real_authors.length > 1 && <span>Kirjoittanut <People people={w.real_authors} />. </span>}
                    {first && first.title !== w.title && <b className="bn-etitle">{first.title}. </b>}
                    {first && <Publication e={first} translators />}
                </p>
                {rest.map(({ edition: e, showTranslators }) => (
                    <p className="bn-s bn-ed" key={e.id}>
                        <Mark e={e} />
                        <span className="bn-ed-l">{printingLabel(e)}:</span>{" "}
                        {e.title !== w.title && <b className="bn-etitle">{e.title}. </b>}
                        <Publication e={e} translators={showTranslators} />
                    </p>
                ))}
            </div>
            <span className="bn-genres">{w.genres.map(g => (
                <span className="bn-gdot" key={g.abbr}><i style={{ background: getGenreColors([g.abbr])[0] ?? "#6C757D" }} />{g.name}</span>
            ))}</span>
        </li>
    );
};

const TEXTS: Record<IndexKind, { title: string; all: (total: string) => string; rest: string; search: string }> = {
    kirjat: {
        title: "Kirjat", all: t => `Kaikki bibliografian ${t} teosta.`, search: "Rajaa kirjoja",
        rest: "Rajaa hakua alla; ilman rajauksia näet kaikki teokset tekijän mukaan.",
    },
    tietokirjat: {
        title: "Tietokirjat", all: t => `Kaikki bibliografian ${t} tietokirjaa.`, search: "Rajaa tietokirjoja",
        rest: "Rajaa hakua alla; ilman rajauksia näet kaikki tietokirjat tekijän mukaan.",
    },
};

/**
 * The book index in the identity style, under trial for admins (book-index.md). /nonfiction is the same page with the type
 * fixed to Tietokirja (kind "tietokirjat"; decided: its own page, with the new rows and paging).
 */
export const BookIndexNew = ({ kind = "kirjat" }: { kind?: IndexKind }) => {
    const [params, setParams] = useSearchParams();
    const state = parseIndexState(params, kind);
    const texts = TEXTS[kind];
    const [more, setMore] = useState(false);
    const update = (changes: Partial<IndexState>) => setParams(withIndexState(new URLSearchParams(window.location.search), changes));

    const { data: genres = [] } = useQuery<Genre[]>({ queryKey: ["genres"], queryFn: () => fetchJson("genres"), staleTime: Infinity });
    const { data: countries = [] } = useQuery<Country[]>({ queryKey: ["nationalities"], queryFn: () => fetchJson("countries"), staleTime: Infinity });
    const query = apiQuery(state);
    const { data, isError, isFetching, isPlaceholderData, refetch } = useQuery<IndexPage>({
        queryKey: ["bookindex", query],
        queryFn: () => fetchJson(`bookindex?${query}`),
        placeholderData: keepPreviousData,
    });
    // The whole bibliography's size for the header, from the unfiltered first page.
    const allQuery = apiQuery(parseIndexState(new URLSearchParams(), kind));
    const { data: all } = useQuery<IndexPage>({
        queryKey: ["bookindex", allQuery],
        queryFn: () => fetchJson(`bookindex?${allQuery}`),
        staleTime: 10 * 60 * 1000,
    });

    useEffect(() => { document.title = texts.title; }, [texts.title]);

    // Text fields and years search on Enter or "Hae"; chips, selects and letters update at once (decided).
    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const text = (k: string) => String(f.get(k) ?? "").trim();
        const year = (k: string) => (/^\d{1,4}$/.test(text(k)) ? Number(text(k)) : null);
        const range = (k: string): YearRange | null => {
            const r = { from: year(`${k}-from`), to: year(`${k}-to`) };
            return r.from === null && r.to === null ? null : r;
        };
        update({ tekija: text("tekija"), nimi: text("nimi"), alkunimi: text("alkunimi"), alkuteos: range("alkuteos"), painettu: range("painettu") });
    };
    const goTo = (sivu: number) => {
        update({ sivu });
        document.getElementById("bn-count")?.scrollIntoView({ block: "start" });
    };
    const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter(x => x !== v) : [...list, v]);
    const filtered = hasFilters(state, kind);
    // Tyhjennä clears the filters; whether the statistics are open stays.
    const clear = () => setParams(state.tilastot ? new URLSearchParams("tilastot=1") : new URLSearchParams());
    const works = data?.works ?? [];
    const first = data && data.total > 0 ? (data.page - 1) * data.rows + 1 : 0;
    const last = data ? Math.min(data.total, data.page * data.rows) : 0;
    const pages = data ? Math.max(1, Math.ceil(data.total / data.rows)) : 1;
    const groups = state.ryhmittely
        ? groupByAuthor(works)
        : [{ key: "all", name: "", rows: works }];

    return (
        <main className="bn" data-bookindex-page="uusi" data-kind={kind}>
            <header className="bn-head">
                <h1>{texts.title}</h1>
                <p>{all ? texts.all(n(all.total)) : `Kaikki bibliografian ${texts.title.toLowerCase()}.`} {texts.rest}</p>
            </header>

            {/* key: when the text fields' values change in the URL (back, Tyhjennä) the uncontrolled fields follow;
                chips and letters don't reset what is being typed */}
            <form className={`bn-filters${more ? " bn-more" : ""}`} role="search" aria-label={texts.search} onSubmit={submit}
                key={[state.tekija, state.nimi, state.alkunimi, JSON.stringify(state.alkuteos), JSON.stringify(state.painettu)].join("|")}>
                <div className="bn-fields">
                    <label>Tekijä<input name="tekija" defaultValue={state.tekija} autoComplete="off" /></label>
                    <label>Nimi<input name="nimi" defaultValue={state.nimi} autoComplete="off" /></label>
                    <label className="bn-extra">Alkuperäinen nimi<input name="alkunimi" defaultValue={state.alkunimi} autoComplete="off" /></label>
                    <div className="bn-extra"><RangeFields label="Alkuteos julkaistu" name="alkuteos" value={state.alkuteos} /></div>
                    <div className="bn-extra"><RangeFields label="Painettu" name="painettu" value={state.painettu} /></div>
                    <label className="bn-extra">Kansallisuus
                        <select value={state.kansallisuus ?? ""} onChange={e => update({ kansallisuus: e.target.value ? Number(e.target.value) : null })}>
                            <option value="">Kaikki</option>
                            {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </label>
                </div>
                <button type="button" className="bn-more-btn" aria-expanded={more} onClick={() => setMore(m => !m)}>
                    <i className={`pi pi-chevron-${more ? "up" : "down"}`} aria-hidden="true" />{more ? "Vähemmän rajauksia" : "Lisää rajauksia"}
                </button>
                {kind === "kirjat" && (
                    <div className="bn-chiprow bn-extra" role="group" aria-label="Tyyppi">
                        <span className="bn-chiplabel">Tyyppi</span>
                        <span className="bn-chips">{(Object.keys(WORK_TYPES) as TypeSlug[]).map(t => (
                            <button key={t} type="button" className="bn-chip" aria-pressed={state.tyyppi.includes(t)}
                                onClick={() => update({ tyyppi: toggle(state.tyyppi, t) })}>{WORK_TYPES[t].label}</button>
                        ))}</span>
                    </div>
                )}
                <div className="bn-chiprow bn-extra" role="group" aria-label="Genre">
                    <span className="bn-chiplabel">Genre</span>
                    <span className="bn-chips">{genres.map(g => (
                        <button key={g.abbr} type="button" className="bn-chip" aria-pressed={state.genre.includes(g.abbr)}
                            onClick={() => update({ genre: toggle(state.genre, g.abbr) })}>
                            <i style={{ background: getGenreColors([g.abbr])[0] ?? "#6C757D" }} aria-hidden="true" />{g.name}
                        </button>
                    ))}</span>
                </div>
                <div className="bn-letters" role="group" aria-label="Tekijän sukunimi alkaa">
                    <span className="bn-chiplabel">Tekijä alkaa</span>
                    <span className="bn-chips">
                        <button type="button" aria-pressed={state.kirjain === null} onClick={() => update({ kirjain: null })}>Kaikki</button>
                        {LETTERS.map(l => (
                            <button key={l} type="button" aria-pressed={state.kirjain === l} onClick={() => update({ kirjain: l })}>{l}</button>
                        ))}
                    </span>
                </div>
                <div className="bn-actions">
                    {filtered && <button type="button" className="bn-link" onClick={clear}>Tyhjennä</button>}
                    <button type="submit" className="bn-go">Hae</button>
                </div>
            </form>

            <section className="bn-results" aria-labelledby="bn-count" aria-busy={isFetching}>
                <div className="bn-rhead">
                    <p id="bn-count" role="status">
                        {/* the previous results stay on screen while a new search loads, but their count isn't this search's */}
                        {data && !isPlaceholderData
                            ? <><b>{plural(data.total, "teos", "teosta")}</b>{filtered && <span> {summary(state, genres, countries, kind)}</span>}</>
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

                {state.tilastot && <BookIndexStats query={statsQuery(state)} />}

                {isError ? (
                    <div className="bn-err" role="alert">Kirjoja ei saatu haettua.<button type="button" onClick={() => refetch()}>Yritä uudelleen</button></div>
                ) : data && data.total === 0 ? (
                    <p className="bn-empty">Haulla ei löytynyt kirjoja. {filtered && <button type="button" className="bn-link" onClick={clear}>Tyhjennä rajaukset</button>}</p>
                ) : (
                    groups.map(g => (
                        <Fragment key={g.key}>
                            {state.ryhmittely && (
                                <h2 className="bn-group">{g.id ? <Link to={`/people/${g.id}`}>{g.name}</Link> : g.name}<small>{g.rows.length}</small></h2>
                            )}
                            <ul className="bn-rows">{g.rows.map(w => <Row key={w.id} w={w} showAuthor={!state.ryhmittely} />)}</ul>
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
        </main>
    );
};
