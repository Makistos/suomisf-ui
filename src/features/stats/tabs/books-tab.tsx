// Books as objects: page counts, heights and bindings of every printing.

import { useMemo, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { SelectButton } from 'primereact/selectbutton';
import { ProgressSpinner } from 'primereact/progressspinner';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import {
    BindingYearCount, DEFAULT_START_YEAR, FilterBar, Histogram, HistogramBin, MedianBandLine,
    PageHistogram, QuartilePoint, QuartileYear, Series, SizeCount, StatCard, YearColumnsChart,
    YearRange, YearRangeFilter, bucketLabel, bucketsIn, fromBindings, genreOptions, statsParams,
    useChartTheme, useStatsQuery, yearBounds,
} from '../charts';
import { WorkCell } from './content-tab';

const fmt = (n: number) => n.toLocaleString('fi-FI');

const Loading = () => <div className="flex justify-content-center p-4"><ProgressSpinner /></div>;

// Page counts above this go into one "1 000+" bin.
const PAGE_LIMIT = 1000;
// Heights outside this range (cm) go into the end bins.
const SIZE_MIN = 15;
const SIZE_MAX = 30;

const pageBins = (data: PageHistogram): HistogramBin[] => {
    const bins = data.histogram
        .filter(h => h.pages < PAGE_LIMIT)
        .map(h => ({ key: h.pages, label: `${h.pages}–${h.pages + data.bucket - 1}`, count: h.count }));
    const over = data.histogram.filter(h => h.pages >= PAGE_LIMIT).reduce((sum, h) => sum + h.count, 0);
    return [...bins, { key: PAGE_LIMIT, label: `${fmt(PAGE_LIMIT)}+`, count: over }];
};

const sizeBins = (data: SizeCount[]): HistogramBin[] => {
    const sum = (f: (s: number) => boolean) => data.reduce((t, d) => f(d.size) ? t + d.count : t, 0);
    return [
        { key: 0, label: `alle ${SIZE_MIN}`, count: sum(s => s < SIZE_MIN) },
        ...Array.from({ length: SIZE_MAX - SIZE_MIN + 1 }, (_, i) => ({
            key: SIZE_MIN + i, label: String(SIZE_MIN + i), count: sum(s => s === SIZE_MIN + i),
        })),
        { key: 999, label: `yli ${SIZE_MAX}`, count: sum(s => s > SIZE_MAX) },
    ];
};

const shareOptions = [
    { label: 'Määrä', value: false },
    { label: 'Osuus', value: true },
];

export const BooksTab = () => {
    const theme = useChartTheme();
    const [genre, setGenre] = useState('all');
    const [range, setRange] = useState<YearRange | null>(null);
    const [bindingShare, setBindingShare] = useState(true);

    const bindings = useStatsQuery<BindingYearCount[]>(`stats/bindingsbyyear${statsParams({ genre })}`);
    const bounds = useMemo(() => yearBounds(bindings.data ?? []), [bindings.data]);
    const activeRange = useMemo((): YearRange => range ?? {
        start: Math.max(bounds.min, DEFAULT_START_YEAR), end: bounds.max, decades: false,
    }, [range, bounds]);
    const years = { genre, start: activeRange.start, end: activeRange.end };

    const pages = useStatsQuery<PageHistogram>(`stats/pagehistogram${statsParams(years)}`);
    const sizes = useStatsQuery<SizeCount[]>(`stats/sizehistogram${statsParams(years)}`);
    const pagesByYear = useStatsQuery<QuartileYear[]>(
        `stats/pagesbyyear${statsParams({ genre, by: activeRange.decades ? 'decade' : undefined })}`);

    const pagePoints = useMemo((): QuartilePoint[] => {
        const byYear = new Map((pagesByYear.data ?? []).map(d => [d.year, d]));
        return bucketsIn(activeRange).map(b => {
            const d = byYear.get(b);
            return { key: b, label: bucketLabel(b, activeRange.decades), count: d?.count ?? 0,
                q1: d?.q1 ?? 0, median: d?.median ?? 0, q3: d?.q3 ?? 0 };
        });
    }, [pagesByYear.data, activeRange]);

    const bindingSeries: Series[] = [
        { key: 'Nidottu', label: 'Nidottu', color: theme.series[0], id: null },
        { key: 'Sidottu', label: 'Sidottu', color: theme.series[1], id: null },
        { key: 'Ei tietoa/muu', label: 'Ei tietoa', color: theme.other, id: null },
    ];

    if (!bindings.data) return <Loading />;

    return (
        <>
            <p className="mt-0">
                Kaikki painokset lasketaan, myös uusintapainokset: kukin painos on oma kirjansa.
            </p>
            <FilterBar>
                <Dropdown aria-label="Genre" ariaLabel="Genre" value={genre} options={genreOptions} optionLabel="label" optionValue="value"
                    onChange={(e) => setGenre(e.value)} className="w-auto" />
                <YearRangeFilter value={activeRange} min={bounds.min} max={bounds.max} onChange={setRange} />
            </FilterBar>
            <div className="grid">
                <div className="col-12 lg:col-6">
                    <StatCard title="Sivumäärät"
                        subtitle={`Painoksia sivumäärän mukaan, ${pages.data?.bucket ?? 50} sivun välein.`}>
                        {!pages.data ? <Loading /> : (
                            <Histogram bins={pageBins(pages.data)} unit="painosta" binTitle="Sivuja"
                                axisTitle="Painoksia" ariaLabel="Painokset sivumäärän mukaan" />
                        )}
                    </StatCard>
                </div>
                <div className="col-12 lg:col-6">
                    <StatCard title="Korkeus" subtitle="Painoksia kirjan korkeuden mukaan, senttimetreinä.">
                        {!sizes.data ? <Loading /> : (
                            <Histogram bins={sizeBins(sizes.data)} unit="painosta" binTitle="Senttimetriä"
                                axisTitle="Painoksia" ariaLabel="Painokset korkeuden mukaan" />
                        )}
                    </StatCard>
                </div>
                <div className="col-12">
                    <StatCard title={activeRange.decades ? 'Sivumäärä vuosikymmenittäin' : 'Sivumäärä vuosittain'}
                        subtitle={`Painosten sivumäärän mediaani; varjostettu alue on keskimmäinen puolikas painoksista.${activeRange.decades ? '' : ' Vuodet, joilla on alle 5 painosta, jätetään pois.'}`}>
                        {!pagesByYear.data ? <Loading /> : (
                            <MedianBandLine points={pagePoints} valueUnit="sivua" countUnit="painosta"
                                countHeader="Painoksia" axisTitle="Sivuja"
                                labelHeader={activeRange.decades ? 'Vuosikymmen' : 'Vuosi'}
                                minCount={activeRange.decades ? 1 : 5}
                                ariaLabel="Painosten sivumäärän mediaani" />
                        )}
                    </StatCard>
                </div>
                <div className="col-12">
                    <StatCard title="Sidosasu"
                        subtitle="Painoksia sidosasun mukaan."
                        controls={
                            <SelectButton aria-label="Määrä vai osuus" value={bindingShare} options={shareOptions}
                                optionLabel="label" optionValue="value" allowEmpty={false}
                                onChange={(e) => setBindingShare(e.value)} />
                        }>
                        <YearColumnsChart
                            rows={fromBindings(bindings.data)}
                            range={activeRange}
                            series={bindingSeries}
                            showOthers={false}
                            othersColor={theme.other}
                            share={bindingShare}
                            unit="painosta"
                            axisTitle="Painoksia"
                            ariaLabel="Painokset sidosasun mukaan"
                        />
                    </StatCard>
                </div>
                <div className="col-12 lg:col-8">
                    <StatCard title="Paksuimmat" subtitle="Painokset, joissa on eniten sivuja.">
                        {!pages.data ? <Loading /> : (
                            <DataTable value={pages.data.thickest} size="small" stripedRows dataKey="edition_id">
                                <Column header="#" body={(_r, opts) => opts.rowIndex + 1} style={{ width: '3rem' }} />
                                <Column header="Painos" body={(r: PageHistogram['thickest'][number]) => (
                                    <WorkCell work={{ ...r, year: null }} />
                                )} />
                                <Column header="Vuosi" field="year" style={{ width: '5rem' }} />
                                <Column header="Sivuja" body={(r: { pages: number }) => fmt(r.pages)}
                                    style={{ textAlign: 'right', width: '6rem' }} />
                            </DataTable>
                        )}
                    </StatCard>
                </div>
            </div>
        </>
    );
};
