import "./front-new.css";

import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "primereact/skeleton";

import { getApiContent } from "@services/user-service";
import { getCurrenUser } from "@services/auth-service";
import { isAdmin } from "@features/user";
import type { Edition } from "@features/edition";
import { getGenreColors } from "@features/genre/utils/genre-colors";
import { searchResultsPath } from "@features/search/utils/search-items";
import { thumbUrl } from "@utils/cover-url";
import type { ImageType } from "../../../types/image";
import { safeHtml } from "@utils/safe-html";
import { coverLine, FrontStats, holdings, naturalAuthors, shelfAuthors } from "../utils/front-facts";

const LATEST_COUNT = 8;
const EXAMPLES = ["Maameren velho", "Johanna Sinisalo", "Tähtivaeltaja"];
const WAYS_IN: [string, string, string][] = [
    ["/bookindex", "Kirjat", "Hae genren, vuoden, kustantajan ja kielen mukaan"],
    ["/shortstoryindex", "Novellit", "Novellit ja artikkelit kokoelmista, antologioista ja lehdistä"],
    ["/people", "Henkilöt", "Kirjailijat, suomentajat, toimittajat ja kansitaiteilijat"],
    ["/publishers", "Kustantajat", "Kustantajat ja niiden julkaisut"],
    ["/bookseries", "Kirjasarjat", "Tarinasarjat ja niiden lukujärjestys"],
    ["/pubseries", "Kustantajien sarjat", "Esimerkiksi Sci-fi-sarja ja Best Seller"],
    ["/magazines", "Lehdet", "Suomalaiset SF-fanzinet ja -lehdet numeroittain"],
    ["/awards", "Palkinnot", "Palkitut teokset, novellit ja henkilöt"],
    ["/tags", "Asiasanat", "Alalajit, aiheet, paikat ja hahmot"],
    ["/stats", "Tilastot", "Julkaisut vuosittain, genret, kustantajat ja kielet"],
];
const USER_GUIDE = "https://github.com/Makistos/suomisf-ui/wiki/SuomiSF%E2%80%90ohje";

// The menu search's "Vain nimet" setting, shared through localStorage (front-page.md).
const TITLES_KEY = "searchTitlesOnly";
const readTitlesOnly = () => {
    try { return localStorage.getItem(TITLES_KEY) !== "0"; } catch { return true; }
};

const Retry = ({ text, onRetry }: { text: string; onRetry: () => void }) => (
    <div className="fn-err" role="alert">{text}<button type="button" onClick={onRetry}>Yritä uudelleen</button></div>
);

// The long placeholder is cut off in a 390 px field, so phones get a short one (agreed).
const PHONE = "(max-width: 759px)";
const usePhone = () => {
    const [phone, setPhone] = useState(() => window.matchMedia?.(PHONE).matches ?? false);
    useEffect(() => {
        const query = window.matchMedia?.(PHONE);
        if (!query) return;
        const onChange = () => setPhone(query.matches);
        query.addEventListener("change", onChange);
        return () => query.removeEventListener("change", onChange);
    }, []);
    return phone;
};

const Search = () => {
    const navigate = useNavigate();
    const phone = usePhone();
    const [term, setTerm] = useState("");
    const [titlesOnly, setTitlesOnly] = useState(readTitlesOnly);
    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (term.trim()) navigate(searchResultsPath(term, titlesOnly));
    };
    return (
        <>
            <form className="fn-ask" role="search" aria-label="Hae bibliografiasta" onSubmit={submit}>
                <label>
                    <i className="pi pi-search" aria-hidden="true" />
                    <input type="search" value={term} onChange={e => setTerm(e.target.value)} aria-label="Hakusana"
                        placeholder={phone ? "Hae kirjaa tai henkilöä…" : "Hae kirjaa, novellia, henkilöä tai sarjaa…"} />
                </label>
                <button type="submit">Hae</button>
            </form>
            <div className="fn-opts">
                <label>
                    <input type="checkbox" checked={titlesOnly} onChange={e => {
                        setTitlesOnly(e.target.checked);
                        try { localStorage.setItem(TITLES_KEY, e.target.checked ? "1" : "0"); } catch { /* this view only */ }
                    }} />
                    Vain nimet
                </label>
                <span>Esimerkiksi {EXAMPLES.map((x, i) => (
                    <span key={x}>{i > 0 && (i === EXAMPLES.length - 1 ? " tai " : ", ")}<Link to={searchResultsPath(x, titlesOnly)}>{x}</Link></span>
                ))}</span>
            </div>
        </>
    );
};

