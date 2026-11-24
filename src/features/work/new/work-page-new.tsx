import "./work-new.css";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog } from "primereact/dialog";
import { OverlayPanel } from "primereact/overlaypanel";
import { ProgressSpinner } from "primereact/progressspinner";
import { Image } from "primereact/image";

import { LoadError } from "@components/load-error";
import { CollapsibleHtml } from "@components/collapsible-html";
import { getCurrenUser } from "@services/auth-service";
import { getApiContent } from "@services/user-service";
import { isAdmin } from "@features/user";
import { Edition, EditionOwnershipStatus, EditionPrice } from "@features/edition";
import { AwardList } from "@features/award";
import { ShortsList } from "@features/short";
import { KirjasampoTagImport, KirjasampoImportedNote } from "@features/tag";
import { getGenreColors } from "@features/genre/utils/genre-colors";
import { EntityChanges } from "@features/changes/components/entity-changes";
import { appearsIn } from "@utils/appears-in";
import { safeHtml } from "@utils/safe-html";
import { thumbUrl } from "@utils/cover-url";
import { Work } from "../types";
import { useEffectiveWorkId, EditionListItem } from "../routes/work-page";
import { WorkReadControl } from "../components/work-read-control";
import { isForeign } from "../utils/is-foreign";
import { isAnthology } from "../utils/is-anthology";
import {
    fetchSimilarWorks, partsText, reasonText, scoreText, shownReasons, SimilarWork, tagTypesText,
} from "../components/similar-works";
import {
    comparePrintings, laitosGroups, printingsSummary, seriesPosition, tagsByType,
} from "../utils/work-facts";
import { readViewState, rememberViewState, withViewState, WorkViewState } from "../utils/work-view-state";
import { EditionShelf } from "./edition-shelf";
import { EditionTable } from "./edition-table";
import { WorkAdminTools } from "./work-admin-tools";

const storage = () => {
    try { return window.localStorage; } catch { return null; }
};
const imageUrl = (src: string) => (src.startsWith("http") ? src : `${import.meta.env.VITE_IMAGE_URL}${src}`);
type Brief = { id: number; name: string; alt_name: string };
const naming = (p: Brief) => p.alt_name || p.name;
const peopleIn = (work: Work, role: number) => {
    const seen = new Map<number, Brief>();
    for (const c of work.contributions ?? []) if (c.role.id === role && !seen.has(c.person.id)) seen.set(c.person.id, c.person);
    return [...seen.values()];
};
/** "Russ, Joanna & Le Guin, Ursula K." → "Joanna Russ & Ursula K. Le Guin" */
const naturalNames = (s: string | null) =>
    (s ?? "").split(" & ").map(p => (p.includes(", ") ? p.split(", ").reverse().join(" ") : p)).join(" & ");
const PeopleLinks = ({ people }: { people: Brief[] }) => (
    <>{people.map((p, i) => <Fragment key={p.id}>{i > 0 && " & "}<Link to={`/people/${p.id}`}>{naming(p)}</Link></Fragment>)}</>
);

/** Writers whose pen name several real people share get the real writer shown (as on the current page). */
const useSharedAliasAuthors = (work: Work | undefined) => {
    const withReal = (work?.contributions ?? []).filter(c => c.role.id === 1 && c.real_person?.id);
    const { data = [] } = useQuery({
        queryKey: ["shared-alias-authors", withReal.map(c => c.person.id)],
        queryFn: async () => {
            const results = await Promise.all(withReal.map(async c => {
                const response = await getApiContent(`people/${c.person.id}/real-names`, getCurrenUser());
                return (response.data as Brief[]).length > 1 ? c.real_person as Brief : null;
            }));
            return results.filter((r): r is Brief => r !== null);
        },
        enabled: withReal.length > 0,
    });
    return data;
};

