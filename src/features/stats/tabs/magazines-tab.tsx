import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProgressSpinner } from 'primereact/progressspinner';
import { SelectButton } from 'primereact/selectbutton';
import {
    FilterBar, Heatmap, HeatmapRow, MagazineContentCount, MagazineStats, MagazineYearCount,
    RankedBarChart, Series, StatCard, Timeline, TimelineItem, YearColumnsChart, YearRange,
    YearRangeFilter, bucketOf, bucketsIn, fromMagazines, groupTotals, useChartTheme,
    useStatsQuery, yearBounds,
} from '../charts';

interface IssueYearCount {
    year: number;
    count: number;
}

// Magazines shown by name in the heatmap.
const TOP_MAGAZINES = 20;

export const MagazinesTab = () => {
    const theme = useChartTheme();
    const [range, setRange] = useState<YearRange | null>(null);
    const totals = useStatsQuery<IssueYearCount[]>('stats/issuesperyear');
    const byMagazine = useStatsQuery<MagazineYearCount[]>('stats/issuesperyear?by=magazine');

    // Year 0 marks issues with an unknown year.
    const yearRows = useMemo(() => (totals.data ?? []).filter(d => d.year > 0), [totals.data]);
    const bounds = useMemo(() => yearBounds(yearRows), [yearRows]);
    const activeRange = useMemo((): YearRange => range ?? { start: bounds.min, end: bounds.max, decades: false },
        [range, bounds]);

    const decades = activeRange.decades || activeRange.end - activeRange.start > 40;
    const buckets = useMemo(
        () => bucketsIn({ ...activeRange, decades }),
        [activeRange, decades]);

    const heatmapRows = useMemo((): HeatmapRow[] => {
        const rows = fromMagazines(byMagazine.data)
            .filter(r => r.year >= activeRange.start && r.year <= activeRange.end);
        const index = new Map(buckets.map((b, i) => [b, i]));
        return groupTotals(rows).slice(0, TOP_MAGAZINES).map(m => {
            const values = buckets.map(() => 0);
            rows.forEach(r => {
                if (r.group_name !== m.name) return;
                const i = index.get(bucketOf(r.year, decades));
                if (i !== undefined) values[i] += r.count;
            });
            return { id: m.id, label: m.name, values };
        });
    }, [byMagazine.data, activeRange, buckets, decades]);

    if (!totals.data) {
        return <div className="flex justify-content-center p-4"><ProgressSpinner /></div>;
    }

    return (
        <>
            <FilterBar>
                <YearRangeFilter value={activeRange} min={bounds.min} max={bounds.max} onChange={setRange} />
            </FilterBar>
            <div className="grid">
                <div className="col-12">
                    <StatCard title="Lehtien numerot vuosittain" subtitle="Ilmestyneitä numeroita, kaikki lehdet yhteensä.">
                        <YearColumnsChart
                            rows={yearRows.map(d => ({ ...d, group_id: null, group_name: '*' }))}
                            range={activeRange}
                            series={[{ key: '*', label: 'Numeroita', color: theme.series[0], id: null }]}
                            showOthers={false}
                            othersColor={theme.other}
                            unit="numeroa"
                            axisTitle="Numeroita"
                            ariaLabel="Lehtien numerot vuosittain"
                        />
                    </StatCard>
                </div>
                <div className="col-12">
                    <StatCard
                        title="Lehdet vuosittain"
                        subtitle={`Numeroita lehdittäin, ${TOP_MAGAZINES} eniten numeroita julkaissutta lehteä valitulla aikavälillä${decades && !activeRange.decades ? '; pitkä aikaväli näytetään vuosikymmenittäin' : ''}.`}
                    >
                        {byMagazine.isLoading ? (
                            <div className="flex justify-content-center p-4"><ProgressSpinner /></div>
                        ) : (
                            <Heatmap
                                rows={heatmapRows}
                                columns={buckets.map(b => ({ key: b, label: String(b) }))}
                                verticalLabels={!decades}
                                unit="numeroa"
                                rowHeader="Lehti"
                                caption="Lehtien numerot vuosittain"
                            />
                        )}
                    </StatCard>
                </div>
                <div className="col-12">
                    <ContentsCard range={activeRange} />
                </div>
                <MagazineCards />
            </div>
        </>
    );
};