const Holdings = () => {
    const { data, isError } = useQuery<FrontStats>({
        queryKey: ["frontpage", "stats"],
        queryFn: async () => (await getApiContent("frontpagedata", getCurrenUser())).data,
    });
    // A failed count request hides the sentence; the search still works (agreed).
    if (isError) return null;
    if (!data) return <Skeleton className="fn-holdings" width="100%" height="3.5rem" style={{ maxWidth: "30rem" }} />;
    const parts = holdings(data);
    return (
        <p className="fn-holdings">
            Bibliografiassa on {parts.map((p, i) => (
                <span key={p.to}>{i > 0 && (i === parts.length - 1 ? " ja " : ", ")}<Link to={p.to}>{p.text}</Link></span>
            ))}.
        </p>
    );
};

/** A cover, or a plain cloth binding when the book has none or its image fails to load. */
const Cover = ({ image, alt, lazy }: { image?: ImageType; alt: string; lazy?: boolean }) => {
    const [failed, setFailed] = useState<string | null>(null);
    const src = image ? thumbUrl(image) : null;
    // The title is always next to the cover, so the binding needs no text of its own.
    if (!src || failed === src) return <span className="fn-cloth" aria-hidden="true" />;
    return <img src={src} alt={alt} loading={lazy ? "lazy" : undefined} onError={() => setFailed(src)} />;
};

const firstCover = (e: Edition) => e.images?.find(i => i.image_src);