const SimilarRow = ({ works }: { works: SimilarWork[] }) => {
    const op = useRef<OverlayPanel>(null);
    const [why, setWhy] = useState<SimilarWork | null>(null);
    return (
        <section className="wn-similar" aria-labelledby="wn-similar-h">
            <h2 id="wn-similar-h">Samankaltaiset teokset</h2>
            <p>Asiasanojen, kuvauksen ja genren perusteella. Näkyy toistaiseksi vain ylläpitäjille.</p>
            <ul className="wn-simrow">
                {works.map(w => (
                    <li key={w.id} className="wn-sim">
                        {w.image ? <img src={thumbUrl(w.image)} alt="" loading="lazy" /> : <span className="wn-ph" aria-hidden="true" />}
                        <div>
                            <Link className="wn-sim-t" to={`/works/${w.id}`}>{w.title}</Link>
                            {(w.reasons.length > 0 || w.signals) && (
                                <button type="button" className="wn-why" aria-label={`Miksi samankaltainen: ${w.title}?`} title="Miksi samankaltainen?"
                                    aria-haspopup onClick={e => { setWhy(w); op.current?.toggle(e); }}>
                                    <i className="pi pi-question-circle" aria-hidden="true" />
                                </button>
                            )}
                            <small>{naturalNames(w.author_str)}{w.pubyear ? `, ${w.pubyear}` : ""}</small>
                        </div>
                    </li>
                ))}
            </ul>
            <OverlayPanel ref={op} onHide={() => setWhy(null)} style={{ maxWidth: "22rem" }}>
                {why && (
                    <>
                        <ul className="wn-why-list">{shownReasons(why.reasons).map((r, i) => <li key={i}>{reasonText(r)}</li>)}</ul>
                        {why.signals && <div className="wn-why-values">{partsText(why.signals)}<br />{tagTypesText(why.signals)}<br />{scoreText(why)}</div>}
                    </>
                )}
            </OverlayPanel>
        </section>
    );
};

