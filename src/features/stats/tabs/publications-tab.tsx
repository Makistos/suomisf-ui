import { useMemo, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { SelectButton } from 'primereact/selectbutton';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useQueries } from '@tanstack/react-query';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
    TooltipItem,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getApiContent } from '../../../services/user-service';
import { getCurrenUser } from '../../../services/auth-service';
import {
    COLOURED_LANGUAGES, DEFAULT_START_YEAR, Drilldown, FilterBar, GENRE_GROUPS, GENRE_NAMES,
    GroupYearCount, Heatmap, HeatmapRow, LANGUAGE_SLOTS, LanguageYearCount, MAX_SERIES, OTHERS_LABEL,
    PublisherYearCount, Series, StatCard, WorksDrilldownDialog, YearColumnsChart, YearRange,
    YearRangeFilter, axisColours, baseChartOptions, bucketLabel, bucketOf, bucketYears, bucketsIn,
    GenreYearCount, fromLanguages, fromPublishers, genreOptions, genreParam, groupTotals, useChartTheme,
    useGenreIds, useStatsQuery, yearBounds, yearSpanLabel, ChartTheme, DataView,
} from '../charts';

import { DomesticShareCard, EditionTypesCard, TranslationLagCards } from './edition-history-cards';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const fmt = (n: number) => n.toLocaleString('fi-FI');

const countShareOptions = [
    { label: 'Määrä', value: false },
    { label: 'Osuus', value: true },
];

// Languages with their own colour; everything else is "Muut".
const languageSeries = (theme: ChartTheme, rows: GroupYearCount[], selected: string[]): Series[] => {
    const ids = new Map(rows.map(r => [r.group_name, r.group_id]));
    return COLOURED_LANGUAGES
        .filter(l => selected.length === 0 || selected.includes(l))
        .map(l => ({ key: l, label: l, color: theme.series[LANGUAGE_SLOTS[l]], id: ids.get(l) ?? null }));
};

const languageOptions = [...COLOURED_LANGUAGES, OTHERS_LABEL].map(l => ({ label: l, value: l }));

// Publishers coloured by their all-time rank (all genres, all years), so
// changing the genre, years or selection never repaints a publisher. Picked
// publishers outside the top ranks take the free slots in picking order.
const publisherSeries = (theme: ChartTheme, ranking: string[], ids: Map<string, number | null>, selected: string[]): Series[] => {
    const names = selected.length ? selected : ranking.slice(0, MAX_SERIES);
    const used = new Set(names.map(n => ranking.indexOf(n)).filter(i => i >= 0 && i < MAX_SERIES));
    const free = Array.from({ length: MAX_SERIES }, (_, i) => i).filter(i => !used.has(i));
    return names.map(name => {
        const rank = ranking.indexOf(name);
        const slot = rank >= 0 && rank < MAX_SERIES ? rank : free.shift() ?? MAX_SERIES;
        return { key: name, label: name, color: theme.series[slot], id: ids.get(name) ?? null };
    });
};

// Year rows filtered to a range, for groupTotals over the visible years.
const inRange = (rows: GroupYearCount[], range: YearRange) =>
    rows.filter(r => r.year >= range.start && r.year <= range.end);

