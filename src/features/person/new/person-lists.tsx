// Lists of the new person page: books by role, stories, items about the
// person and awards, as catalogue entries, with the toolbar that filters
// inside the current tab. All list state is in the URL (list-state.ts).
import { Fragment, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { SelectButton } from "primereact/selectbutton";
import { Sidebar } from "primereact/sidebar";
import { Button } from "primereact/button";

import type { Work } from "../../work";
import type { Edition } from "../../edition";
import type { Short } from "../../short";
import type { Awarded } from "../../award";
import type { User } from "../../user";
import { editionIsOwned } from "../../edition/utils/edition-is-owned";
import { editionIsWishlisted } from "../../edition/utils/edition-is-wishlisted";
import { getGenreColors } from "../../genre/utils/genre-colors";
import { thumbUrl } from "../../../utils/cover-url";
import {
    byCredit, creditFacets, ROLE_TABS, storyYear, writerCredit, type BookEntry, type Credit, type CreditFacet, type RoleKey, type StoryRoleKey,
} from "../utils/person-facts";
import type { Person } from "../types";
import {
    filterRows, groupRows, sortRows, typeFacets, typeSlug, type ListRow, type ListState,
} from "../utils/list-state";

export type Update = (changes: Partial<ListState>, options?: { replace?: boolean }) => void;

/** Show the filter toolbar from about this many items (agreed "Missing data" rule). */
const TOOLBAR_FROM = 10;

const SORT_OPTIONS = [
    { label: "Nimi", value: "nimi" },
    { label: "Alkuteoksen vuosi", value: "alkuvuosi" },
    { label: "Suomenkielinen vuosi", value: "suomivuosi" },
];
const VIEW_OPTIONS = [{ label: "Lista", value: "lista" }, { label: "Kannet", value: "kannet" }];

const TYPE_PLURAL: Record<string, string> = {
    Romaani: "Romaanit", Kokoelma: "Kokoelmat", Kokoomateos: "Kokoomateokset", Sarjakuva: "Sarjakuvat", Vihko: "Vihkot",
    Tietokirja: "Tietokirjat", Novelli: "Novellit", "Pitkä novelli": "Pitkät novellit", Pienoisromaani: "Pienoisromaanit",
    Runo: "Runot", Raapale: "Raapaleet", "Filk-laulu": "Filk-laulut", Artikkeli: "Artikkelit", Esipuhe: "Esipuheet",
};
const typePlural = (t: string) => TYPE_PLURAL[t] ?? t;

/** "Le Guin, Ursula K. & Halme, Jukka (toim.)" -> "Ursula K. Le Guin & Jukka Halme (toim.)" */
export const naturalName = (name: string | null | undefined) => {
    const raw = name ?? "";
    const editor = /\s*\(toim\.\)$/.test(raw);
    const people = raw.replace(/\s*\(toim\.\)$/, "").split(" & ")
        .map(p => p.includes(", ") ? p.split(", ").reverse().join(" ") : p).join(" & ");
    return people + (editor ? " (toim.)" : "");
};

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const GenreDots = ({ genres }: { genres?: { abbr: string; name: string }[] }) => (
    <>{(genres ?? []).map(g => (
        <span className="pn-gdot" key={g.abbr}>
            <i style={{ background: getGenreColors([g.abbr])[0] ?? "#6C757D" }} />{g.name}
        </span>
    ))}</>
);

const RoleRow = ({ roles, active, onPick }: { roles: [string, string, number][]; active: string; onPick: (key: string) => void }) => (
    <div className="pn-roles" role="group" aria-label="Rooli">
        <span>Rooli</span>
        <div className="pn-seg">
            {roles.map(([key, label, n]) => (
                <button key={key} type="button" aria-pressed={key === active} onClick={() => onPick(key)}>
                    {label}<small>{n}</small>
                </button>
            ))}
        </div>
    </div>
);

type ToolbarProps = { rows: ListRow[]; state: ListState; update: Update; showView: boolean };

const Toolbar = ({ rows, state, update, showView }: ToolbarProps) => {
    const [sheet, setSheet] = useState(false);
    const facets = typeFacets(rows, state);
    const active = [state.tyyppi, state.haku, state.vuosi].filter(Boolean).length;
    const types = facets.length > 1 && (
        <div className="pn-types" role="group" aria-label="Tyyppi">
            <button type="button" aria-pressed={!state.tyyppi} onClick={() => update({ tyyppi: null })}>
                Kaikki<small>{facets.reduce((n, [, c]) => n + c, 0)}</small>
            </button>
            {facets.map(([t, n]) => {
                const on = state.tyyppi === typeSlug(t);
                return (
                    <button key={t} type="button" aria-pressed={on} disabled={n === 0 && !on}
                        onClick={() => update({ tyyppi: on ? null : typeSlug(t) })}>
                        {typePlural(t)}<small>{n}</small>
                    </button>
                );
            })}
        </div>
    );
    const name = (
        <InputText value={state.haku} placeholder="Suodata nimellä…" aria-label="Suodata nimellä"
            onChange={e => update({ haku: e.target.value }, { replace: true })} />
    );
    const sort = (
        <Dropdown value={state.jarjestys} options={SORT_OPTIONS} optionLabel="label" optionValue="value" aria-label="Järjestys" ariaLabel="Järjestys"
            onChange={e => update({ jarjestys: e.value })} />
    );
    return (
        <div className="pn-toolbar">
            {types}
            <Button type="button" className="pn-filter-btn" outlined size="small" icon="pi pi-sliders-h"
                label={`Suodata ja järjestä${active ? ` (${active})` : ""}`} onClick={() => setSheet(true)} />
            <div className="pn-tool-r">
                {name}
                {sort}
                {showView && (
                    <SelectButton value={state.nakyma} options={VIEW_OPTIONS} allowEmpty={false} aria-label="Näkymä"
                        onChange={e => e.value && update({ nakyma: e.value })} />
                )}
            </div>
            <Sidebar visible={sheet} position="bottom" onHide={() => setSheet(false)} header="Suodata ja järjestä"
                className="h-auto">
                <div className="pn pn-sheet-body">{types}{name}{sort}</div>
            </Sidebar>
        </div>
    );
};

/** "Näytetään 7 / 30 · Romaanit × · 1984 × · Tyhjennä" when any filter is on. */
const ResultLine = ({ rows, shown, state, update, creditLabel }: { rows: ListRow[]; shown: number; state: ListState; update: Update; creditLabel?: string }) => {
    if (!state.tyyppi && !state.haku && !state.vuosi && !creditLabel) return null;
    const v = state.vuosi;
    const type = rows.find(r => typeSlug(r.type) === state.tyyppi)?.type;
    return (
        <p className="pn-result" role="status">
            <span>Näytetään {shown} / {rows.length}</span>
            {state.tyyppi && <button type="button" onClick={() => update({ tyyppi: null })} aria-label="Poista tyyppirajaus">{type ? typePlural(type) : state.tyyppi} ×</button>}
            {v && <button type="button" onClick={() => update({ vuosi: null })} aria-label="Poista vuosirajaus">{v.from === v.to ? v.from : `${v.from}–${v.to}`} ×</button>}
            {state.haku && <button type="button" onClick={() => update({ haku: "" })} aria-label="Poista nimirajaus">”{state.haku}” ×</button>}
            {creditLabel && <button type="button" onClick={() => update({ tekija: null })} aria-label="Poista tekijärajaus">{creditLabel} ×</button>}
            <button type="button" className="pn-clear" onClick={() => update({ tyyppi: null, haku: "", vuosi: null, tekija: null })}>Tyhjennä</button>
        </p>
    );
};

const Groups = <R extends ListRow>({ rows, state, render }: { rows: R[]; state: ListState; render: (r: R) => ReactNode }) => (
    <>{groupRows(sortRows(rows, state.jarjestys), state).map((g, i) => (
        <section key={g.label ?? i} aria-label={g.label ?? undefined}>
            {g.label && <h3 className="pn-group-h">{g.label}<small>{g.rows.length}</small></h3>}
            {g.rows.map(render)}
        </section>
    ))}</>
);

const sortedEditions = (eds: Edition[]) =>
    [...eds].sort((a, b) => (Number(a.pubyear) || 0) - (Number(b.pubyear) || 0) || a.id - b.id);

/** "WSOY 1976, 1984, Book Studio 1991": each year links to its printing, with the reader's own marks. */
const Printings = ({ editions }: { editions: Edition[] }) => {
    const sorted = sortedEditions(editions);
    return (
        <div className="pn-r-eds">
            {sorted.map((e, i) => {
                const publisher = e.publisher?.name ?? "";
                const newPublisher = i === 0 || sorted[i - 1].publisher?.name !== publisher;
                return (
                    <Fragment key={e.id}>
                        {i > 0 && ", "}
                        {newPublisher && publisher && `${publisher} `}
                        <Link to={`/editions/${e.id}`}>{e.pubyear || "?"}</Link>
                    </Fragment>
                );
            })}
        </div>
    );
};

type BookRow = ListRow & { entry: BookEntry };

const bookRow = (entry: BookEntry): BookRow => {
    const w = entry.work;
    const years = entry.editions.map(e => Number(e.pubyear)).filter(Boolean);
    return {
        id: w.id, title: w.title, origTitle: w.orig_title && w.orig_title !== w.title ? w.orig_title : "",
        origYear: w.pubyear || null, firstYear: years.length ? Math.min(...years) : null,
        type: w.work_type?.name ?? "", years, series: w.bookseries?.name ?? null, entry,
        ...(entry.credit ? { credit: entry.credit } : {}),
    };
};

const firstCover = (eds: Edition[]) => [...eds].sort((a, b) => a.id - b.id).flatMap(e => e.images ?? []).find(i => i.image_src);

/** Before the title: a star when the user owns a printing, a bookmark when one is on the wishlist; the years say which. */
const OwnMark = ({ editions, user }: { editions: Edition[]; user: User | null }) => {
    const owned = editions.filter(e => editionIsOwned(e, user));
    const wished = editions.filter(e => editionIsWishlisted(e, user));
    const years = (eds: Edition[]) => eds.map(e => e.pubyear).join(", ");
    if (owned.length) {
        const label = `Omistat: ${years(owned)}`;
        return <i className="pi pi-star-fill pn-mark" role="img" aria-label={label} title={label} />;
    }
    if (wished.length) {
        const label = `Muistilistalla: ${years(wished)}`;
        return <i className="pi pi-bookmark-fill pn-mark pn-wish" role="img" aria-label={label} title={label} />;
    }
    return null;
};

const BookRowView = ({ row, user, onEditWork }: { row: BookRow; user: User | null; onEditWork?: (id: number) => void }) => {
    const { work: w, editions, role, asName, asId } = row.entry;
    const cover = firstCover(editions);
    return (
        <div className="pn-row">
            {cover ? <img className="pn-thumb" src={thumbUrl(cover)} alt="" loading="lazy" /> : <span className="pn-thumb pn-none" />}
            <div>
                <div className="pn-r-t">
                    <OwnMark editions={editions} user={user} />
                    <Link to={`/works/${w.id}`}>{w.title}</Link>
                    {onEditWork && (
                        <button type="button" className="pn-edit" aria-label={`Muokkaa teosta ${w.title}`} onClick={() => onEditWork(w.id)}>
                            <i className="pi pi-pencil" />
                        </button>
                    )}
                </div>
                <div className="pn-r-sub">
                    {role === "kirjoittaja" ? (
                        <>
                            {row.origTitle && <><i>{row.origTitle}</i> </>}{row.origYear}
                            {w.bookseries && <>, <Link to={`/bookseries/${w.bookseries.id}`}>{w.bookseries.name}{w.bookseriesnum ? ` ${w.bookseriesnum}` : ""}</Link></>}
                            {asName && <>, nimellä <Link to={`/people/${asId}`}>{asName}</Link></>}
                            <CoAuthors credit={row.entry.credit} />
                        </>
                    ) : (
                        <>{naturalName(w.author_str)}{row.origYear ? `, ${row.origYear}` : ""}</>
                    )}
                </div>
                {editions.length > 0 && <Printings editions={editions} />}
            </div>
            <div className="pn-r-right">
                <GenreDots genres={w.genres} />
                <span>{count(editions.length, "painos", "painosta")}</span>
            </div>
        </div>
    );
};

const CoverGrid = ({ rows }: { rows: BookRow[] }) => (
    <div className="pn-covers">
        {sortRows(rows, "alkuvuosi").map(r => {
            const cover = firstCover(r.entry.editions);
            return (
                <Link key={r.id} to={`/works/${r.id}`}>
                    {cover ? <img src={thumbUrl(cover)} alt="" loading="lazy" /> : <span className="pn-cloth" />}
                    {r.title}
                </Link>
            );
        })}
    </div>
);

type BookListProps = {
    groups: Record<RoleKey, BookEntry[]>; state: ListState; update: Update; user: User | null;
    onEditWork?: (id: number) => void; showView?: boolean;
    /** For the credit row (own name, pen names, collaborations). */
    person?: Person;
};

/** ", yhdessä Eija Lappalainen": the co-authors of a book or story written with others. */
const CoAuthors = ({ credit }: { credit?: Credit }) => credit && credit.coAuthors.length > 0 ? (
    <>, yhdessä {credit.coAuthors.map((c, i) => <Fragment key={c.id}>{i > 0 && " & "}<Link to={`/people/${c.id}`}>{c.name}</Link></Fragment>)}</>
) : null;

/**
 * "Tekijä: Kaikki 20 · Anne Leinonen 14 · Anne Leinonen & Eija Lappalainen 4 …": the person's own name, each pen name
 * and each collaboration, shown when there is more than one.
 */
const CreditRow = ({ facets, active, onPick }: { facets: CreditFacet[]; active: string | null; onPick: (key: string | null) => void }) => (
    <div className="pn-roles" role="group" aria-label="Tekijä">
        <span>Tekijä</span>
        <div className="pn-seg">
            <button type="button" aria-pressed={active === null} onClick={() => onPick(null)}>
                Kaikki<small>{facets.reduce((n, f) => n + f.count, 0)}</small>
            </button>
            {facets.map(f => (
                <button key={f.key} type="button" aria-pressed={active === f.key} onClick={() => onPick(active === f.key ? null : f.key)}>
                    {f.label}<small>{f.count}</small>
                </button>
            ))}
        </div>
    </div>
);

export const BookList = ({ groups, state, update, user, onEditWork, showView = true, person }: BookListProps) => {
    const roles = ROLE_TABS.filter(r => groups[r.key].length > 0);
    if (roles.length === 0) return null;
    const active = roles.find(r => r.key === state.rooli) ?? roles[0];
    const allRows = groups[active.key].map(bookRow);
    const credits = active.key === "kirjoittaja" && person ? creditFacets(allRows.flatMap(r => (r.credit ? [r.credit as Credit] : []))) : null;
    const credit = credits?.find(f => f.key === state.tekija) ?? null;
    const rows = credit ? byCredit(allRows as (BookRow & { credit?: Credit })[], credit.key) : allRows;
    const shown = filterRows(rows, state);
    return (
        <>
            {roles.length > 1 && (
                <RoleRow roles={roles.map(r => [r.key, r.label, groups[r.key].length])} active={active.key}
                    onPick={key => update({ rooli: key, tyyppi: null, haku: "", vuosi: null })} />
            )}
            {credits && <CreditRow facets={credits} active={credit?.key ?? null} onPick={key => update({ tekija: key })} />}
            {rows.length >= TOOLBAR_FROM && <Toolbar rows={rows} state={state} update={update} showView={showView} />}
            <ResultLine rows={allRows} shown={shown.length} state={state} update={update} creditLabel={credit?.label} />
            {showView && state.nakyma === "kannet"
                ? <CoverGrid rows={shown} />
                : <Groups rows={shown} state={state} render={r => <BookRowView key={r.id} row={r} user={user} onEditWork={onEditWork} />} />}
            {shown.length === 0 && <p className="pn-empty">Ei osumia näillä rajauksilla.</p>}
        </>
    );
};

const STORY_ROLES: { key: StoryRoleKey; label: string }[] = [
    { key: "kirjoittaja", label: "Kirjoittanut" }, { key: "toimittaja", label: "Toimittanut" }, { key: "kaantaja", label: "Kääntänyt" },
];

type StoryRow = ListRow & { story: Short };

/** Where a story or article was published: books and magazine issues. */
const publicationYears = (s: Short) => [
    ...(s.editions ?? []).map(e => Number(e.work?.pubyear ?? e.pubyear)),
    ...(s.issues ?? []).map(i => Number(i.year)),
].filter(Boolean);

const storyRow = (s: Short, credit?: Credit): StoryRow => {
    const years = publicationYears(s);
    const own = Number(s.pubyear) || null;
    return {
        ...(credit ? { credit } : {}),
        id: s.id, title: s.title, origTitle: s.orig_title && s.orig_title !== s.title ? s.orig_title : "",
        origYear: own, firstYear: years.length ? Math.min(...years) : own, type: s.type?.name ?? "Muu",
        years: years.length ? years : own ? [own] : [], series: null, story: s,
    };
};

const authorsOf = (s: Short) => (s.contributors ?? []).filter(c => c.role.id === 1)
    .map(c => c.person.alt_name || naturalName(c.person.name)).join(", ") || "anonyymi";

export const Published = ({ story }: { story: Short }) => {
    const works = new Map<number, Work>();
    for (const e of story.editions ?? []) if (e.work) works.set(e.work.id, e.work as Work);
    const items = [
        ...[...works.values()].map(w => <Link key={`w${w.id}`} to={`/works/${w.id}`}>{w.title}{w.pubyear ? ` (${w.pubyear})` : ""}</Link>),
        ...(story.issues ?? []).map(i => <Link key={`i${i.id}`} to={`/issues/${i.id}`}>{`${i.magazine?.name ?? ""} ${i.cover_number ?? ""}`.trim()}</Link>),
    ];
    if (items.length === 0) return null;
    return <div className="pn-r-eds">{items.map((x, i) => <Fragment key={i}>{i > 0 && ", "}{x}</Fragment>)}</div>;
};

const StoryRowView = ({ row, role }: { row: StoryRow; role: StoryRoleKey }) => {
    const credit = row.credit as Credit | undefined;
    return (
    <div className="pn-row pn-text">
        <div>
            <div className="pn-r-t"><Link to={`/shorts/${row.id}`}>{row.title}</Link></div>
            <div className="pn-r-sub">
                {role === "kirjoittaja"
                    ? <>{row.origTitle && <><i>{row.origTitle}</i> </>}{row.origYear}{credit?.penName && <>, nimellä {credit.penName}</>}<CoAuthors credit={credit} /></>
                    : <>{authorsOf(row.story)}{row.origYear ? `, ${row.origYear}` : ""}</>}
            </div>
            <Published story={row.story} />
        </div>
        <div className="pn-r-right"><span>{row.type}</span></div>
    </div>
    );
};

export const StoryList = ({ groups, state, update, person }: { groups: Record<StoryRoleKey, Short[]>; state: ListState; update: Update; person?: Person }) => {
    const roles = STORY_ROLES.filter(r => groups[r.key].length > 0);
    if (roles.length === 0) return null;
    const active = roles.find(r => r.key === state.rooli) ?? roles[0];
    const written = active.key === "kirjoittaja" && person;
    const allRows = groups[active.key].map(s => storyRow(s, written ? writerCredit(s.contributors, person) : undefined));
    const credits = written ? creditFacets(allRows.flatMap(r => (r.credit ? [r.credit as Credit] : []))) : null;
    const credit = credits?.find(f => f.key === state.tekija) ?? null;
    const rows = credit ? byCredit(allRows as (StoryRow & { credit?: Credit })[], credit.key) : allRows;
    const shown = filterRows(rows, state);
    return (
        <>
            {roles.length > 1 && (
                <RoleRow roles={roles.map(r => [r.key, r.label, groups[r.key].length])} active={active.key}
                    onPick={key => update({ rooli: key, tyyppi: null, haku: "", vuosi: null })} />
            )}
            {credits && <CreditRow facets={credits} active={credit?.key ?? null} onPick={key => update({ tekija: key })} />}
            {rows.length >= TOOLBAR_FROM && <Toolbar rows={rows} state={state} update={update} showView={false} />}
            <ResultLine rows={allRows} shown={shown.length} state={state} update={update} creditLabel={credit?.label} />
            <Groups rows={shown} state={state} render={r => <StoryRowView key={r.id} row={r} role={active.key} />} />
            {shown.length === 0 && <p className="pn-empty">Ei osumia näillä rajauksilla.</p>}
        </>
    );
};

/** Henkilöstä: books and articles the person appears in or that are about them, books first. */
export const AboutList = ({ name, books, articles }: { name: string; books: Work[]; articles: Short[] }) => (
    <>
        <p className="pn-about-intro">Kirjat ja artikkelit, joissa {name} esiintyy tai joiden aiheena hän on.</p>
        {books.length > 0 && (
            <section aria-label="Kirjat">
                <h3 className="pn-group-h">Kirjat<small>{books.length}</small></h3>
                {books.map(w => (
                    <div className="pn-row pn-text" key={w.id}>
                        <div>
                            <div className="pn-r-t"><Link to={`/works/${w.id}`}>{w.title}</Link></div>
                            <div className="pn-r-sub">{naturalName(w.author_str)}{w.pubyear ? `, ${w.pubyear}` : ""}</div>
                        </div>
                    </div>
                ))}
            </section>
        )}
        {articles.length > 0 && (
            <section aria-label="Artikkelit">
                <h3 className="pn-group-h">Artikkelit<small>{articles.length}</small></h3>
                {articles.map(s => (
                    <div className="pn-row pn-text" key={s.id}>
                        <div>
                            <div className="pn-r-t"><Link to={`/shorts/${s.id}`}>{s.title}</Link></div>
                            <div className="pn-r-sub">{authorsOf(s)}{storyYear(s) ? `, ${storyYear(s)}` : ""}</div>
                            <Published story={s} />
                        </div>
                    </div>
                ))}
            </section>
        )}
    </>
);

/** Palkinnot: the person's own awards and those for their books and stories, by year. */
export const AwardRows = ({ awards }: { awards: Awarded[] }) => (
    <>{[...awards].sort((a, b) => a.year - b.year || a.award.name.localeCompare(b.award.name, "fi")).map(a => (
        <div className="pn-row pn-text" key={a.id}>
            <div>
                <div className="pn-r-t"><Link to={`/awards/${a.award.id}`}>{a.award.name}</Link> {a.year}</div>
                <div className="pn-r-sub">
                    {a.category?.name}
                    {a.work && <>: <Link to={`/works/${a.work.id}`}>{a.work.title}</Link></>}
                    {!a.work && a.story && <>: <Link to={`/shorts/${a.story.id}`}>{a.story.title}</Link></>}
                </div>
            </div>
        </div>
    ))}</>
);
