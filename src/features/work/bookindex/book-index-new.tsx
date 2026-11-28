import "./book-index-new.css";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { getApiContent } from "@services/user-service";
import { getCurrenUser } from "@services/auth-service";
import type { Genre } from "@features/genre";
import { getGenreColors } from "@features/genre/utils/genre-colors";
import type { Country } from "../../../types/country";
import {
    apiQuery, hasFilters, IndexKind, IndexState, LETTERS, parseIndexState, TypeSlug, withIndexState, WORK_TYPES, YearRange,
} from "./bookindex-state";
import { BookResults } from "./book-results";
import type { IndexPage } from "./work-row";

const fetchJson = async <T,>(url: string): Promise<T> => (await getApiContent(url, getCurrenUser())).data;
const n = (v: number) => v.toLocaleString("fi-FI").replace(/\s/g, " ");
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
    const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter(x => x !== v) : [...list, v]);
    const filtered = hasFilters(state, kind);
    // Tyhjennä clears the filters; whether the statistics are open stays.
    const clear = () => setParams(state.tilastot ? new URLSearchParams("tilastot=1") : new URLSearchParams());

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

            <BookResults state={state} update={update} summary={filtered ? summary(state, genres, countries, kind) : ""}
                clear={filtered ? clear : undefined} empty="Haulla ei löytynyt kirjoja." />
        </main>
    );
};