export const PublicationsTab = () => {
    const theme = useChartTheme();
    const genreIds = useGenreIds();
    const [genre, setGenre] = useState('all');
    const [range, setRange] = useState<YearRange | null>(null);
    const [drilldown, setDrilldown] = useState<Drilldown | null>(null);

    const firstEditions = useStatsQuery<LanguageYearCount[]>(`stats/worksbyyear${genreParam(genre)}`);
    const originals = useStatsQuery<LanguageYearCount[]>(`stats/origworksbyyear${genreParam(genre)}`);
    const publishers = useStatsQuery<PublisherYearCount[]>(`stats/publishersbyyear${genreParam(genre)}`);
    const allPublishers = useStatsQuery<PublisherYearCount[]>('stats/publishersbyyear');
    const genresByYear = useStatsQuery<GenreYearCount[]>('stats/genresbyyear');

    const bounds = useMemo(
        () => yearBounds(firstEditions.data ?? [], originals.data ?? []),
        [firstEditions.data, originals.data]);
    // Until the user picks a range, show everything from DEFAULT_START_YEAR.
    const activeRange = useMemo((): YearRange => range ?? {
        start: Math.max(bounds.min, DEFAULT_START_YEAR), end: bounds.max, decades: false,
    }, [range, bounds]);

    const genreFilter = genre === 'all' ? undefined : genreIds.get(genre);
    const drill = (title: string, params: Record<string, string | number | undefined>) => {
        const p = new URLSearchParams();
        Object.entries({ ...params, genre: genreFilter }).forEach(([k, v]) => {
            if (v !== undefined) p.append(k, String(v));
        });
        const genreText = genre === 'all' ? '' : ` · ${GENRE_NAMES[genre]}`;
        setDrilldown({ title: title + genreText, params: p });
    };

    if (!firstEditions.data || !originals.data) {
        return <div className="flex justify-content-center p-4"><ProgressSpinner /></div>;
    }

    return (
        <>
            <FilterBar>
                <Dropdown aria-label="Genre" ariaLabel="Genre" value={genre} options={genreOptions} optionLabel="label" optionValue="value"
                    onChange={(e) => setGenre(e.value)} className="w-auto" />
                <YearRangeFilter value={activeRange} min={bounds.min} max={bounds.max} onChange={setRange} />
            </FilterBar>
            <div className="grid">
                <div className="col-12">
                    <FirstEditionsCard
                        theme={theme}
                        languages={fromLanguages(firstEditions.data)}
                        publishers={fromPublishers(publishers.data)}
                        publisherRanking={groupTotals(fromPublishers(allPublishers.data)).map(p => p.name)}
                        publishersLoading={publishers.isLoading || allPublishers.isLoading}
                        genres={genresByYear.data}
                        genreFiltered={genre !== 'all'}
                        range={activeRange}
                        onLanguage={(years, s) => drill(
                            `${s.label}, ${yearSpanLabel(years.min, years.max)} · suomenkieliset ensipainokset`,
                            { language: s.id ?? undefined, edition_year_min: years.min, edition_year_max: years.max })}
                        onPublisher={(years, s) => drill(
                            `${s.label}, ${yearSpanLabel(years.min, years.max)} · kustantajan ensimmäiset painokset`,
                            { publisher: s.id ?? undefined, publisher_first: 1, edition_year_min: years.min, edition_year_max: years.max })}
                    />
                </div>
                <div className="col-12">
                    <EditionTypesCard theme={theme} genre={genre} range={activeRange}
                        onFirstEditions={(years) => drill(
                            `Ensipainokset ${yearSpanLabel(years.min, years.max)}`,
                            { edition_year_min: years.min, edition_year_max: years.max })}
                    />
                </div>
                <div className="col-12">
                    <OriginalsCard
                        theme={theme}
                        rows={fromLanguages(originals.data)}
                        range={activeRange}
                        onSelect={(years, s) => drill(
                            `${s.label}, ${yearSpanLabel(years.min, years.max)} · alkuperäinen julkaisuvuosi`,
                            { language: s.id ?? undefined, orig_year_min: years.min, orig_year_max: years.max })}
                    />
                </div>
                <div className="col-12">
                    <ComparisonCard theme={theme} range={activeRange}
                        firstEditions={firstEditions.data} originals={originals.data} />
                </div>
                <TranslationLagCards genre={genre} range={activeRange} />
                <div className="col-12">
                    <DomesticShareCard theme={theme} range={activeRange} firstEditions={firstEditions.data} />
                </div>
                <div className="col-12">
                    <PublisherHeatmapCard
                        rows={fromPublishers(publishers.data)}
                        loading={publishers.isLoading}
                        range={activeRange}
                        onSelect={(row, years) => drill(
                            `${row.label}, ${yearSpanLabel(years.min, years.max)} · kustantajan ensimmäiset painokset`,
                            { publisher: row.id ?? undefined, publisher_first: 1, edition_year_min: years.min, edition_year_max: years.max })}
                    />
                </div>
                <div className="col-12">
                    <CumulativeCard theme={theme} genre={genre} range={activeRange}
                        firstEditions={firstEditions.data} />
                </div>
            </div>
            <WorksDrilldownDialog drilldown={drilldown} onHide={() => setDrilldown(null)} />
        </>
    );
};