export const WorkPageNew = ({ id }: { id?: string | null }) => {
    const user = useMemo(() => getCurrenUser(), []);
    const admin = isAdmin(user);
    const queryClient = useQueryClient();
    const { workId, isLoading: resolving, error: resolveError, highlightEditionId, refetch: refetchWorkId } = useEffectiveWorkId(id);
    const [formOpen, setFormOpen] = useState(false);
    const [historyVisible, setHistoryVisible] = useState(false);
    const [awardsVisible, setAwardsVisible] = useState(false);
    const [preview, setPreview] = useState<number | null>(null);
    // Merged rows the reader opened (true) or closed (false); otherwise only the picked printing's row is open.
    const [opened, setOpened] = useState<Map<number, boolean>>(new Map());
    const [searchParams, setSearchParams] = useSearchParams();
    const state = readViewState(searchParams, storage());
    const scrollTo = useRef<number | null>(null);

    const { data: work, error, refetch } = useQuery<Work>({
        queryKey: ["work", workId],
        queryFn: async () => (await getApiContent(`works/${workId}`, user)).data,
        enabled: !!workId && !formOpen,
    });
    const { data: prices } = useQuery<Record<number, EditionPrice>>({
        queryKey: ["work", workId, "edition-prices", user?.id],
        queryFn: async () => (await getApiContent(`user/${user!.id}/work/${workId}/edition-prices`, user)).data,
        enabled: !!workId && !!user,
    });
    // One request per work for the user's conditions, not one per printing (work.md step 0).
    const { data: ownership } = useQuery<Record<string, EditionOwnershipStatus>>({
        queryKey: ["work", workId, "ownership", user?.id],
        queryFn: async () => (await getApiContent(`user/${user!.id}/work/${workId}/ownership`, user)).data,
        enabled: !!workId && !!user,
    });
    const { data: similar = [] } = useQuery({
        queryKey: ["work", Number(workId), "similar"],
        queryFn: () => fetchSimilarWorks(Number(workId), user),
        enabled: !!workId && admin,
    });
    const sharedAlias = useSharedAliasAuthors(work);

    // A printing opened through /editions/:id is picked until the reader picks another.
    const picked = state.painos ?? (highlightEditionId ? Number(highlightEditionId) : null);
    const laitos = useMemo(() => laitosGroups(work?.editions ?? [], state.mode), [work, state.mode]);

    // The page scrolls to the picked printing's row.
    useEffect(() => {
        if (highlightEditionId && work) scrollTo.current = Number(highlightEditionId);
    }, [highlightEditionId, work]);
    useEffect(() => {
        if (scrollTo.current === null) return;
        const row = document.getElementById(`painos-${scrollTo.current}`);
        if (row) { row.scrollIntoView({ block: "center" }); scrollTo.current = null; }
    });

    useEffect(() => { if (work) document.title = work.title; }, [work]);

    if (resolveError) return <LoadError error={resolveError} notFoundTitle="Painosta ei löytynyt" onRetry={() => refetchWorkId()} />;
    if (error) return <LoadError error={error} notFoundTitle="Teosta ei löytynyt" onRetry={() => refetch()} />;
    if (resolving || !work) return <div className="flex justify-content-center p-5"><ProgressSpinner /></div>;

    // Each change starts from the URL as it is now, not from this render's copy.
    const update = (changes: Partial<WorkViewState>, replace = false) => {
        const next = withViewState(new URLSearchParams(window.location.search), changes);
        setSearchParams(next, { replace });
        if (changes.mode !== undefined || changes.view !== undefined) rememberViewState(storage(), { ...state, ...changes });
    };
    const pickedGroup = laitos.flatMap(l => l.groups).find(g => g.length > 1 && g.some(e => e.id === picked))?.[0].id;
    const isOpen = (firstId: number) => opened.get(firstId) ?? firstId === pickedGroup;
    const open = new Set(laitos.flatMap(l => l.groups).map(g => g[0].id).filter(isOpen));
    const toggle = (firstId: number) => setOpened(prev => new Map(prev).set(firstId, !isOpen(firstId)));
    const pick = (editionId: number) => {
        scrollTo.current = editionId;
        const group = laitos.flatMap(l => l.groups).find(g => g.some(e => e.id === editionId));
        if (group && group.length > 1) setOpened(prev => new Map(prev).set(group[0].id, true));
        update({ painos: editionId }, true);
    };

    const editions = [...(work.editions ?? [])].sort(comparePrintings);
    const pickedEdition = editions.find(e => e.id === picked);
    const coverEdition = pickedEdition?.images?.length ? pickedEdition : editions.find(e => e.images?.length);
    const cover = coverEdition?.images[0];
    const coverNote = pickedEdition && pickedEdition === coverEdition
        ? (pickedEdition.editionnum ? `${pickedEdition.editionnum}. painoksen kansi, ${pickedEdition.pubyear}` : `Numerottoman painoksen kansi, ${pickedEdition.pubyear}`)
        : coverEdition ? `Kansi ${coverEdition.pubyear}` : "";

    const authors = peopleIn(work, 1);
    const editors = peopleIn(work, 3);
    const series = seriesPosition(work);
    const subjects = tagsByType(work.tags);
    const awards = [...(work.awards ?? [])].sort((a, b) => Number(a.year) - Number(b.year));
    const people = appearsIn(work.contributions);
    const foreign = isForeign(work) && work.orig_title && work.orig_title !== work.title;
    const anthologyAuthor = authors[0];
    const hasStories = (work.stories?.length ?? 0) > 0;
    const crumbAuthors = authors.map(naming).join(", ");

    const readMark = user ? (
        <section><h2>Oma lukumerkintä</h2><WorkReadControl workId={work.id} /></section>
    ) : null;
    const side = (
        <>
            {work.links?.length > 0 && (
                <section>
                    <h2>Linkit</h2>
                    <ul className="wn-links">
                        {work.links.filter(l => l.link?.trim()).map((l, i) => (
                            <li key={i}><a href={l.link} target="_blank" rel="noopener noreferrer">{l.description || l.link}</a></li>
                        ))}
                    </ul>
                </section>
            )}
            {admin && (
                <section>
                    <h2>Ylläpitäjille</h2>
                    <div className="wn-adminbox">
                        <KirjasampoImportedNote imported={work.kirjasampo_imported} />
                        <KirjasampoTagImport work={work} user={user}
                            onImported={() => queryClient.invalidateQueries({ queryKey: ["work", workId] })}
                            onLinkAdded={() => queryClient.invalidateQueries({ queryKey: ["work", workId] })} />
                    </div>
                </section>
            )}
            <p className="wn-hist"><button type="button" className="wn-link" onClick={() => setHistoryVisible(true)}>Muutoshistoria</button></p>
        </>
    );

    return (
        <main className="wn" data-work-page="uusi">
            <nav className="wn-crumbs" aria-label="Murupolku">
                <Link to="/bookindex">Kirjat</Link>
                {authors.length > 0 && <> / {authors.length === 1 ? <Link to={`/people/${authors[0].id}`}>{crumbAuthors}</Link> : crumbAuthors}</>}
                {" / "}{work.title}
            </nav>
            <article>
                <div className={`wn-rec${cover ? "" : " wn-nocover"}`}>
                    {cover && (
                        <div>
                            <Image className="wn-cover" src={imageUrl(cover.image_src)} alt={`Kansikuva: ${work.title}`} preview />
                            <div className="wn-cover-note">{coverNote}</div>
                        </div>
                    )}
                    <div>
                        {authors.length > 0 && (
                            <p className="wn-byline"><PeopleLinks people={authors} />
                                {sharedAlias.length > 0 && <small> (kirjoittanut <PeopleLinks people={sharedAlias} />)</small>}
                            </p>
                        )}
                        <h1 className="wn-title">{work.title}{work.subtitle && <span className="wn-subtitle">{work.subtitle}</span>}</h1>
                        <p className="wn-orig">
                            {foreign
                                ? <>{work.orig_title}<span>{[work.language_name?.name, work.pubyear].filter(Boolean).join(", ")}</span></>
                                : <span className="wn-only">Julkaistu {work.pubyear}</span>}
                        </p>
                        <dl className="wn-facts">
                            <dt>Tyyppi</dt><dd>{work.work_type?.name}</dd>
                            {work.genres?.length > 0 && (
                                <>
                                    <dt>Genre</dt>
                                    <dd>{work.genres.map((g: { abbr: string; name: string }) => (
                                        <span className="wn-gdot" key={g.abbr}><i style={{ background: getGenreColors([g.abbr])[0] ?? "#6C757D" }} />{g.name}</span>
                                    ))}</dd>
                                </>
                            )}
                            {editors.length > 0 && <><dt>Toimittanut</dt><dd><PeopleLinks people={editors} /></dd></>}
                            {awards.length > 0 && (
                                <>
                                    <dt>Palkinnot</dt>
                                    <dd>
                                        {awards.slice(0, 3).map(a => (
                                            <span className="wn-award" key={a.id}>
                                                <i className="pi pi-trophy" aria-hidden="true" />
                                                <Link to={`/awards/${a.award.id}`}>{a.award.name}</Link> {a.year}
                                                {a.category && <>, <small>{a.category.name.toLowerCase()}</small></>}
                                            </span>
                                        ))}
                                        {awards.length > 3 && (
                                            <button type="button" className="wn-link" onClick={() => setAwardsVisible(true)}>
                                                {awards.length - 3} muuta palkintoa
                                            </button>
                                        )}
                                    </dd>
                                </>
                            )}
                            {series && work.bookseries && (
                                <>
                                    <dt>Sarja</dt>
                                    <dd>
                                        {work.bookseries.partof && <><Link to={`/bookseries/${work.bookseries.partof.id}`}>{work.bookseries.partof.name}</Link> › </>}
                                        <Link to={`/bookseries/${work.bookseries.id}`}>{work.bookseries.name}</Link>
                                        {work.bookseriesnum && ` ${work.bookseriesnum}`}
                                        <span className="wn-pos">{series.label}</span>
                                        <nav className="wn-snav" aria-label="Sarjassa">
                                            {series.prev ? <Link to={`/works/${series.prev.id}`} rel="prev">‹ {series.prev.title}</Link> : <span />}
                                            {series.next && <Link to={`/works/${series.next.id}`} rel="next">{series.next.title} ›</Link>}
                                        </nav>
                                    </dd>
                                </>
                            )}
                            {work.consists_of?.length > 0 && (
                                <>
                                    <dt>Sisältää</dt>
                                    <dd><ul>{work.consists_of.map(item => (
                                        <li key={item.work.id}>
                                            <Link to={`/works/${item.work.id}`}>{item.work.title}</Link>
                                            {item.work.pubyear && <small> {item.work.pubyear}</small>}
                                            {item.explanation && <small> [{item.explanation}]</small>}
                                        </li>
                                    ))}</ul></dd>
                                </>
                            )}
                            {work.part_of?.length > 0 && (
                                <>
                                    <dt>Myös teoksessa</dt>
                                    <dd><ul>{[...work.part_of].sort((a, b) => a.omnibus.title.localeCompare(b.omnibus.title, "fi")).map(p => (
                                        <li key={p.omnibus.id}><Link to={`/works/${p.omnibus.id}`}>{p.omnibus.title}</Link>{p.omnibus.pubyear && <small> {p.omnibus.pubyear}</small>}</li>
                                    ))}</ul></dd>
                                </>
                            )}
                            {people && people.length > 0 && (
                                <>
                                    <dt>Henkilöt</dt>
                                    <dd><PeopleLinks people={people.map(c => c.person)} /></dd>
                                </>
                            )}
                        </dl>
                    </div>
                    <aside className="wn-side" aria-label="Lisätiedot">{readMark}{side}</aside>
                </div>
                {readMark && <div className="wn-side wn-narrow" style={{ marginTop: 22 }}>{readMark}</div>}
                {(work.description || work.misc || subjects.length > 0) && (
                    <div className={`wn-about${cover ? "" : " wn-nocover"}`}>
                        <div>
                            {work.description && (
                                <div className="wn-desc">
                                    <CollapsibleHtml html={work.description} collapsedHeight={10} />
                                    {work.descr_attr && <div className="wn-attr" dangerouslySetInnerHTML={safeHtml(work.descr_attr)} />}
                                </div>
                            )}
                            {work.misc && <p className="wn-misc">{work.misc}</p>}
                            {subjects.length > 0 && (
                                <section>
                                    <h2 className="wn-subj-h">Asiasanat</h2>
                                    <dl className="wn-subjects">
                                        {subjects.map(g => (
                                            <Fragment key={g.label}>
                                                <dt>{g.label}</dt>
                                                <dd>{g.tags.map((t, i) => <Fragment key={t.id}>{i > 0 && ", "}<Link to={`/tags/${t.id}`}>{t.name}</Link></Fragment>)}</dd>
                                            </Fragment>
                                        ))}
                                    </dl>
                                </section>
                            )}
                        </div>
                    </div>
                )}
            </article>

            {hasStories && (
                <section className="wn-contents" aria-labelledby="wn-contents-h">
                    <h2 id="wn-contents-h">Sisältö</h2>
                    <ShortsList shorts={work.stories} person={anthologyAuthor as never} anthology={isAnthology(work)} workEditions={work.editions} />
                </section>
            )}

            {editions.length > 0 && (
                <section className="wn-printings" aria-labelledby="wn-printings-h">
                    <div className="wn-p-head">
                        <div>
                            <h2 id="wn-printings-h">Painokset</h2>
                            <p>{printingsSummary(editions)}</p>
                        </div>
                        {editions.length > 1 && (
                            <div className="wn-ctrls">
                                <div className="wn-seg" role="group" aria-label="Ryhmittely">
                                    {([["all", "Kaikki"], ["condensed", "Samanlaiset yhdessä"], ["brief", "Laitoksittain"]] as const).map(([m, label]) => (
                                        <button key={m} type="button" aria-pressed={state.mode === m} onClick={() => update({ mode: m })}>{label}</button>
                                    ))}
                                </div>
                                <div className="wn-seg wn-viewseg" role="group" aria-label="Näkymä">
                                    {([["taulukko", "Taulukko"], ["kortit", "Kortit"]] as const).map(([v, label]) => (
                                        <button key={v} type="button" aria-pressed={state.view === v} onClick={() => update({ view: v })}>{label}</button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <EditionShelf editions={editions} laitos={laitosGroups(editions, "all")} picked={picked} onPick={pick} onPreview={setPreview} />
                    {state.view === "kortit" ? (
                        <div className="grid mt-4">
                            {laitos.flatMap(l => l.groups).map(group => (
                                <EditionListItem key={group[0].id} editions={group as Edition[]} work={work}
                                    onSubmitCallback={() => queryClient.invalidateQueries({ queryKey: ["work", workId] })}
                                    onUpload={() => queryClient.invalidateQueries({ queryKey: ["work", workId] })}
                                    onUploadError={() => undefined}
                                    highlightEditionId={picked !== null ? String(picked) : null}
                                    editionPrice={group.length === 1 ? prices?.[group[0].id] : undefined} />
                            ))}
                        </div>
                    ) : (
                        <EditionTable work={work} laitos={laitos} user={user} admin={admin} ownership={ownership} prices={prices}
                            picked={picked} preview={preview} open={open} onToggle={toggle} />
                    )}
                </section>
            )}

            {admin && similar.length > 0 && <SimilarRow works={similar} />}

            <div className="wn-side wn-narrow" style={{ marginTop: 40 }}>{side}</div>

            <Dialog header="Muutoshistoria" visible={historyVisible} onHide={() => setHistoryVisible(false)} className="w-full lg:w-8" blockScroll>
                {historyVisible && <EntityChanges entityId={work.id} entity="work" />}
            </Dialog>
            <Dialog header="Palkinnot" visible={awardsVisible} onHide={() => setAwardsVisible(false)} className="w-full lg:w-6" blockScroll>
                {awardsVisible && <AwardList awards={work.awards} />}
            </Dialog>
            {admin && workId && <WorkAdminTools work={work} workId={String(workId)} onFormOpen={setFormOpen} />}
        </main>
    );
};
