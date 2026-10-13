import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProgressSpinner } from 'primereact/progressspinner';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import {
    Drilldown, EditionsPerWork, GENRE_NAMES, Histogram, HistogramBin, RankedBarChart,
    Retranslations, StatCard, StatTiles, WorkListEntry, WorksDrilldownDialog, YearColumnsChart,
    useChartTheme, useGenreIds, useStatsQuery, yearBounds,
} from '../charts';

const fmt = (n: number) => n.toLocaleString('fi-FI');

const Loading = () => <div className="flex justify-content-center p-4"><ProgressSpinner /></div>;

// Title linking to the work, with author and original year under it.
export const WorkCell = ({ work }: { work: WorkListEntry }) => (
    <div>
        <Link to={`/works/${work.work_id}`}>{work.title}</Link>
        <div className="text-sm text-color-secondary">
            {[work.author, work.year].filter(Boolean).join(', ')}
        </div>
    </div>
);

export const ContentTab = () => {
    const genreCounts = useStatsQuery<Record<string, number>>('stats/genrecounts');
    const genreIds = useGenreIds();
    const [drilldown, setDrilldown] = useState<Drilldown | null>(null);

    if (!genreCounts.data) return <Loading />;
    const items = Object.entries(GENRE_NAMES).map(([abbr, label]) => ({
        id: genreIds.get(abbr) ?? -1,
        label,
        count: genreCounts.data[abbr] ?? 0,
    }));

    return (
        <div className="grid">
            <div className="col-12 lg:col-6">
                <StatCard title="Teokset genreittäin"
                    subtitle="Teoksia. Teos lasketaan jokaiseen genreensä, joten luvut menevät osin päällekkäin.">
                    <RankedBarChart
                        items={items}
                        topN={items.length}
                        showOthers={false}
                        unit="teosta"
                        itemHeader="Genre"
                        ariaLabel="Teokset genreittäin"
                        onSelect={(item) => {
                            if (item.id === null || item.id < 0) return;
                            setDrilldown({
                                title: `${item.label} (${item.count.toLocaleString('fi-FI')})`,
                                params: new URLSearchParams({ genre: String(item.id) }),
                            });
                        }}
                    />
                </StatCard>
            </div>
            <EditionsPerWorkCards />
            <RetranslationsCards />
            <WorksDrilldownDialog drilldown={drilldown} onHide={() => setDrilldown(null)} />
        </div>
    );
};

// Editions per work: 1–9 one by one, then 10–19 and 20+.
const editionBins = (histogram: EditionsPerWork['histogram']): HistogramBin[] => {
    const bins = [
        ...Array.from({ length: 9 }, (_, i) => ({ min: i + 1, max: i + 1, label: String(i + 1) })),
        { min: 10, max: 19, label: '10–19' },
        { min: 20, max: Infinity, label: '20+' },
    ];
    return bins.map((b, i) => ({
        key: i,
        label: b.label,
        count: histogram.reduce((sum, h) => h.editions >= b.min && h.editions <= b.max ? sum + h.works : sum, 0),
    }));
};

