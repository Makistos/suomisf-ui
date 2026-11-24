import { useLayoutEffect, useMemo, useRef, useState } from "react";

import type { Person } from "../types";
import { binYears, editionsByYear } from "../utils/person-facts";
import type { YearRange } from "../utils/list-state";

/** Shown from this many printings up; below it the list says enough (agreed "Missing data" rule). */
export const TIMELINE_FROM = 5;

type Props = { person: Person; selected: YearRange | null; onSelect: (range: YearRange | null) => void };

const printings = (n: number) => `${n} ${n === 1 ? "painos" : "painosta"}`;

/**
 * "Painokset vuosittain": bar height = the person's book printings that year in
 * any production role, solid = first printings, hatched = reprints and new
 * versions. Told apart by fill, not colour; every bar is a button that filters
 * the list to its year (or years).
 */
export const PublicationTimeline = ({ person, selected, onSelect }: Props) => {
    const byYear = useMemo(() => editionsByYear(person), [person]);
    const barsRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(700);

    useLayoutEffect(() => {
        const el = barsRef.current;
        if (!el) return;
        const measure = () => { if (el.clientWidth) setWidth(el.clientWidth); };
        measure();
        if (typeof ResizeObserver === "undefined") return;
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const years = Object.keys(byYear).map(Number);
    const total = years.reduce((n, y) => n + byYear[y].all, 0);
    if (total < TIMELINE_FROM) return null;
    const first = years.reduce((n, y) => n + byYear[y].first, 0);
    const { bin, bins, max, step } = binYears(byYear, width);

    return (
        <section className="pn-tl" aria-labelledby="pn-tl-h">
            <div className="pn-tl-head">
                <div>
                    <h2 id="pn-tl-h">Painokset vuosittain {Math.min(...years)}–{Math.max(...years)}</h2>
                    <p>
                        {printings(total)}, joista {first} ensipainosta.
                        {bin > 1 && ` Yksi pylväs = ${bin} vuotta.`} Valitse vuosi suodattaaksesi listan.
                    </p>
                </div>
                <div className="pn-legend">
                    <span><i className="pn-first" />Ensipainos</span>
                    <span><i className="pn-re" />Uusintapainos tai uusi laitos</span>
                    <span>Korkein pylväs {max}</span>
                </div>
            </div>
            <div className="pn-bars" ref={barsRef} role="group" aria-label="Painokset vuosittain">
                {bins.map(b => {
                    const label = b.from === b.to ? `${b.from}` : `${b.from}–${b.to}`;
                    const on = !!selected && selected.from === b.from && selected.to === b.to;
                    return (
                        <button key={b.from} type="button" className={`pn-bar${on ? " pn-sel" : ""}`} aria-pressed={on}
                            disabled={b.all === 0}
                            aria-label={`${label}: ${printings(b.all)}, joista ${b.first} ensipainosta`}
                            title={`${label}: ${printings(b.all)}, joista ${b.first} ensipainosta`}
                            onClick={() => onSelect(on ? null : { from: b.from, to: b.to })}>
                            {b.all > 0 && <>
                                <span className="pn-first" style={{ height: `${(b.first / max) * 100}%` }} />
                                <span className="pn-re" style={{ height: `${((b.all - b.first) / max) * 100}%` }} />
                            </>}
                        </button>
                    );
                })}
            </div>
            <div className="pn-axis" aria-hidden="true">
                {bins.map(b => <span key={b.from}>{b.from % step === 0 ? b.from : ""}</span>)}
            </div>
        </section>
    );
};
