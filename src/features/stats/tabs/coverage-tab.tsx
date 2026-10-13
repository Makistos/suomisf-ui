// How complete the bibliography's data is: meters for each detail of
// editions, works, people and short stories.

import { ProgressSpinner } from 'primereact/progressspinner';
import { Coverage, Meter, StatCard, useStatsQuery } from '../charts';

const fmt = (n: number) => n.toLocaleString('fi-FI');

interface MeterRow {
    label: string;
    part: number;
    // Defaults to the card's total.
    whole?: number;
    note?: string;
}

const CoverageCard = ({ title, total, unit, rows }: {
    title: string;
    total: number;
    // Partitive plural for the note: "painoksesta", "teoksesta"…
    unit: string;
    rows: MeterRow[];
}) => (
    <StatCard title={title} subtitle={`Yhteensä ${fmt(total)}.`}>
        <div className="flex flex-column gap-3">
            {rows.map(r => (
                <Meter key={r.label} label={r.label} part={r.part} whole={r.whole ?? total}
                    note={r.note ?? `${fmt(r.part)} / ${fmt(r.whole ?? total)} ${unit}`} />
            ))}
        </div>
    </StatCard>
);

export const CoverageTab = () => {
    const data = useStatsQuery<Coverage>('stats/coverage');
    if (!data.data) {
        return <div className="flex justify-content-center p-4"><ProgressSpinner /></div>;
    }
    const { editions: e, works: w, people: p, stories: s } = data.data;

    return (
        <>
            <p className="mt-0">
                Kuinka suuresta osasta tietueita kukin tieto on tallennettu.
            </p>
            <div className="grid">
                <div className="col-12 lg:col-6">
                    <CoverageCard title="Painokset" total={e.total} unit="painoksesta" rows={[
                        { label: 'Kansikuva', part: e.image },
                        { label: 'Sivumäärä', part: e.pages },
                        { label: 'ISBN', part: e.isbn },
                        { label: 'Korkeus', part: e.size },
                        { label: 'Sidosasu', part: e.binding },
                        { label: 'Tarkistettu', part: e.verified },
                    ]} />
                </div>
                <div className="col-12 lg:col-6">
                    <CoverageCard title="Teokset" total={w.total} unit="teoksesta" rows={[
                        { label: 'Genre', part: w.genre },
                        { label: 'Alkuperäinen julkaisuvuosi', part: w.orig_year },
                        { label: 'Alkukieli', part: w.language },
                        { label: 'Kuvaus', part: w.description },
                        { label: 'Asiasanat', part: w.tags },
                        { label: 'Kääntäjä (käännösteokset)', part: w.translator, whole: w.translated_works,
                            note: `${fmt(w.translator)} / ${fmt(w.translated_works)} käännösteoksesta` },
                    ]} />
                </div>
                <div className="col-12 lg:col-6">
                    <CoverageCard title="Henkilöt" total={p.total} unit="henkilöstä" rows={[
                        { label: 'Kansallisuus', part: p.nationality },
                        { label: 'Syntymävuosi', part: p.birth_year },
                        { label: 'Kuva', part: p.image },
                        { label: 'Elämäkerta', part: p.bio },
                    ]} />
                </div>
                <div className="col-12 lg:col-6">
                    <CoverageCard title="Novellit" total={s.total} unit="novellista" rows={[
                        { label: 'Alkuperäinen julkaisuvuosi', part: s.year },
                        { label: 'Alkukieli', part: s.language },
                    ]} />
                </div>
            </div>
        </>
    );
};
