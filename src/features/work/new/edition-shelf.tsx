import { useEffect, useRef, useState } from "react";

import { Edition } from "@features/edition";
import { Laitos, Spine, spineSizes } from "../utils/work-facts";

// Space the shelf takes besides the spines: the gap after each spine, each board's padding and the gap between boards.
const SPINE_GAP = 2, BOARD_PADDING = 12, BOARD_GAP = 26;
// Never smaller than this: below it the shelf scrolls sideways instead (phones, long runs of thick books).
const MIN_SCALE = 0.45;

const imageUrl = (src: string) => (src.startsWith("http") ? src : `${import.meta.env.VITE_IMAGE_URL}${src}`);

interface Props {
    editions: Edition[];
    laitos: Laitos[];
    picked: number | null;
    onPick: (id: number) => void;
    /** Hover and keyboard focus preview the printing's row. */
    onPreview: (id: number | null) => void;
}

/**
 * The shelf: one spine per printing, grouped by laitos, drawn to scale from the data.
 * The spine face is a slice of that printing's own cover. Left out when there is
 * nothing to compare (work-facts spineSizes).
 */
export const EditionShelf = ({ editions, laitos, picked, onPick, onPreview }: Props) => {
    const shelf = spineSizes(editions);
    const ref = useRef<HTMLDivElement>(null);
    const [available, setAvailable] = useState<number | null>(null);
    // A board is never narrower than its label ("3. laitos 1 painos"), so the labels are measured too.
    const [labels, setLabels] = useState<number[]>([]);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new ResizeObserver(([entry]) => {
            setAvailable(entry.contentRect.width);
            setLabels([...el.querySelectorAll<HTMLElement>(".wn-slabel")].map(l => l.getBoundingClientRect().width));
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, [shelf !== null]); // eslint-disable-line react-hooks/exhaustive-deps
    if (!shelf) return null;
    // One scale for the whole shelf, so every book keeps its proportions: the largest at which all boards fit the page.
    const boards = laitos.map(l => l.editions.reduce((n, e) => n + shelf.spines.get(e.id)!.width, 0));
    const fits = (scale: number) => available === null || laitos.reduce((n, l, i) =>
        n + Math.max(boards[i] * scale + l.editions.length * SPINE_GAP + BOARD_PADDING, labels[i] ?? 0), 0)
        + BOARD_GAP * (laitos.length - 1) + 4 <= available;
    let scale = 1;
    while (scale > MIN_SCALE && !fits(scale)) scale = Math.round((scale - 0.01) * 100) / 100;
    const spine = (e: Edition, s: Spine) => {
        const cover = e.images?.[0];
        return (
            <button key={e.id} type="button" data-edition={e.id}
                className={`wn-spine${picked === e.id ? " wn-on" : ""}${s.estHeight || s.estWidth ? " wn-est" : ""}`}
                style={{ width: s.width * scale, height: s.height * scale, backgroundImage: cover ? `url("${imageUrl(cover.image_src)}")` : undefined }}
                aria-label={s.name} title={s.name} aria-pressed={picked === e.id}
                onClick={() => onPick(e.id)}
                onMouseEnter={() => onPreview(e.id)} onMouseLeave={() => onPreview(null)}
                onFocus={() => onPreview(e.id)} onBlur={() => onPreview(null)}>
                {s.estHeight && <span className="wn-fade" aria-hidden="true" />}
                <span className="wn-sticker" aria-hidden="true">{e.pubyear}</span>
            </button>
        );
    };
    return (
        <div>
            <div className="wn-shelf" role="group" aria-label="Painokset hyllyssä" ref={ref}>
                {laitos.map(l => (
                    <div className="wn-sgroup" key={l.version}>
                        <div className="wn-spines">{l.editions.map(e => spine(e, shelf.spines.get(e.id)!))}</div>
                        <div className="wn-slabel">{l.version}. laitos<span>{l.editions.length} {l.editions.length === 1 ? "painos" : "painosta"}</span></div>
                    </div>
                ))}
            </div>
            <p className="wn-shelf-note">{shelf.note} Valitse kirja nähdäksesi sen kannen ja rivin taulukossa.</p>
        </div>
    );
};
