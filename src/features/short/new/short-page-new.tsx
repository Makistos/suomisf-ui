import "./short-new.css";

import { Fragment, useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Dialog } from "primereact/dialog";
import { ProgressSpinner } from "primereact/progressspinner";

import { getShort } from "@api/short/get-short";
import { LoadError } from "@components/load-error";
import { getCurrenUser } from "@services/auth-service";
import { isAdmin, type User } from "@features/user";
import { AwardList } from "@features/award";
import { getGenreColors } from "@features/genre/utils/genre-colors";
import { editionIsOwned } from "@features/edition/utils/edition-is-owned";
import { tagsByType, titleFit } from "@features/work/utils/work-facts";
import { appearsIn } from "@utils/appears-in";
import { removeDuplicateContributions } from "@utils/remove-duplicate-contributions";
import { safeHtml } from "@utils/safe-html";
import { selectId } from "@utils/select-id";
import { thumbUrl } from "@utils/cover-url";
import type { ImageType } from "../../../types/image";
import { useSimilarShorts } from "../hooks/use-similar-shorts";
import { Short } from "../types";
import { origYearMismatch, publicationRows, publishedCount, type PublicationRow, translationRows } from "../utils/short-facts";
import { ShortAdminTools } from "./short-admin-tools";

const FINNISH = 7;
type Brief = { id: number; name: string; alt_name?: string | null };
const naming = (p: Brief) => p.alt_name || (p.name.includes(", ") ? p.name.split(", ").reverse().join(" ") : p.name);
const peopleIn = (s: Short, role: number) => removeDuplicateContributions(s.contributors ?? []).filter(c => c.role.id === role).map(c => c.person as Brief);
const PeopleLinks = ({ people }: { people: Brief[] }) => (
    <>{people.map((p, i) => <Fragment key={p.id}>{i > 0 && " & "}<Link to={`/people/${p.id}`}>{naming(p)}</Link></Fragment>)}</>
);

/** A cover, or a plain cloth binding when there is none or it fails to load (as on the new front page). */
const Cover = ({ image }: { image?: ImageType }) => {
    const [failed, setFailed] = useState<string | null>(null);
    const src = image ? thumbUrl(image) : null;
    if (!src || failed === src) return <span className="sn-cloth" aria-hidden="true" />;
    return <img src={src} alt="" loading="lazy" onError={() => setFailed(src)} />;
};

const PublicationRowView = ({ row, user }: { row: PublicationRow; user: User | null }) => (
    <li className="sn-row">
        <Cover image={row.cover} />
        <div className="sn-row-main">
            {row.kind === "book" ? (
                <>
                    <Link className="sn-row-t" to={`/works/${row.printings[0].edition.work?.id ?? ""}`}>{row.title}</Link>
                    <p className="sn-row-s">
                        {row.by && <>{row.by}<span className="sn-sep" aria-hidden="true"> · </span></>}
                        {row.publisher && `${row.publisher} `}
                        {row.printings.map((p, i) => {
                            const owned = editionIsOwned(p.edition, user);
                            return (
                                <Fragment key={p.id}>
                                    {i > 0 && ", "}
                                    {owned && <i className="pi pi-star-fill sn-mark" role="img" aria-label="Omistat tämän painoksen" title="Omistat tämän painoksen" />}
                                    <Link to={`/editions/${p.id}`}>{p.year}</Link>
                                    {p.num > 1 && ` (${p.num}. p.)`}
                                </Fragment>
                            );
                        })}
                    </p>
                </>
            ) : (
                <>
                    <Link className="sn-row-t" to={`/issues/${row.id}`}>{row.title}</Link>
                    <p className="sn-row-s">{row.first}</p>
                </>
            )}
        </div>
        <span className="sn-row-k">{row.kind === "book" ? row.type : "Lehti"}</span>
    </li>
);

