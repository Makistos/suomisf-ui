import { useMemo, useState } from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';
import {
    FilterBar, Heatmap, HeatmapRow, MagazineYearCount, StatCard, YearColumnsChart, YearRange,
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
            </div>
        </>
    );
};