const shareOptions = [
    { label: 'Määrä', value: false },
    { label: 'Osuus', value: true },
];

// Story types with their own colour in the contents chart; the rest are
// "Muut".
const CONTENT_TYPES = ['Novelli', 'Artikkeli', 'Raapale', 'Runo'];

const ContentsCard = ({ range }: { range: YearRange }) => {
    const theme = useChartTheme();
    const [share, setShare] = useState(false);
    const data = useStatsQuery<MagazineContentCount[]>('stats/magazinecontents');
    const rows = useMemo(() => (data.data ?? []).map(d => ({
        year: d.year, count: d.count, group_id: d.storytype_id, group_name: d.storytype_name,
    })), [data.data]);
    const series: Series[] = CONTENT_TYPES.map((t, i) => ({ key: t, label: t, color: theme.series[i], id: null }));

    return (
        <StatCard title="Lehtien sisältö vuosittain"
            subtitle="Lehdissä julkaistuja tekstejä tyypin mukaan (novellit, artikkelit, raapaleet…). Lehtien artikkelit on tallennettu tekstityypillä Artikkeli."
            controls={
                <SelectButton aria-label="Määrä vai osuus" value={share} options={shareOptions}
                    optionLabel="label" optionValue="value" allowEmpty={false}
                    onChange={(e) => setShare(e.value)} />
            }>
            {!data.data ? <div className="flex justify-content-center p-4"><ProgressSpinner /></div> : (
                <YearColumnsChart rows={rows} range={range} series={series} showOthers
                    othersColor={theme.other} share={share} unit="tekstiä" axisTitle="Tekstejä"
                    ariaLabel="Lehtien sisältö vuosittain" />
            )}
        </StatCard>
    );
};

// Magazine spans and story counts; not limited by the year filter.
const MagazineCards = () => {
    const data = useStatsQuery<MagazineStats[]>('stats/magazinestats');
    const spans = useMemo((): TimelineItem[] => (data.data ?? [])
        .filter(m => m.first !== null && m.last !== null)
        .map(m => ({ id: m.id, label: m.name, start: m.first!, end: m.last!, count: m.issues }))
        .sort((a, b) => a.start - b.start || a.end - b.end), [data.data]);
    const stories = useMemo(() => (data.data ?? [])
        .map(m => ({ id: m.id, label: m.name, count: m.stories })), [data.data]);
    const link = (item: { id: number | null; label: string }) => <Link to={`/magazines/${item.id}`}>{item.label}</Link>;

    return (
        <>
            <div className="col-12 lg:col-7">
                <StatCard title="Lehtien ilmestymisajat"
                    subtitle="Ensimmäisen ja viimeisen numeron vuosi, aloitusvuoden järjestyksessä. Koko historia, aikavälisuodatin ei vaikuta tähän.">
                    {!data.data ? <div className="flex justify-content-center p-4"><ProgressSpinner /></div> : (
                        <Timeline items={spans} unit="numeroa" countHeader="Numeroita" itemHeader="Lehti"
                            ariaLabel="Lehtien ilmestymisajat" nameTemplate={link} />
                    )}
                </StatCard>
            </div>
            <div className="col-12 lg:col-5">
                <StatCard title="Tekstit lehdittäin"
                    subtitle="Eri tekstejä (novelleja, artikkeleita…) lehdittäin, koko historia.">
                    {!data.data ? <div className="flex justify-content-center p-4"><ProgressSpinner /></div> : (
                        <RankedBarChart items={stories} topN={20} unit="tekstiä" itemHeader="Lehti"
                            ariaLabel="Tekstit lehdittäin" nameTemplate={link} />
                    )}
                </StatCard>
            </div>
        </>
    );
};
