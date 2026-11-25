// The person page in the proposed visual identity (docs/ui-redesign/pages/person.md
// and person-identity.md). Admins can switch to it from the current page
// (PersonPageSwitch); everyone else still sees the current page.
import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ProgressSpinner } from "primereact/progressspinner";
import { Dialog } from "primereact/dialog";

import "./person-new.css";
import type { Person } from "../types";
import type { Awarded } from "../../award";
import type { Issue } from "../../issue";
import { getCurrenUser } from "../../../services/auth-service";
import { getApiContent } from "../../../services/user-service";
import { isAdmin } from "../../user";
import { selectId } from "../../../utils";
import { useDocumentTitle } from "../../../components/document-title";
import { LoadError } from "@components/load-error";
import { IdentityDisclosure } from "@components/identity-disclosure";
import { BookSeriesList } from "@features/bookseries";
import { ContributorMagazineControl } from "@components/contributor-magazine-control";
import { EntityChanges } from "@features/changes/components/entity-changes";
import { getCountryCode } from "@utils/country-utils";
import { safeHtml } from "@utils/safe-html";
import { getGenreColors } from "../../genre/utils/genre-colors";
import {
    aboutItems, booksByRole, derivePersonRoles, FICTION_TYPES, ownEditions, hasRole, isNonSfStory, isNonSfWork, NONFICTION_TYPES,
    OTHER_TYPES, ownIds, ownStories, outputSummary, personTabs, PRODUCTION_ROLES, storiesByRole, visibleLinks,
    type BookEntry, type PersonTab, type TabKey,
} from "../utils/person-facts";
import { parseListState, withListState, type ListState } from "../utils/list-state";
import { AboutList, AwardRows, BookList, naturalName, StoryList, type Update } from "./person-lists";
import { PersonAdminTools } from "./person-admin-tools";

const fetchJson = async <T,>(url: string): Promise<T> => (await getApiContent(url, getCurrenUser())).data;

/** Below this many printings a person with a single book gets a one-sentence summary. */
const SUMMARY_BELOW = 5;

const names = (list: { id: number; name: string; alt_name?: string }[], one: string, many: string) =>
    list.length === 0 ? null : (
        <>
            <dt>{list.length === 1 ? one : many}</dt>
            <dd>{list.map((p, i) => <span key={p.id}>{i > 0 && ", "}<Link to={`/people/${p.id}`}>{p.alt_name || naturalName(p.name)}</Link></span>)}</dd>
        </>
    );

const lifespan = (p: Person) => p.dob ? `${p.dob}–${p.dod ?? ""}` : p.dod ? `?–${p.dod}` : "";

const PersonRecord = ({ person, roles, output }: { person: Person; roles: string[]; output: string }) => {
    const image = person.images?.find(i => i.src);
    const name = person.alt_name || person.name;
    const country = person.nationality?.name ? getCountryCode(person.nationality.name) : "UNKNOWN";
    const credit = image ? [image.attr?.replace(/<[^>]+>/g, "").trim(), image.license].filter(Boolean).join(", ") : "";
    return (
        <section className={`pn-rec${image ? "" : " pn-noportrait"}`} aria-label="Henkilön tiedot">
            {image && (
                <div>
                    <img className="pn-portrait" src={image.src} alt={name} />
                    {credit && <div className="pn-credit">Kuva: {credit}</div>}
                </div>
            )}
            <div className="pn-rec-text">
                <div><h1 className="pn-name">{name}</h1></div>
                <dl className="pn-facts">
                    {person.fullname && person.fullname !== name && <><dt>Koko nimi</dt><dd>{person.fullname}</dd></>}
                    {names((person.aliases ?? []) as Person[], "Salanimi", "Salanimet")}
                    {person.other_names && <><dt>Muut nimet</dt><dd>{person.other_names}</dd></>}
                    {names(person.real_names ?? [], "Oikea henkilö", "Oikeat henkilöt")}
                    {person.nationality?.name && (
                        <><dt>Kansallisuus</dt><dd>
                            {country !== "UNKNOWN" && <img className="pn-flag" alt="" src={`https://hatscripts.github.io/circle-flags/flags/${country.toLowerCase()}.svg`} />}
                            {person.nationality.name}
                        </dd></>
                    )}
                    {lifespan(person) && <><dt>Elinvuodet</dt><dd>{lifespan(person)}</dd></>}
                    {roles.length > 0 && <><dt>Roolit</dt><dd>{roles.map(r => r.toLowerCase()).join(", ")}</dd></>}
                    {output && <><dt>Tuotanto</dt><dd>{output}</dd></>}
                </dl>
            </div>
        </section>
    );
};

