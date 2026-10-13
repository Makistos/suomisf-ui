import { useState } from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';
import {
    Drilldown, GENRE_NAMES, RankedBarChart, StatCard, WorksDrilldownDialog,
    useGenreIds, useStatsQuery,
} from '../charts';

export const ContentTab = () => {
    const genreCounts = useStatsQuery<Record<string, number>>('stats/genrecounts');
    const genreIds = useGenreIds();
    const [drilldown, setDrilldown] = useState<Drilldown | null>(null);

    if (!genreCounts.data) {
        return <div className="flex justify-content-center p-4"><ProgressSpinner /></div>;
    }
    const items = Object.entries(GENRE_NAMES).map(([abbr, label]) => ({
        id: genreIds.get(abbr) ?? -1,
        label,
        count: genreCounts.data[abbr] ?? 0,
    }));

    return (
        <div className="grid">
            <div className="col-12 lg:col-8">
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
            <WorksDrilldownDialog drilldown={drilldown} onHide={() => setDrilldown(null)} />
        </div>
    );
};