interface FirstEditionsCardProps {
    theme: ChartTheme;
    languages: GroupYearCount[];
    publishers: GroupYearCount[];
    publisherRanking: string[];
    publishersLoading: boolean;
    genres: GenreYearCount[] | undefined;
    // A genre filter is on: grouping by genre is not offered.
    genreFiltered: boolean;
    range: YearRange;
    onLanguage: (years: { min: number; max: number }, s: Series) => void;
    onPublisher: (years: { min: number; max: number }, s: Series) => void;
}

type GroupBy = 'language' | 'publisher' | 'genre';

const groupByOptions: { label: string; value: GroupBy }[] = [
    { label: 'Kielet', value: 'language' },
    { label: 'Kustantajat', value: 'publisher' },
    { label: 'Genret', value: 'genre' },
];

// Genre rows folded into genre groups (adult, youth and children's genres
// together). A work in two genres of a group counts twice.
const fromGenreGroups = (data: GenreYearCount[] = []): GroupYearCount[] => data.flatMap(d => {
    const group = GENRE_GROUPS.find(g => g.genres.includes(d.genre_abbr));
    return group ? [{ year: d.year, count: d.count, group_id: null, group_name: group.key }] : [];
});

const FirstEditionsCard = ({
    theme, languages, publishers, publisherRanking, publishersLoading, genres, genreFiltered, range,
    onLanguage, onPublisher,
}: FirstEditionsCardProps) => {
    const [chosenGroupBy, setGroupBy] = useState<GroupBy>('language');
    const groupBy = genreFiltered && chosenGroupBy === 'genre' ? 'language' : chosenGroupBy;
    const byGenre = groupBy === 'genre';
    const genreRows = useMemo(() => fromGenreGroups(genres), [genres]);
    const [share, setShare] = useState(false);
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
    const [selectedPublishers, setSelectedPublishers] = useState<string[]>([]);
    const byPublisher = groupBy === 'publisher';

    const publisherIds = useMemo(() => new Map(publishers.map(r => [r.group_name ?? '', r.group_id])), [publishers]);
    const publisherOptions = useMemo(
        () => groupTotals(inRange(publishers, range)).map(p => ({ label: p.name, value: p.name })),
        [publishers, range]);

    const series = byGenre
        ? GENRE_GROUPS.map(g => ({ key: g.key, label: g.label, color: theme.series[g.slot], id: null }))
        : byPublisher
            ? publisherSeries(theme, publisherRanking, publisherIds, selectedPublishers)
            : languageSeries(theme, languages, selectedLanguages.filter(l => l !== OTHERS_LABEL));
    const showOthers = byGenre ? false : byPublisher
        ? selectedPublishers.length === 0
        : selectedLanguages.length === 0 || selectedLanguages.includes(OTHERS_LABEL);

    return (
        <StatCard
            title="Ensipainokset vuosittain"
            subtitle={byGenre
                ? 'Teoksia genreryhmän ja ensimmäisen suomenkielisen painoksen vuoden mukaan. Genreryhmä yhdistää aikuisten, nuorten ja lasten genren; teos lasketaan jokaiseen genreensä.'
                : byPublisher
                ? 'Teoksia. Teos lasketaan kerran kullekin kustantajalle, sen ensimmäisen painoksen vuodelle; saman kustantajan uusintapainokset eivät lisää lukua.'
                : 'Suomenkielisiä ensipainoksia alkuperäiskielen mukaan.'}
            controls={<>
                <SelectButton aria-label="Ryhmittely" value={groupBy}
                    options={genreFiltered ? groupByOptions.filter(o => o.value !== 'genre') : groupByOptions}
                    optionLabel="label" optionValue="value" allowEmpty={false}
                    onChange={(e) => setGroupBy(e.value)} />
                <SelectButton aria-label="Määrä vai osuus" value={share} options={countShareOptions}
                    optionLabel="label" optionValue="value" allowEmpty={false}
                    onChange={(e) => setShare(e.value)} />
                {byGenre ? null : byPublisher ? (
                    <MultiSelect aria-label="Kustantajat" value={selectedPublishers} options={publisherOptions} optionLabel="label" optionValue="value"
                        onChange={(e) => setSelectedPublishers(e.value)} filter display="chip"
                        selectionLimit={MAX_SERIES} showSelectAll={false} loading={publishersLoading}
                        placeholder={`${MAX_SERIES} suurinta + muut`} className="w-auto" />
                ) : (
                    <MultiSelect aria-label="Kielet" value={selectedLanguages} options={languageOptions} optionLabel="label" optionValue="value"
                        onChange={(e) => setSelectedLanguages(e.value)} display="chip"
                        placeholder="Kaikki kielet" className="w-auto" />
                )}
            </>}
        >
            {(byPublisher && publishersLoading) || (byGenre && !genres) ? (
                <div className="flex justify-content-center p-4"><ProgressSpinner /></div>
            ) : (
                <YearColumnsChart
                    rows={byGenre ? genreRows : byPublisher ? publishers : languages}
                    range={range}
                    series={series}
                    showOthers={showOthers}
                    othersColor={theme.other}
                    share={share}
                    unit={byPublisher || byGenre ? 'teosta' : 'ensipainosta'}
                    axisTitle={byPublisher || byGenre ? 'Teoksia' : 'Ensipainoksia'}
                    ariaLabel="Ensipainokset vuosittain"
                    onSelect={(years, s) => {
                        if (!s?.id || byGenre) return;
                        (byPublisher ? onPublisher : onLanguage)(years, s);
                    }}
                />
            )}
        </StatCard>
    );
};

