import { useMemo, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Slider } from 'primereact/slider';
import { ProgressSpinner } from 'primereact/progressspinner';
import {
    Drilldown, FilterBar, GENRE_NAMES, OTHERS_LABEL, RankedBarChart, StatCard,
    WorksDrilldownDialog, genreOptions, useGenreIds, useStatsQuery,
} from '../charts';

interface PublisherCount {
    id: number | null;
    name: string;
    fullname: string | null;
    genres: Record<string, number>;
    total: number;
}

// The endpoint ranks this many publishers and sums the rest into "Muut".
const FETCHED = 100;

export const PublishersTab = () => {
    const [genre, setGenre] = useState('all');
    const [count, setCount] = useState(20);
    const [drilldown, setDrilldown] = useState<Drilldown | null>(null);
    const genreIds = useGenreIds();
    const publishers = useStatsQuery<PublisherCount[]>(`stats/publishercounts?count=${FETCHED}`);

    const { items, rest } = useMemo(() => {
        const countIn = (p: PublisherCount) => genre === 'all' ? p.total : (p.genres[genre] ?? 0);
        const data = publishers.data ?? [];
        const others = data.find(p => p.id === null && p.name === OTHERS_LABEL);
        return {
            items: data
                .filter(p => p !== others)
                .map(p => ({ id: p.id, label: p.fullname || p.name, count: countIn(p) })),
            rest: others ? countIn(others) : 0,
        };
    }, [publishers.data, genre]);

    return (
        <>
            <FilterBar>
                <Dropdown aria-label="Genre" ariaLabel="Genre" value={genre} options={genreOptions} optionLabel="label" optionValue="value"
                    onChange={(e) => setGenre(e.value)} className="w-auto" />
            </FilterBar>
            <div className="grid">
                <div className="col-12 lg:col-10">
                    <StatCard
                        title="Suurimmat kustantajat"
                        subtitle="Painoksia, uusintapainokset mukaan lukien. Muut-palkki sisältää loput kustantajat."
                        controls={
                            <div className="flex align-items-center gap-2">
                                <span id="publisher-count-label" className="text-sm">Kustantajia: {count}</span>
                                <Slider aria-labelledby="publisher-count-label" value={count}
                                    onChange={(e) => setCount(e.value as number)}
                                    min={10} max={FETCHED} step={10} className="w-8rem" />
                            </div>
                        }
                    >
                        {publishers.isLoading ? (
                            <div className="flex justify-content-center p-4"><ProgressSpinner /></div>
                        ) : (
                            <RankedBarChart
                                items={items}
                                topN={count}
                                restCount={rest}
                                unit="painosta"
                                itemHeader="Kustantaja"
                                ariaLabel="Suurimmat kustantajat"
                                onSelect={(item) => {
                                    const params = new URLSearchParams({ publisher: String(item.id) });
                                    const genreId = genre === 'all' ? undefined : genreIds.get(genre);
                                    if (genreId) params.append('genre', String(genreId));
                                    setDrilldown({
                                        title: `${item.label}${genre === 'all' ? '' : ` · ${GENRE_NAMES[genre]}`}`,
                                        params,
                                    });
                                }}
                            />
                        )}
                    </StatCard>
                </div>
            </div>
            <WorksDrilldownDialog drilldown={drilldown} onHide={() => setDrilldown(null)} />
        </>
    );
};