const EditionsPerWorkCards = () => {
    const data = useStatsQuery<EditionsPerWork>('stats/editionsperwork');
    const bins = useMemo(() => editionBins(data.data?.histogram ?? []), [data.data]);
    const works = data.data?.histogram.reduce((sum, h) => sum + h.works, 0) ?? 0;
    const reprinted = works - (data.data?.histogram.find(h => h.editions === 1)?.works ?? 0);

    return (
        <>
            <div className="col-12 lg:col-6">
                <StatCard title="Painoksia teosta kohden"
                    subtitle={data.data
                        ? `Teoksia painosmäärän mukaan; kaikki laitokset ja painokset lasketaan. ${fmt(reprinted)} teosta ${fmt(works)}:sta on painettu useammin kuin kerran.`
                        : 'Teoksia painosmäärän mukaan; kaikki laitokset ja painokset lasketaan.'}>
                    {!data.data ? <Loading /> : (
                        <Histogram bins={bins} unit="teosta" binTitle="Painoksia" axisTitle="Teoksia"
                            ariaLabel="Teokset painosmäärän mukaan" />
                    )}
                </StatCard>
            </div>
            <div className="col-12 lg:col-6">
                <StatCard title="Eniten painetut" subtitle="Teokset, joista on eniten painoksia.">
                    {!data.data ? <Loading /> : (
                        <DataTable value={data.data.top} size="small" stripedRows dataKey="work_id">
                            <Column header="#" body={(_r, opts) => opts.rowIndex + 1} style={{ width: '3rem' }} />
                            <Column header="Teos" body={(r: WorkListEntry) => <WorkCell work={r} />} />
                            <Column field="editions" header="Painoksia" style={{ textAlign: 'right', width: '7rem' }} />
                        </DataTable>
                    )}
                </StatCard>
            </div>
        </>
    );
};

const RetranslationsCards = () => {
    const theme = useChartTheme();
    const data = useStatsQuery<Retranslations>('stats/retranslations');
    const rows = useMemo(() => (data.data?.by_year ?? []).map(d => ({
        year: d.year, count: d.count, group_id: null, group_name: null,
    })), [data.data]);
    const range = useMemo(() => {
        const b = yearBounds(rows);
        return { start: b.min, end: b.max, decades: true };
    }, [rows]);
    const d = data.data;
    const share = d?.translated_works ? d.retranslated_works / d.translated_works * 100 : 0;

    return (
        <>
            <div className="col-12 lg:col-6">
                <StatCard title="Uudelleensuomennokset"
                    subtitle="Teoksen painokset ryhmitellään suomennoksiksi kääntäjien mukaan: painokset, joilla on yhteinen kääntäjä, ovat samaa suomennosta. Teos on suomennettu uudelleen, jos sillä on kaksi tai useampia suomennoksia.">
                    {!d ? <Loading /> : (
                        <>
                            <StatTiles tiles={[
                                { label: 'Uudelleen suomennettuja teoksia', value: d.retranslated_works,
                                    note: `${share.toLocaleString('fi-FI', { maximumFractionDigits: 1 })} % teoksista, joiden kääntäjä tiedetään` },
                                { label: 'Uusia suomennoksia', value: rows.reduce((sum, r) => sum + r.count, 0),
                                    note: 'teoksen toinen tai myöhempi suomennos' },
                            ]} columnClass="col-6" />
                            <h4 className="mb-2">Uudet suomennokset vuosikymmenittäin</h4>
                            <YearColumnsChart
                                rows={rows}
                                range={range}
                                series={[{ key: '*', label: 'Uudet suomennokset', color: theme.series[0], id: null }]}
                                showOthers={false}
                                othersColor={theme.other}
                                unit="suomennosta"
                                axisTitle="Suomennoksia"
                                ariaLabel="Uudet suomennokset vuosikymmenittäin"
                            />
                        </>
                    )}
                </StatCard>
            </div>
            <div className="col-12">
                <StatCard title="Uudelleen suomennetut teokset"
                    subtitle="Eniten suomennetut ensin. Kunkin suomennoksen ensimmäisen painoksen vuosi ja kääntäjät.">
                    {!d ? <Loading /> : (
                        <DataTable value={d.works} size="small" stripedRows dataKey="work_id"
                            paginator rows={10} rowsPerPageOptions={[10, 25, 50]}>
                            <Column header="Teos" body={(r: WorkListEntry) => <WorkCell work={r} />} />
                            <Column header="Suomennokset" body={(r: Retranslations['works'][number]) => (
                                <ul className="m-0 pl-3">
                                    {r.translations.map((t, i) => (
                                        <li key={i}>{t.year}: {t.translators.join(', ')}</li>
                                    ))}
                                </ul>
                            )} />
                        </DataTable>
                    )}
                </StatCard>
            </div>
        </>
    );
};