const OriginalsCard = ({ theme, rows, range, onSelect }: {
    theme: ChartTheme;
    rows: GroupYearCount[];
    range: YearRange;
    onSelect: (years: { min: number; max: number }, s: Series) => void;
}) => {
    const [share, setShare] = useState(false);
    return (
        <StatCard
            title="Alkuteokset vuosittain"
            subtitle="Teoksia alkuperäisen julkaisuvuoden ja kielen mukaan."
            controls={
                <SelectButton aria-label="Määrä vai osuus" value={share} options={countShareOptions}
                    optionLabel="label" optionValue="value" allowEmpty={false}
                    onChange={(e) => setShare(e.value)} />
            }
        >
            <YearColumnsChart
                rows={rows}
                range={range}
                series={languageSeries(theme, rows, [])}
                showOthers
                othersColor={theme.other}
                share={share}
                unit="teosta"
                axisTitle="Teoksia"
                ariaLabel="Alkuteokset vuosittain"
                onSelect={(years, s) => { if (s?.id) onSelect(years, s); }}
            />
        </StatCard>
    );
};

// Two counts of the same works on one axis: when they came out in Finnish
// and when they were first published.
const ComparisonCard = ({ theme, range, firstEditions, originals }: {
    theme: ChartTheme;
    range: YearRange;
    firstEditions: LanguageYearCount[];
    originals: LanguageYearCount[];
}) => {
    const buckets = useMemo(() => bucketsIn(range), [range]);
    const sumBy = (data: LanguageYearCount[]) => {
        const sums = new Map<number, number>();
        data.forEach(d => {
            if (d.year < range.start || d.year > range.end) return;
            const b = bucketOf(d.year, range.decades);
            sums.set(b, (sums.get(b) ?? 0) + d.count);
        });
        return buckets.map(b => sums.get(b) ?? 0);
    };
    const finnish = sumBy(firstEditions);
    const original = sumBy(originals);
    const base = baseChartOptions(theme);
    const lineStyle = { borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, tension: 0.2 };
    return (
        <StatCard
            title="Suomennokset ja alkuteokset"
            subtitle="Suomenkieliset ensipainokset ilmestymisvuoden mukaan verrattuna teosten alkuperäiseen julkaisuvuoteen."
        >
            <div style={{ height: '320px' }}>
                <Line
                    role="img"
                    aria-label="Suomennokset ja alkuteokset vuosittain"
                    data={{
                        labels: buckets.map(b => bucketLabel(b, range.decades)),
                        datasets: [
                            { label: 'Suomenkielinen ensipainos', data: finnish, borderColor: theme.series[0], backgroundColor: theme.series[0], ...lineStyle },
                            { label: 'Alkuperäinen julkaisuvuosi', data: original, borderColor: theme.series[1], backgroundColor: theme.series[1], ...lineStyle },
                        ],
                    }}
                    options={{
                        ...base,
                        interaction: { mode: 'index' as const, intersect: false },
                        plugins: {
                            ...base.plugins,
                            legend: { ...base.plugins.legend, position: 'top' as const },
                            tooltip: {
                                ...base.plugins.tooltip,
                                callbacks: { label: (ctx: TooltipItem<'line'>) => `${ctx.dataset.label}: ${fmt(ctx.parsed.y ?? 0)} teosta` },
                            },
                        },
                        scales: {
                            x: { ...axisColours(theme), grid: { display: false }, ticks: { ...axisColours(theme).ticks, maxRotation: 0, autoSkipPadding: 12 } },
                            y: { ...axisColours(theme), beginAtZero: true, title: { display: true, text: 'Teoksia', color: theme.textSecondary } },
                        },
                    }}
                />
            </div>
            <DataView>
                <table className="w-full text-sm">
                    <thead><tr><th className="text-left">{range.decades ? 'Vuosikymmen' : 'Vuosi'}</th><th className="text-right">Suomenkielinen ensipainos</th><th className="text-right">Alkuperäinen julkaisuvuosi</th></tr></thead>
                    <tbody>
                        {buckets.map((b, i) => (finnish[i] || original[i]) ? (
                            <tr key={b}><td>{bucketLabel(b, range.decades)}</td><td className="text-right">{fmt(finnish[i])}</td><td className="text-right">{fmt(original[i])}</td></tr>
                        ) : null)}
                    </tbody>
                </table>
            </DataView>
        </StatCard>
    );
};

