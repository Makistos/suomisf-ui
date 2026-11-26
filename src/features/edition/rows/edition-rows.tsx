import "./edition-rows.css";

import { Fragment, useState } from "react";
import { Link } from "react-router-dom";

import { getGenreColors } from "@features/genre/utils/genre-colors";
import { thumbUrl } from "@utils/cover-url";
import { coverTiles, EditionRow, isForeign, printingNote, yearGroups } from "./edition-rows-utils";

type PersonBrief = EditionRow["translators"][number];
const personName = (p: PersonBrief) =>
    p.alt_name || (p.name.includes(", ") ? p.name.split(", ").reverse().join(" ") : p.name);
/** "Le Guin, Ursula K. & Halme, Jukka (toim.)" → "Ursula K. Le Guin & Jukka Halme (toim.)" */
const naturalAuthors = (s: string | null | undefined) => {
    if (!s) return "";
    const editor = /\s*\(toim\.\)$/.test(s);
    return s.replace(/\s*\(toim\.\)$/, "").split(" & ").map(p => (p.includes(", ") ? p.split(", ").reverse().join(" ") : p)).join(" & ")
        + (editor ? " (toim.)" : "");
};
const n = (v: number) => v.toLocaleString("fi-FI").replace(/\s/g, " ");

const People = ({ people, sep = " & " }: { people: PersonBrief[]; sep?: string }) => (
    <>{people.map((p, i) => <Fragment key={p.id}>{i > 0 && sep}<Link to={`/people/${p.id}`}>{personName(p)}</Link></Fragment>)}</>
);

const Mark = ({ e }: { e: EditionRow }) => (
    e.owned ? <i className="pi pi-star-fill er-mark" role="img" aria-label="Omistat tämän painoksen" title="Omistat tämän painoksen" />
        : e.wishlisted ? <i className="pi pi-bookmark-fill er-mark er-wish" role="img" aria-label="Muistilistallasi" title="Muistilistallasi" />
            : null
);

/**
 * One printing, as the old edition lines read but linked (owner, 2026-11-26):
 * "Isaac Asimov: Säätiö (Foundation, 1951). 2. painos. Suom. Tuulikki Lahti. Sci-fi -sarja 12." and genres on the right.
 */
const Row = ({ e, showYear }: { e: EditionRow; showYear: boolean }) => {
    const w = e.work;
    const note = printingNote(e);
    const editor = /\(toim\.\)/.test(w?.author_str ?? "");
    // a few printings have an empty title in the data: the work's title then, never a blank row
    const title = e.title?.trim() || w?.title || "Nimetön";
    return (
        <li className="er-row">
            <p className="er-line">
                <Mark e={e} />
                {w && (w.authors.length > 0 || w.author_str) && (
                    <><span className="er-a">{w.authors.length > 0 && !editor ? <People people={w.authors} /> : naturalAuthors(w.author_str)}</span>: </>
                )}
                <Link className="er-t" to={`/editions/${e.id}`}>{title}</Link>
                {e.subtitle && <span className="er-sub"> {e.subtitle}</span>}
                {w && isForeign(e) && <span className="er-orig"> (<i>{w.orig_title}</i>{w.pubyear ? `, ${w.pubyear}` : ""})</span>}
                {". "}
                {note && <span className="er-note">{note}. </span>}
                {e.translators.length > 0 && <span className="er-tr">Suom. <People people={e.translators} sep=", " />. </span>}
                {e.pubseries && <span className="er-ser"><Link to={`/pubseries/${e.pubseries.id}`}>{e.pubseries.name}</Link>{e.pubseriesnum ? ` ${e.pubseriesnum}` : ""}. </span>}
                {showYear && <span className="er-y">{e.pubyear ?? "?"}.</span>}
            </p>
            <span className="er-genres">{(w?.genres ?? []).map(g => (
                <span className="er-gdot" key={g.abbr}><i style={{ background: getGenreColors([g.abbr])[0] ?? "#6C757D" }} />{g.name}</span>
            ))}</span>
        </li>
    );
};

/** A cover, or a plain cloth binding when there is none or it fails to load (as on the other identity pages). */
const Cover = ({ e }: { e: EditionRow }) => {
    const [failed, setFailed] = useState<string | null>(null);
    const src = e.cover ? thumbUrl({ image_src: e.cover.image_src, thumb_src: e.cover.thumb_src ?? undefined }) : null;
    if (!src || failed === src) return <span className="er-cloth" aria-hidden="true" />;
    return <img src={src} alt="" loading="lazy" onError={() => setFailed(src)} />;
};

interface Props {
    editions: EditionRow[];
    /** Year headings ("1976 · 42 painosta") when the list is sorted by year; otherwise the year ends each row. */
    byYear: boolean;
    /** The same printings as a cover grid (the "Kannet" button). */
    covers?: boolean;
}

/** "28 painosta, 1985–2012" under a cover several printings share; the year under a cover of its own. */
const tileYears = (t: ReturnType<typeof coverTiles>[number]) => {
    const years = t.first === null ? "" : t.first === t.last ? String(t.first) : `${t.first}–${t.last}`;
    return t.count > 1 ? `${n(t.count)} painosta${years ? `, ${years}` : ""}` : years;
};

/**
 * A list of printings, one a row, text first; or their covers, each cover file once (owner, 2026-11-26: many reprints share a
 * scan). Identity style, tokens of its own so any page can use it.
 */
export const EditionRows = ({ editions, byYear, covers = false }: Props) => {
    if (covers) {
        // no year headings here: a shared cover spans years, which its caption gives instead
        return (
            <div className="er">
                <ul className="er-covers">
                    {coverTiles(editions).map(t => (
                        <li key={t.edition.id}>
                            <Link to={`/editions/${t.edition.id}`}><Cover e={t.edition} /><span className="er-ct">{t.edition.title?.trim() || t.edition.work?.title || "Nimetön"}</span></Link>
                            <span className="er-ca">{naturalAuthors(t.edition.work?.author_str)}</span>
                            {tileYears(t) && <span className="er-ca er-cy">{tileYears(t)}</span>}
                        </li>
                    ))}
                </ul>
            </div>
        );
    }
    const groups = byYear ? yearGroups(editions) : [{ key: "all", year: null, rows: editions }];
    return (
        <div className="er">
            {groups.map(g => (
                <section key={g.key} aria-label={byYear ? String(g.year ?? "Vuosi ei tiedossa") : undefined}>
                    {byYear && <h3 className="er-year">{g.year ?? "Vuosi ei tiedossa"}<small>{n(g.rows.length)} {g.rows.length === 1 ? "painos" : "painosta"}</small></h3>}
                    <ul className="er-rows">{g.rows.map(e => <Row key={e.id} e={e} showYear={!byYear} />)}</ul>
                </section>
            ))}
        </div>
    );
};
