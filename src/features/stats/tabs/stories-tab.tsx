import { useMemo, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { SelectButton } from 'primereact/selectbutton';
import { ProgressSpinner } from 'primereact/progressspinner';
import {
    COLOURED_LANGUAGES, DEFAULT_START_YEAR, Drilldown, FilterBar, GroupYearCount, LANGUAGE_SLOTS,
    OTHERS_LABEL, Series, StatCard, StoriesDrilldownDialog, YearColumnsChart, YearRange,
    YearRangeFilter, useChartTheme, useStatsQuery, yearBounds, yearSpanLabel,
} from '../charts';
import { STORY_TYPE_PLURALS, STORY_TYPE_UNITS } from './people-tab';

interface StoryYearCount {
    year: number;
    count: number;
    storytype_id: number | null;
    storytype_name: string | null;
    language_id: number | null;
    language_name: string | null;
}

interface StoryType {
    id: number;
    name: string;
}

const countShareOptions = [
    { label: 'Määrä', value: false },
    { label: 'Osuus', value: true },
];

const languageOptions = [...COLOURED_LANGUAGES, OTHERS_LABEL].map(l => ({ label: l, value: l }));

export const StoriesTab = () => {
    const theme = useChartTheme();
    const [storyType, setStoryType] = useState<number | 'all'>(1);
    const [range, setRange] = useState<YearRange | null>(null);
    const [share, setShare] = useState(false);
    const [languages, setLanguages] = useState<string[]>([]);
    const [drilldown, setDrilldown] = useState<Drilldown | null>(null);

    const data = useStatsQuery<StoryYearCount[]>('stats/storiesbyyear');
    const storyTypes = useStatsQuery<StoryType[]>('shorttypes');

    const rows = useMemo((): GroupYearCount[] => (data.data ?? [])
        .filter(d => storyType === 'all' || d.storytype_id === storyType)
        .map(d => ({ year: d.year, count: d.count, group_id: d.language_id, group_name: d.language_name })),
    [data.data, storyType]);

    const bounds = useMemo(() => yearBounds(data.data ?? []), [data.data]);
    const activeRange = useMemo((): YearRange => range ?? {
        start: Math.max(bounds.min, DEFAULT_START_YEAR), end: bounds.max, decades: false,
    }, [range, bounds]);

    const ids = new Map(rows.map(r => [r.group_name, r.group_id]));
    const named = languages.filter(l => l !== OTHERS_LABEL);
    const series: Series[] = COLOURED_LANGUAGES
        .filter(l => named.length === 0 && languages.length === 0 || named.includes(l))
        .map(l => ({ key: l, label: l, color: theme.series[LANGUAGE_SLOTS[l]], id: ids.get(l) ?? null }));

    const typeName = storyType === 'all' ? null : storyTypes.data?.find(t => t.id === storyType)?.name ?? null;
    const key = typeName?.toLowerCase() ?? 'novelli';
    const unit = STORY_TYPE_UNITS[key] ?? 'kpl';
    const plural = STORY_TYPE_PLURALS[key] ?? 'novelleja';

    const storyTypeOptions = [
        { label: 'Kaikki tyypit', value: 'all' as const },
        ...(storyTypes.data ?? []).map(t => ({ label: t.name.charAt(0).toUpperCase() + t.name.slice(1), value: t.id })),
    ];

    if (!data.data) {
        return <div className="flex justify-content-center p-4"><ProgressSpinner /></div>;
    }

    return (
        <>
            <FilterBar>
                <Dropdown aria-label="Novellityyppi" ariaLabel="Novellityyppi" value={storyType} options={storyTypeOptions} optionLabel="label" optionValue="value"
                    onChange={(e) => setStoryType(e.value)} className="w-auto" />
                <YearRangeFilter value={activeRange} min={bounds.min} max={bounds.max} onChange={setRange} />
            </FilterBar>
            <div className="grid">
                <div className="col-12">
                    <StatCard
                        title="Novellit vuosittain"
                        subtitle="Novelleja alkuperäisen kirjoitusvuoden ja kielen mukaan."
                        controls={<>
                            <SelectButton aria-label="Määrä vai osuus" value={share} options={countShareOptions}
                                optionLabel="label" optionValue="value" allowEmpty={false}
                                onChange={(e) => setShare(e.value)} />
                            <MultiSelect aria-label="Kielet" value={languages} options={languageOptions} optionLabel="label" optionValue="value"
                                onChange={(e) => setLanguages(e.value)} display="chip"
                                placeholder="Kaikki kielet" className="w-auto" />
                        </>}
                    >
                        <YearColumnsChart
                            rows={rows}
                            range={activeRange}
                            series={series}
                            showOthers={languages.length === 0 || languages.includes(OTHERS_LABEL)}
                            othersColor={theme.other}
                            share={share}
                            unit={unit}
                            axisTitle={plural.charAt(0).toUpperCase() + plural.slice(1)}
                            ariaLabel="Novellit vuosittain"
                            onSelect={(years, s) => {
                                if (!s?.id) return;
                                const params = new URLSearchParams({
                                    language: String(s.id),
                                    pubyear_min: String(years.min),
                                    pubyear_max: String(years.max),
                                });
                                if (storyType !== 'all') params.append('storytype', String(storyType));
                                setDrilldown({
                                    title: `${s.label}, ${yearSpanLabel(years.min, years.max)}${typeName ? ` · ${typeName}` : ''}`,
                                    params,
                                });
                            }}
                        />
                    </StatCard>
                </div>
            </div>
            <StoriesDrilldownDialog drilldown={drilldown} onHide={() => setDrilldown(null)} />
        </>
    );
};