const topOptions = [10, 20, 30, 50].map(n => ({ label: String(n), value: n }));

// Publishers by decade (or year) as a heatmap: works for many publishers
// where stacked colours can't.
const PublisherHeatmapCard = ({ rows, loading, range, onSelect }: {
    rows: GroupYearCount[];
    loading: boolean;
    range: YearRange;
    onSelect: (row: HeatmapRow, years: { min: number; max: number }) => void;
}) => {
    const [top, setTop] = useState(20);
    // Yearly cells only fit for short ranges.
    const decades = range.decades || range.end - range.start > 40;
    const columnRange: YearRange = useMemo(() => ({ ...range, decades }), [range, decades]);
    const buckets = useMemo(() => bucketsIn(columnRange), [columnRange]);

    const heatmapRows = useMemo((): HeatmapRow[] => {
        const visible = inRange(rows, range);
        const names = groupTotals(visible).slice(0, top);
        const index = new Map(buckets.map((b, i) => [b, i]));
        return names.map(p => {
            const values = buckets.map(() => 0);
            visible.forEach(r => {
                if (r.group_name !== p.name) return;
                const i = index.get(bucketOf(r.year, decades));
                if (i !== undefined) values[i] += r.count;
            });
            return { id: p.id, label: p.name, values };
        });
    }, [rows, range, top, buckets, decades]);

    return (
        <StatCard
            title="Kustantajat vuosikymmenittäin"
            subtitle={`Teoksia, kustantajan ensimmäisen painoksen mukaan. ${top} suurinta kustantajaa valitulla aikavälillä${decades && !range.decades ? '; pitkä aikaväli näytetään vuosikymmenittäin' : ''}.`}
            controls={
                <div className="flex align-items-center gap-2">
                    <label htmlFor="heatmap-top">Kustantajia:</label>
                    <Dropdown inputId="heatmap-top" ariaLabel="Kustantajien määrä" value={top} options={topOptions} optionLabel="label" optionValue="value"
                        onChange={(e) => setTop(e.value)} className="w-auto" />
                </div>
            }
        >
            {loading ? (
                <div className="flex justify-content-center p-4"><ProgressSpinner /></div>
            ) : (
                <Heatmap
                    rows={heatmapRows}
                    columns={buckets.map(b => ({ key: b, label: String(b) }))}
                    verticalLabels={!decades}
                    unit="teosta"
                    rowHeader="Kustantaja"
                    caption="Kustantajien teokset vuosikymmenittäin"
                    onSelect={(row, ci) => onSelect(row, bucketYears(buckets[ci], columnRange))}
                />
            )}
        </StatCard>
    );
};

