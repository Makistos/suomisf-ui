import { ProgressSpinner } from 'primereact/progressspinner';
import { Meter, StatCard, StatTiles, useStatsQuery } from '../charts';

interface MiscStats {
    total_pages: number;
    stack_height_meters: number;
    hardback_count: number;
    paperback_count: number;
    total_editions: number;
    total_works: number;
    total_stories: number;
    total_people: number;
    total_publishers: number;
    total_magazines: number;
    total_issues: number;
    total_awarded: number;
}

const fmt = (n: number) => n.toLocaleString('fi-FI');

export const OverviewTab = () => {
    const misc = useStatsQuery<MiscStats>('stats/misc');

    if (!misc.data) {
        return <div className="flex justify-content-center p-4"><ProgressSpinner /></div>;
    }
    const m = misc.data;
    const known = m.hardback_count + m.paperback_count;

    return (
        <div className="flex flex-column gap-4">
            <p className="mt-0">
                Kannasta puuttuu vielä paljon painoksia, joten luvut kuvaavat
                bibliografian nykyistä sisältöä.
            </p>
            <StatTiles tiles={[
                { label: 'Teoksia', value: m.total_works },
                { label: 'Painoksia', value: m.total_editions },
                { label: 'Novelleja', value: m.total_stories },
                { label: 'Henkilöitä', value: m.total_people },
                { label: 'Kustantajia', value: m.total_publishers },
                { label: 'Lehtiä', value: m.total_magazines, note: `${fmt(m.total_issues)} numeroa` },
                { label: 'Palkintoja', value: m.total_awarded, note: 'myönnettyä palkintoa' },
                {
                    label: 'Sivuja ensipainoksissa', value: m.total_pages,
                    note: `pinona ${fmt(Math.round(m.stack_height_meters))} metriä`,
                },
            ]} />
            <div className="grid">
                <div className="col-12 md:col-6">
                    <StatCard title="Sidosasu" subtitle={`Ensipainokset, joiden sidosasu tiedetään (${fmt(known)}).`}>
                        <div className="flex flex-column gap-3">
                            <Meter label="Kovakantisia" part={m.hardback_count} whole={known}
                                note={`${fmt(m.hardback_count)} ensipainosta`} />
                            <Meter label="Pehmeäkantisia" part={m.paperback_count} whole={known}
                                note={`${fmt(m.paperback_count)} ensipainosta`} />
                        </div>
                    </StatCard>
                </div>
            </div>
        </div>
    );
};