/** The short story page in the identity style, under trial for admins (short.md, work-identity.md). */
export const ShortPageNew = ({ id }: { id?: string | null }) => {
    const user = useMemo(() => getCurrenUser(), []);
    const admin = isAdmin(user);
    const params = useParams();
    let shortId = "";
    try { shortId = selectId(params, id ?? null); } catch { /* no id: the query stays off */ }
    const [formOpen, setFormOpen] = useState(false);
    const [awardsVisible, setAwardsVisible] = useState(false);

    const { data: short, error, refetch } = useQuery({
        queryKey: ["short", shortId],
        queryFn: () => getShort(shortId, user),
        enabled: !!shortId && !formOpen,
    });
    const { data: similar, loading: similarLoading } = useSimilarShorts(shortId, user);

    useEffect(() => { if (short) document.title = short.title; }, [short]);

    if (error) return <LoadError error={error} notFoundTitle="Novellia ei löytynyt" onRetry={() => refetch()} />;
    if (!short) return <div className="flex justify-content-center p-5"><ProgressSpinner /></div>;

    const writers = peopleIn(short, 1);
    const editors = writers.length === 0 ? peopleIn(short, 3) : [];
    const byline = writers.length ? writers : editors;
    const translators = peopleIn(short, 2);
    const people = appearsIn(removeDuplicateContributions(short.contributors ?? []));
    const foreign = short.lang?.id !== FINNISH && !!short.orig_title && short.orig_title !== short.title;
    const awards = [...(short.awards ?? [])].sort((a, b) => Number(a.year) - Number(b.year));
    const subjects = tagsByType(short.tags);
    const rows = publicationRows(short);
    const count = publishedCount(rows);
    const translations = translationRows(short, similar);
    const years = admin ? origYearMismatch(short, similar) : null;

    return (
        <main className="sn" data-short-page="uusi">
            <nav className="sn-crumbs" aria-label="Murupolku">
                <Link to="/shortstoryindex">Novellit</Link>
                {byline.length === 1 && <> / <Link to={`/people/${byline[0].id}`}>{naming(byline[0])}</Link></>}
                {" / "}{short.title}
            </nav>

            <header className="sn-head">
                {byline.length > 0 && (
                    <p className="sn-byline"><PeopleLinks people={byline} />{editors.length > 0 && " (toim.)"}</p>
                )}
                <h1 className="sn-title" style={{ "--sn-title-fit": titleFit(short.title) } as CSSProperties}>{short.title}</h1>
                <p className="sn-orig">
                    {foreign
                        ? <>{short.orig_title}<span>{[short.lang?.name, short.pubyear].filter(Boolean).join(", ")}</span></>
                        : short.pubyear && <span className="sn-only">Julkaistu {short.pubyear}</span>}
                </p>
                <dl className="sn-facts">
                    <dt>Tyyppi</dt><dd>{short.type?.name}</dd>
                    {short.genres?.length > 0 && (
                        <>
                            <dt>Genre</dt>
                            <dd>{short.genres.map(g => (
                                <span className="sn-gdot" key={g.abbr}><i style={{ background: getGenreColors([g.abbr])[0] ?? "#6C757D" }} />{g.name}</span>
                            ))}</dd>
                        </>
                    )}
                    {translators.length > 0 && <><dt>Suomentanut</dt><dd><PeopleLinks people={translators} /></dd></>}
                    {awards.length > 0 && (
                        <>
                            <dt>Palkinnot</dt>
                            <dd>
                                {awards.slice(0, 3).map(a => (
                                    <span className="sn-award" key={a.id}>
                                        <i className="pi pi-trophy" aria-hidden="true" />
                                        <Link to={`/awards/${a.award.id}`}>{a.award.name}</Link> {a.year}
                                        {a.category && <>, <small>{a.category.name.toLowerCase()}</small></>}
                                    </span>
                                ))}
                                {awards.length > 3 && (
                                    <button type="button" className="sn-link" onClick={() => setAwardsVisible(true)}>{awards.length - 3} muuta palkintoa</button>
                                )}
                            </dd>
                        </>
                    )}
                    {people && people.length > 0 && <><dt>Henkilöt</dt><dd><PeopleLinks people={people.map(c => c.person as Brief)} /></dd></>}
                    {subjects.map(g => (
                        <Fragment key={g.label}>
                            <dt>{g.label}</dt>
                            <dd>{g.tags.map((t, i) => <Fragment key={t.id}>{i > 0 && ", "}<Link to={`/tags/${t.id}`}>{t.name}</Link></Fragment>)}</dd>
                        </Fragment>
                    ))}
                </dl>
                {short.notes && <div className="sn-notes" dangerouslySetInnerHTML={safeHtml(short.notes)} />}
            </header>

            <section className="sn-sec" aria-labelledby="sn-pub-h">
                <div className="sn-sec-head">
                    <h2 id="sn-pub-h">Julkaistu{count && <small>{count}</small>}</h2>
                    <p>{foreign ? "Kirjat ja lehdet, joissa tämä suomennos on ilmestynyt" : "Kirjat ja lehdet, joissa novelli on ilmestynyt"}</p>
                </div>
                {rows.length > 0
                    ? <ul className="sn-rows">{rows.map(r => <PublicationRowView key={r.key} row={r} user={user} />)}</ul>
                    : <p className="sn-empty">Julkaisutietoja ei ole vielä lisätty.</p>}
            </section>

            {!similarLoading && translations.length > 0 && (
                <section className="sn-sec" aria-labelledby="sn-tr-h">
                    <div className="sn-sec-head">
                        <h2 id="sn-tr-h">Suomennokset<small>{translations.length}</small></h2>
                        <p>Kaikki saman novellin suomennokset, vanhin ensin</p>
                    </div>
                    {years && (
                        <p className="sn-yearnote" role="note">
                            <i className="pi pi-exclamation-triangle" aria-hidden="true" />
                            Suomennoksilla on eri alkuteoksen vuosi: {years.map(y => `${y.year} (${y.titles.join(", ")})`).join("; ")}. Tarkista tiedot.
                        </p>
                    )}
                    <table className="sn-tr">
                        <thead>
                            <tr><th scope="col">Nimi</th><th scope="col">Suomentaja</th><th scope="col" className="sn-y">Ensin</th><th scope="col">Julkaistu</th></tr>
                        </thead>
                        <tbody>
                            {translations.map(t => (
                                <tr key={t.id} className={t.current ? "sn-this" : undefined} aria-current={t.current ? "page" : undefined}>
                                    <td data-label="Nimi">
                                        {t.current ? <><b>{t.title}</b><span className="sn-this-tag">tämä suomennos</span></> : <Link to={`/shorts/${t.id}`}>{t.title}</Link>}
                                    </td>
                                    <td data-label="Suomentaja">{t.translators.length ? <PeopleLinks people={t.translators} /> : <span className="sn-none">ei tiedossa</span>}</td>
                                    <td data-label="Ensin" className="sn-y">{t.first ?? "–"}</td>
                                    <td data-label="Julkaistu">{t.places.join(", ")} <span className="sn-n">({t.count} {t.count === 1 ? "julkaisu" : "julkaisua"})</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}

            <Dialog header="Palkinnot" visible={awardsVisible} onHide={() => setAwardsVisible(false)} className="w-full lg:w-6" blockScroll>
                {awardsVisible && <AwardList awards={short.awards} />}
            </Dialog>
            {admin && <ShortAdminTools short={short} shortId={shortId} onFormOpen={setFormOpen} />}
        </main>
    );
};
