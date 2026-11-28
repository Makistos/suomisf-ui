import { Fragment, ReactNode } from "react";
import { Link } from "react-router-dom";

import { getGenreColors } from "@features/genre/utils/genre-colors";
import { printingLabel, printingLines } from "./bookindex-state";

// The agreed book-list row (owner, 2026-11-26), shared by every page that lists works: the book index, /nonfiction, tag pages.

export type PersonBrief = { id: number; name: string; alt_name: string | null };
type Named = { id: number; name: string };
export interface IndexEdition {
    id: number; title: string; pubyear: number | null; editionnum: number | null; version: number | null;
    translators: PersonBrief[]; publisher: Named | null; pubseries: Named | null; owned: boolean; wishlisted: boolean;
}
export interface IndexRow {
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
    /** with a tag's similar tags (tag page): which of them the work has, the tag first */
    matched_tags?: { id: number; name: string }[];
}
export interface IndexPage { total: number; page: number; rows: number; works: IndexRow[] }

export const personName = (p: PersonBrief) =>
    p.alt_name || (p.name.includes(", ") ? p.name.split(", ").reverse().join(" ") : p.name);
/** "Le Guin, Ursula K. & Halme, Jukka (toim.)" → "Ursula K. Le Guin & Jukka Halme (toim.)" */
export const naturalAuthors = (s: string | null) => {
    if (!s) return "";
    const editor = /\s*\(toim\.\)$/.test(s);
    return s.replace(/\s*\(toim\.\)$/, "").split(" & ").map(p => (p.includes(", ") ? p.split(", ").reverse().join(" ") : p)).join(" & ")
        + (editor ? " (toim.)" : "");
};

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
export const WorkRow = ({ w, showAuthor, note }: { w: IndexRow; showAuthor: boolean; note?: ReactNode }) => {
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
                {note}
            </div>
            <span className="bn-genres">{w.genres.map(g => (
                <span className="bn-gdot" key={g.abbr}><i style={{ background: getGenreColors([g.abbr])[0] ?? "#6C757D" }} />{g.name}</span>
            ))}</span>
        </li>
    );
};