const ALL_GROUP_GENRES = GENRE_GROUPS.flatMap(g => g.genres);

const cumulativeModeOptions = [
    { label: 'Yhteensä', value: false },
    { label: 'Genreryhmät', value: true },
];

// Running total of first editions. Counting starts from the earliest year
// in the data, not from the start of the visible range.
const CumulativeCard = ({ theme, genre, range, firstEditions }: {
    theme: ChartTheme;
    genre: string;
    range: YearRange;
    firstEditions: LanguageYearCount[];
}) => {
    const user = useMemo(() => getCurrenUser(), []);
    const [byGroup, setByGroup] = useState(false);
    const groups = byGroup && genre === 'all';

    const genreQueries = useQueries({
        queries: ALL_GROUP_GENRES.map(g => ({
            queryKey: ['stats', `stats/worksbyyear?genre=${g}`],
            queryFn: async () => (await getApiContent(`stats/worksbyyear?genre=${g}`, user)).data as LanguageYearCount[],
            enabled: groups,
        })),
    });
    const loading = groups && genreQueries.some(q => q.isLoading);

    const buckets = useMemo(() => bucketsIn(range), [range]);
    const cumulative = (data: LanguageYearCount[]) => {
        const sorted = [...data].sort((a, b) => a.year - b.year);
        return buckets.map(b => {
            const last = range.decades ? Math.min(b + 9, range.end) : b;
            return sorted.reduce((sum, d) => d.year > 0 && d.year <= last ? sum + d.count : sum, 0);
        });
    };

    const datasets = groups
        ? GENRE_GROUPS.map(group => {
            const data = group.genres.flatMap(g => genreQueries[ALL_GROUP_GENRES.indexOf(g)]?.data ?? []);
            const colour = theme.series[group.slot];
            return { label: group.label, data: cumulative(data), borderColor: colour, backgroundColor: colour };
        })
        : [{
            label: genre === 'all' ? 'Kaikki genret' : GENRE_NAMES[genre],
            data: cumulative(firstEditions),
            borderColor: theme.series[0],
            backgroundColor: `${theme.series[0]}26`,
            fill: true,
        }];

    const base = baseChartOptions(theme);
    return (
        <StatCard
            title="Ensipainokset kumulatiivisesti"
            subtitle={groups
                ? 'Ensipainoksia yhteensä kunkin vuoden loppuun mennessä. Genreryhmä yhdistää aikuisten, nuorten ja lasten genren; teos lasketaan jokaiseen genreensä.'
                : 'Ensipainoksia yhteensä kunkin vuoden loppuun mennessä.'}
            controls={genre === 'all' ? (
                <SelectButton aria-label="Sarjat" value={byGroup} options={cumulativeModeOptions}
                    optionLabel="label" optionValue="value" allowEmpty={false}
                    onChange={(e) => setByGroup(e.value)} />
            ) : undefined}
        >
            {loading ? (
                <div className="flex justify-content-center p-4"><ProgressSpinner /></div>
            ) : (
                <div style={{ height: '360px' }}>
                    <Line
                        role="img"
                        aria-label="Ensipainokset kumulatiivisesti"
                        data={{
                            labels: buckets.map(b => bucketLabel(b, range.decades)),
                            datasets: datasets.map(d => ({ ...d, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, tension: 0.2 })),
                        }}
                        options={{
                            ...base,
                            interaction: { mode: 'index' as const, intersect: false },
                            plugins: {
                                ...base.plugins,
                                legend: { ...base.plugins.legend, display: groups, position: 'top' as const },
                                tooltip: {
                                    ...base.plugins.tooltip,
                                    callbacks: { label: (ctx: TooltipItem<'line'>) => `${ctx.dataset.label}: ${fmt(ctx.parsed.y ?? 0)} ensipainosta` },
                                },
                            },
                            scales: {
                                x: { ...axisColours(theme), grid: { display: false }, ticks: { ...axisColours(theme).ticks, maxRotation: 0, autoSkipPadding: 12 } },
                                y: { ...axisColours(theme), beginAtZero: true, title: { display: true, text: 'Ensipainoksia yhteensä', color: theme.textSecondary } },
                            },
                        }}
                    />
                </div>
            )}
        </StatCard>
    );
};