const ROLE_PHRASE: Record<string, string> = {
    kirjoittaja: "Kirjoittanut kirjan", toimittaja: "Toimittanut kirjan", kaantaja: "Suomentanut kirjan",
    kansikuva: "Kansikuva kirjaan", kuvittaja: "Kuvitus kirjaan",
};

/** With few printings and a single book, one sentence says what there is. */
const SparseSummary = ({ entries }: { entries: BookEntry[] }) => {
    if (entries.length !== 1) return null;
    const { work, editions, role } = entries[0];
    const printings = [...editions].sort((a, b) => Number(a.pubyear) - Number(b.pubyear))
        .map(e => `${e.publisher?.name ?? ""} ${e.pubyear}`.trim()).join(", ");
    return (
        <p className="pn-summary">
            {ROLE_PHRASE[role]} <Link to={`/works/${work.id}`}>{work.title}</Link>
            {role !== "kirjoittaja" && work.author_str && ` (${naturalName(work.author_str)})`}{printings && `, ${printings}`}.
        </p>
    );
};

const Sidebar = ({ person, onHistory }: { person: Person; onHistory: () => void }) => {
    const [allTags, setAllTags] = useState(false);
    const ids = ownIds(person);
    const own = (person.works ?? []).filter(w => hasRole(w.contributions, ids, PRODUCTION_ROLES));
    const genres = new Map<string, { name: string; n: number }>();
    const tags = new Map<number, { name: string; n: number }>();
    for (const w of own) {
        for (const g of w.genres ?? []) genres.set(g.abbr, { name: g.name, n: (genres.get(g.abbr)?.n ?? 0) + 1 });
        for (const t of w.tags ?? []) tags.set(t.id, { name: t.name, n: (tags.get(t.id)?.n ?? 0) + 1 });
    }
    const genreList = [...genres.entries()].sort((a, b) => b[1].n - a[1].n);
    const tagList = [...tags.entries()].sort((a, b) => b[1].n - a[1].n || a[1].name.localeCompare(b[1].name, "fi"));
    const shownTags = allTags ? tagList : tagList.slice(0, 7);
    const max = Math.max(1, ...genreList.map(([, g]) => g.n));
    const links = visibleLinks(person.links);
    return (
        <div className="pn-side">
            {genreList.length > 1 && (
                <section aria-labelledby="pn-genres">
                    <h2 id="pn-genres">Genret</h2>
                    {genreList.map(([abbr, g]) => (
                        <div className="pn-gbar" key={abbr}>
                            <span>{g.name}</span>
                            <span className="pn-track"><i style={{ width: `${(g.n / max) * 100}%`, background: getGenreColors([abbr])[0] ?? "#6C757D" }} /></span>
                            <b>{g.n}</b>
                        </div>
                    ))}
                </section>
            )}
            {tagList.length > 0 && (
                <section aria-labelledby="pn-tags">
                    <h2 id="pn-tags">Yleisimmät asiasanat</h2>
                    <p className="pn-tagtext">
                        {shownTags.map(([id, t], i) => (
                            <span key={id}>{i > 0 && ", "}<Link to={`/tags/${id}`}>{t.name}</Link>{t.n > 1 && <small> {t.n}</small>}</span>
                        ))}
                        {tagList.length > 7 && (
                            <>, <button type="button" onClick={() => setAllTags(!allTags)}>{allTags ? "näytä vähemmän" : `${tagList.length - 7} muuta`}</button></>
                        )}
                    </p>
                </section>
            )}
            {links.length > 0 && (
                <section aria-labelledby="pn-links">
                    <h2 id="pn-links">Linkit</h2>
                    <ul className="pn-links">
                        {links.map((l, i) => <li key={i}><a href={l.link} target="_blank" rel="noopener noreferrer">{l.description || l.link}</a></li>)}
                    </ul>
                </section>
            )}
            <p className="pn-hist"><button type="button" onClick={onHistory}>Muutoshistoria</button></p>
        </div>
    );
};

