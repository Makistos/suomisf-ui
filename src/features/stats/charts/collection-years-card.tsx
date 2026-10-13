import { useMemo, useState } from 'react';
import { SelectButton } from 'primereact/selectbutton';
import { COLOURED_LANGUAGES, LANGUAGE_SLOTS } from './palette';
import { useChartTheme } from './use-chart-theme';
import { StatCard } from './stat-card';
import { Series, YearColumnsChart } from './year-columns-chart';
import { YearRange, YearRangeFilter, yearBounds, yearSpanLabel } from './years';
import { LanguageYearCount, fromLanguages } from './stats-data';
import { Drilldown, WorksDrilldownDialog } from './drilldown-dialogs';

const sourceOptions = [
    { label: 'Suomenkielinen painos', value: 'finnish' },
    { label: 'Alkuperäinen julkaisuvuosi', value: 'original' },
];

interface CollectionYearsCardProps {
    finnishEditionData: LanguageYearCount[];
    originalYearData: LanguageYearCount[];
    // stats/filterworks parameter limiting drill-downs to this user's
    // books: "owner" for the collection, "read" for works marked read.
    filterParam: 'owner' | 'read';
    userId: string;
}

// Publications per year for a user's collection or reading, by language.
export const CollectionYearsCard = ({ finnishEditionData, originalYearData, filterParam, userId }: CollectionYearsCardProps) => {
    const theme = useChartTheme();
    const [source, setSource] = useState<'finnish' | 'original'>('finnish');
    const [range, setRange] = useState<YearRange | null>(null);
    const [drilldown, setDrilldown] = useState<Drilldown | null>(null);

    const data = source === 'finnish' ? finnishEditionData : originalYearData;
    const rows = useMemo(() => fromLanguages(data), [data]);
    const bounds = useMemo(() => yearBounds(finnishEditionData, originalYearData), [finnishEditionData, originalYearData]);
    const activeRange = useMemo((): YearRange => range ?? { start: bounds.min, end: bounds.max, decades: false },
        [range, bounds]);

    const ids = new Map(rows.map(r => [r.group_name, r.group_id]));
    const series: Series[] = COLOURED_LANGUAGES.map(l => ({
        key: l, label: l, color: theme.series[LANGUAGE_SLOTS[l]], id: ids.get(l) ?? null,
    }));

    return (
        <StatCard
            title="Julkaisut vuosittain"
            subtitle={source === 'finnish'
                ? 'Painoksia suomenkielisen painoksen vuoden ja alkuperäiskielen mukaan.'
                : 'Teoksia alkuperäisen julkaisuvuoden ja kielen mukaan.'}
            controls={<>
                <SelectButton aria-label="Vuosi" value={source} options={sourceOptions}
                    optionLabel="label" optionValue="value" allowEmpty={false}
                    onChange={(e) => setSource(e.value)} />
                <YearRangeFilter value={activeRange} min={bounds.min} max={bounds.max} onChange={setRange} />
            </>}
        >
            <YearColumnsChart
                rows={rows}
                range={activeRange}
                series={series}
                showOthers
                othersColor={theme.other}
                unit={source === 'finnish' ? 'painosta' : 'teosta'}
                axisTitle={source === 'finnish' ? 'Painoksia' : 'Teoksia'}
                ariaLabel="Julkaisut vuosittain"
                onSelect={(years, s) => {
                    if (!s?.id) return;
                    const prefix = source === 'finnish' ? 'edition_year' : 'orig_year';
                    setDrilldown({
                        title: `${s.label}, ${yearSpanLabel(years.min, years.max)}`,
                        params: new URLSearchParams({
                            [filterParam]: userId,
                            language: String(s.id),
                            [`${prefix}_min`]: String(years.min),
                            [`${prefix}_max`]: String(years.max),
                        }),
                    });
                }}
            />
            <WorksDrilldownDialog drilldown={drilldown} onHide={() => setDrilldown(null)} />
        </StatCard>
    );
};