const CatalogueCard = () => {
    const admin = isAdmin(getCurrenUser());
    const [round, setRound] = useState(0);
    const [chosen, setChosen] = useState(0);
    // The set stays while the reader moves around the site; back returns to the same picks (agreed).
    const { data, isError, isFetching, refetch } = useQuery<Edition[]>({
        queryKey: ["frontpage", "random", round],
        queryFn: async () => (await getApiContent("frontpage/random", getCurrenUser())).data,
        staleTime: Infinity,
    });
    const picks = data ?? [];
    return (
        <aside aria-labelledby="fn-pick-h">
            <div className="fn-pick-head">
                <h2 id="fn-pick-h">Bibliografiasta löytyy</h2>
                {!isError && (
                    <button type="button" className="fn-link" disabled={isFetching} onClick={() => { setChosen(0); setRound(r => r + 1); }}>
                        <i className="pi pi-refresh" aria-hidden="true" />Arvo uudet
                    </button>
                )}
            </div>
            {isError ? <Retry text="Satunnaisia kirjoja ei saatu haettua." onRetry={() => refetch()} />
                : !data ? <Skeleton height="20rem" />
                    : (
                        <>
                            <div className="fn-card">
                                <div className="fn-feats" aria-live="polite">
                                    {picks.map((e, i) => {
                                        const w = e.work;
                                        return (
                                            <div key={e.id} className={`fn-feat${i === chosen ? " fn-on" : ""}`} aria-hidden={i !== chosen}>
                                                <Link to={`/editions/${e.id}`} tabIndex={i === chosen ? 0 : -1}>
                                                    <Cover image={firstCover(e)} alt={firstCover(e) ? `Kansikuva: ${w?.title ?? e.title}` : ""} />
                                                </Link>
                                                <div>
                                                    <h3><Link to={`/editions/${e.id}`} tabIndex={i === chosen ? 0 : -1}>{w?.title ?? e.title}</Link></h3>
                                                    <p className="fn-byl">{[naturalAuthors(w?.author_str), w?.pubyear].filter(Boolean).join(", ")}</p>
                                                    <dl className="fn-cfacts">
                                                        {(w?.genres?.length ?? 0) > 0 && (
                                                            <>
                                                                <dt>Genre</dt>
                                                                <dd>{w!.genres.map((g: { abbr: string; name: string }) => (
                                                                    <span className="fn-gdot" key={g.abbr}><i style={{ background: getGenreColors([g.abbr])[0] ?? "#6C757D" }} />{g.name}</span>
                                                                ))}</dd>
                                                            </>
                                                        )}
                                                        {firstCover(e) && <><dt>Kansikuva</dt><dd>{coverLine(e)}</dd></>}
                                                    </dl>
                                                </div>
                                                {w?.description && <div className="fn-desc" dangerouslySetInnerHTML={safeHtml(w.description)} />}
                                                {w?.descr_attr && <div className="fn-src">Kuvaus: <span dangerouslySetInnerHTML={safeHtml(w.descr_attr)} /></div>}
                                                {admin && (
                                                    <span className="fn-adm-note">
                                                        {w?.kirjasampo_imported
                                                            ? `Kirjasampo-asiasanat tuotu ${new Date(w.kirjasampo_imported).toLocaleDateString("fi-FI")}`
                                                            : "Kirjasampo-asiasanoja ei ole tuotu"}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            {picks.length > 1 && (
                                <div className="fn-thumbs" role="group" aria-label="Valitse kirja">
                                    {picks.map((e, i) => (
                                        <button key={e.id} type="button" aria-pressed={i === chosen} aria-label={`Näytä ${e.work?.title ?? e.title}`}
                                            title={e.work?.title ?? e.title} onClick={() => setChosen(i)}>
                                            <Cover image={firstCover(e)} alt="" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
        </aside>
    );
};

const Latest = () => {
    const { data, isError, refetch } = useQuery<Edition[]>({
        queryKey: ["frontpage", "latest", LATEST_COUNT],
        queryFn: async () => (await getApiContent(`frontpage/latest?count=${LATEST_COUNT}`, getCurrenUser())).data,
    });
    return (
        <section className="fn-band" aria-labelledby="fn-new-h">
            <div className="fn-band-head">
                <div>
                    <h2 id="fn-new-h">Viimeisimmät lisäykset</h2>
                    <p>Tietokantaan viimeksi lisätyt kirjat, uusin ensin.</p>
                </div>
                <Link to="/latest">Kaikki lisäykset</Link>
            </div>
            {isError ? <Retry text="Viimeisimpiä lisäyksiä ei saatu haettua." onRetry={() => refetch()} />
                : !data ? <Skeleton height="16rem" />
                    : (
                        <ul className="fn-shelf">
                            {data.map(e => {
                                return (
                                    <li key={e.id}>
                                        <Link className="fn-bk" to={`/editions/${e.id}`}>
                                            <span className="fn-cz"><Cover image={firstCover(e)} alt="" lazy /></span>
                                            <span className="fn-t">{e.work?.title ?? e.title}</span>
                                            <span className="fn-a">{shelfAuthors(e.work?.author_str)}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
        </section>
    );
};

/** The front page in the proposed identity, under trial for admins (front-identity.md). */
export const FrontPageNew = () => (
    <main className="fn" data-front-page="uusi">
        <div className="fn-hero">
            <div>
                <h1 className="fn-title">Suomenkielisen spekulatiivisen fiktion bibliografia</h1>
                <p className="fn-intro">
                    Kaikki suomenkielinen SF-kirjallisuus ja tiedot suomalaisista SF-fanzineista: kirjat, painokset, novellit, tekijät, kustantajat ja palkinnot.
                </p>
                <Search />
                <Holdings />
            </div>
            <CatalogueCard />
        </div>
        <Latest />
        <section className="fn-band" aria-labelledby="fn-browse-h">
            <div className="fn-band-head"><h2 id="fn-browse-h">Selaa</h2></div>
            <div className="fn-browse">
                <div className="fn-lead">
                    <h3><Link to="/suggestions">Mitä lukisin seuraavaksi?</Link></h3>
                    <p>Kirjaehdotukset: valitse genre ja mieltymyksesi vaihe vaiheelta, niin saat lukuvinkkejä bibliografian kirjoista.</p>
                    <Link className="fn-go" to="/suggestions">Aloita kirjaehdotukset</Link>
                </div>
                <nav className="fn-index" aria-label="Selaa bibliografiaa">
                    {WAYS_IN.map(([to, name, text]) => <Link key={to} className="fn-ix" to={to}><b>{name}</b><span>{text}</span></Link>)}
                </nav>
            </div>
        </section>
        <footer className="fn-foot">
            <Link to="/faq">Tietoja sivustosta</Link>
            <Link to="/stats">Tilastot</Link>
            <Link to="/changes">Muutokset</Link>
            <a href={USER_GUIDE} target="_blank" rel="noopener noreferrer">Käyttöohje</a>
            <span>Suomenkielisen spekulatiivisen fiktion bibliografia</span>
        </footer>
    </main>
);