export const PersonPageNew = ({ id }: { id: string | null }) => {
    const params = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const user = getCurrenUser();
    const admin = isAdmin(user);
    const [, setDocumentTitle] = useDocumentTitle("");
    const [editing, setEditing] = useState(false);
    const [editWorkId, setEditWorkId] = useState<number | null>(null);
    const [historyVisible, setHistoryVisible] = useState(false);

    let thisId = "";
    try { thisId = selectId(params, id); } catch { /* no id: the query below reports it */ }

    // Same query keys as the current page, so switching between them reuses the data.
    const { data: person, error, refetch } = useQuery({
        queryKey: ["person", thisId], queryFn: () => fetchJson<Person>("people/" + thisId), enabled: !editing,
    });
    const { data: awards = [] } = useQuery({
        queryKey: ["workAwards", thisId], queryFn: () => fetchJson<Awarded[]>(`people/${thisId}/awarded`).catch(() => []),
    });
    const { data: issues = [] } = useQuery<Issue[]>({
        queryKey: ["person", thisId, "magazineContributions"],
        queryFn: () => fetchJson<Issue[]>(`people/${thisId}/issue-contributions`).catch(() => []),
    });

    useEffect(() => { if (person) setDocumentTitle(person.name); }, [person, setDocumentTitle]);

    const state = parseListState(searchParams);
    // Each change starts from the URL as it is now, not from this render's copy: typing right after a click
    // could otherwise run before the re-render and drop the click's change (seen under load in E2E).
    const currentParams = () => new URLSearchParams(window.location.search);
    const update: Update = (changes, options) => setSearchParams(withListState(currentParams(), changes), { replace: !!options?.replace });

    const derived = useMemo(() => {
        if (!person) return null;
        const books = {
            teokset: booksByRole(person, FICTION_TYPES, w => !isNonSfWork(w.genres)),
            tietokirjat: booksByRole(person, NONFICTION_TYPES, () => true),
            muut: booksByRole(person, OTHER_TYPES, w => isNonSfWork(w.genres)),
        };
        const ids = ownIds(person);
        return {
            books,
            stories: storiesByRole(person, s => !isNonSfStory(s.genres) && hasRole(s.contributors, ids, PRODUCTION_ROLES)),
            otherStories: storiesByRole(person, s => isNonSfStory(s.genres) && hasRole(s.contributors, ids, PRODUCTION_ROLES)),
            about: aboutItems(person),
            roles: derivePersonRoles(person, issues),
            printings: ownEditions(person).length,
            allBooks: [...Object.values(books.teokset), ...Object.values(books.tietokirjat), ...Object.values(books.muut)].flat(),
            hasOtherStories: ownStories(person).some(s => isNonSfStory(s.genres)),
        };
    }, [person, issues]);

    if (error) return <LoadError error={error} notFoundTitle="Henkilöä ei löytynyt" onRetry={() => refetch()} />;
    if (!person || !derived) {
        return <div className="flex justify-content-center p-5"><ProgressSpinner /></div>;
    }

    const tabs = personTabs(person, awards, issues.length);
    const active: PersonTab | undefined = tabs.find(t => t.key === state.osio) ?? tabs[0];
    const name = person.alt_name || person.name;

    const ids = ownIds(person);
    const realIds = new Set((person.real_names ?? []).map(r => r.id));
    // The live Sarjat tab's rule: books the person wrote, not those another writer wrote under a shared name.
    const seriesWorks = (person.works ?? []).filter(w => {
        const credits = w.contributions.filter(c => c.role.id === 1 && ids.has(c.person.id));
        return credits.length > 0 && credits.every(c => !c.real_person?.id || ids.has(c.real_person.id) || realIds.has(c.real_person.id));
    });

    const panel = (key: TabKey, listState: ListState) => {
        const onEditWork = admin ? setEditWorkId : undefined;
        switch (key) {
            case "teokset": return <BookList groups={derived.books.teokset} state={listState} update={update} user={user} onEditWork={onEditWork} person={person} />;
            case "tietokirjat": return <BookList groups={derived.books.tietokirjat} state={listState} update={update} user={user} onEditWork={onEditWork} person={person} />;
            case "novellit": return <StoryList groups={derived.stories} state={listState} update={update} person={person} />;
            case "sarjat": return <div className="pn-panel-legacy"><BookSeriesList works={seriesWorks} seriesType="bookseries" /></div>;
            case "lehdet": return <div className="pn-panel-legacy"><ContributorMagazineControl issues={issues} person={person.id} /></div>;
            case "palkinnot": return <AwardRows awards={awards} />;
            case "muut": return (
                <>
                    {Object.values(derived.books.muut).some(l => l.length > 0) && <>
                        <h3 className="pn-group-h">Kirjat</h3>
                        <BookList groups={derived.books.muut} state={listState} update={update} user={user} onEditWork={onEditWork} person={person} showView={false} />
                    </>}
                    {derived.hasOtherStories && <>
                        <h3 className="pn-group-h">Novellit ja artikkelit</h3>
                        <StoryList groups={derived.otherStories} state={listState} update={update} person={person} />
                    </>}
                </>
            );
            case "henkilosta": return <AboutList name={name} books={derived.about.books} articles={derived.about.articles} />;
        }
    };

    return (
        <main className="pn" data-person-page="uusi">
            <nav className="pn-crumbs" aria-label="Murupolku"><Link to="/people">Henkilöt</Link> / {name}</nav>
            <div className="pn-page">
                <div>
                    <PersonRecord person={person} roles={derived.roles} output={outputSummary(person, awards)} />
                    {derived.printings < SUMMARY_BELOW && <SparseSummary entries={derived.allBooks} />}
                    {person.bio && (
                        <div className="pn-bio">
                            <IdentityDisclosure className="pn-disc" showLabel="Näytä kuvaus" hideLabel="Piilota kuvaus">
                                <div className="html-content" dangerouslySetInnerHTML={safeHtml(person.bio)} />
                                {person.bio_src && <div className="pn-src">Lähde: <span dangerouslySetInnerHTML={safeHtml(person.bio_src)} /></div>}
                            </IdentityDisclosure>
                        </div>
                    )}
                    {active && (
                        <section className="pn-biblio" aria-label="Tuotanto">
                            {tabs.length > 1 ? (
                                <div className="pn-tabs" role="tablist" aria-label="Tuotanto">
                                    {tabs.map(t => (
                                        <button key={t.key} type="button" role="tab" id={`pn-tab-${t.key}`} aria-controls="pn-panel"
                                            aria-selected={t.key === active.key} onClick={() => update({ osio: t.key === tabs[0].key ? null : t.key })}>
                                            {t.label}<small>{t.count}</small>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <h2 className="pn-onegroup">{active.label}<small>{active.count}</small></h2>
                            )}
                            <div id="pn-panel" role={tabs.length > 1 ? "tabpanel" : undefined} aria-labelledby={tabs.length > 1 ? `pn-tab-${active.key}` : undefined}>
                                {panel(active.key, state)}
                            </div>
                        </section>
                    )}
                </div>
                <aside aria-label="Lisätiedot"><Sidebar person={person} onHistory={() => setHistoryVisible(true)} /></aside>
            </div>
            <Dialog header="Muutoshistoria" visible={historyVisible} onHide={() => setHistoryVisible(false)} className="w-full lg:w-8" blockScroll>
                {historyVisible && <EntityChanges entityId={person.id} entity="person" />}
            </Dialog>
            {admin && (
                <PersonAdminTools person={person} issueCount={issues.length} editWorkId={editWorkId}
                    onEditWorkClose={() => setEditWorkId(null)} onFormOpen={setEditing} />
            )}
        </main>
    );
};
