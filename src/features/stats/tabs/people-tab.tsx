import { useMemo, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { SelectButton } from 'primereact/selectbutton';
import { Slider } from 'primereact/slider';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ProgressSpinner } from 'primereact/progressspinner';
import {
    Drilldown, FilterBar, GENRE_NAMES, RankedBarChart, StatCard, StoriesDrilldownDialog,
    WorksDrilldownDialog, genreOptions, useChartTheme, useGenreIds, useStatsQuery,
} from '../charts';

type Material = 'books' | 'stories';

interface Role {
    id: number;
    name: string;
}

interface StoryType {
    id: number;
    name: string;
}

// Person counts per nationality, broken down by genre (books) or story type
// (stories), then by role name (capitalised).
interface NationalityCount {
    nationality_id: number | null;
    nationality: string | null;
    genres?: Record<string, Record<string, number>>;
    storytypes?: Record<string, Record<string, number>>;
    count: number;
}

interface PersonCount {
    id: number | null;
    name: string;
    alt_name: string | null;
    nationality: string | null;
    genres?: Record<string, Record<string, number>>;
    total: number;
}

const materialOptions = [
    { label: 'Kirjat', value: 'books' },
    { label: 'Novellit', value: 'stories' },
];

// Only used for magazine issues, not for works or stories.
const EXCLUDED_ROLES = ['päätoimittaja'];

// Roles that occur for stories.
const STORY_ROLES: Role[] = [
    { id: 1, name: 'kirjoittaja' },
    { id: 2, name: 'kääntäjä' },
    { id: 6, name: 'esiintyy' },
];

// Finnish plurals of story type names, for column headers.
export const STORY_TYPE_PLURALS: Record<string, string> = {
    'novelli': 'novelleja',
    'pitkä novelli': 'pitkiä novelleja',
    'pienoisromaani': 'pienoisromaaneja',
    'runo': 'runoja',
    'raapale': 'raapaleita',
    'filk-laulu': 'filk-lauluja',
    'artikkeli': 'artikkeleita',
    'esipuhe': 'esipuheita',
    'jälkisanat': 'jälkisanoja',
};

// What is counted, as after a number ("45 novellia").
export const STORY_TYPE_UNITS: Record<string, string> = {
    'novelli': 'novellia',
    'pitkä novelli': 'pitkää novellia',
    'pienoisromaani': 'pienoisromaania',
    'runo': 'runoa',
    'raapale': 'raapaletta',
    'filk-laulu': 'filk-laulua',
    'artikkeli': 'artikkelia',
    'esipuhe': 'esipuhetta',
    'jälkisanat': 'jälkisanoja',
};

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const fmt = (n: number) => n.toLocaleString('fi-FI');

export const PeopleTab = () => {
    const [material, setMaterial] = useState<Material>('books');
    const [genre, setGenre] = useState('all');
    const [storyType, setStoryType] = useState<number | 'all'>('all');
    const [drilldown, setDrilldown] = useState<Drilldown | null>(null);

    const roles = useStatsQuery<Role[]>('roles/');
    const storyTypes = useStatsQuery<StoryType[]>('shorttypes');

    const books = material === 'books';
    const roleList = useMemo(() => books
        ? (roles.data ?? []).filter(r => !EXCLUDED_ROLES.includes(r.name.toLowerCase()))
        : STORY_ROLES, [books, roles.data]);
    const storyTypeName = storyType === 'all' ? null
        : storyTypes.data?.find(t => t.id === storyType)?.name ?? null;

    const storyTypeOptions = useMemo(() => [
        { label: 'Kaikki tyypit', value: 'all' as const },
        ...(storyTypes.data ?? []).map(t => ({ label: capitalise(t.name), value: t.id })),
    ], [storyTypes.data]);

    const filterText = books
        ? (genre === 'all' ? '' : ` · ${GENRE_NAMES[genre]}`)
        : (storyTypeName ? ` · ${storyTypeName}` : '');

    return (
        <>
            <FilterBar>
                <SelectButton aria-label="Aineisto" value={material} options={materialOptions}
                    optionLabel="label" optionValue="value" allowEmpty={false}
                    onChange={(e) => setMaterial(e.value)} />
                {books ? (
                    <Dropdown aria-label="Genre" ariaLabel="Genre" value={genre} options={genreOptions} optionLabel="label" optionValue="value"
                        onChange={(e) => setGenre(e.value)} className="w-auto" />
                ) : (
                    <Dropdown aria-label="Novellityyppi" ariaLabel="Novellityyppi" value={storyType} options={storyTypeOptions} optionLabel="label" optionValue="value"
                        onChange={(e) => setStoryType(e.value)} className="w-auto" />
                )}
            </FilterBar>
            <div className="grid">
                <div className="col-12 lg:col-6">
                    <NationalityCard material={material} genre={genre} storyTypeName={storyTypeName}
                        storyTypeId={storyType} roles={roleList} filterText={filterText} onDrill={setDrilldown} />
                </div>
                <div className="col-12 lg:col-6">
                    <TopPeopleCard material={material} genre={genre} storyType={storyType}
                        storyTypeName={storyTypeName} roles={roleList} />
                </div>
            </div>
            {books
                ? <WorksDrilldownDialog drilldown={drilldown} onHide={() => setDrilldown(null)} />
                : <StoriesDrilldownDialog drilldown={drilldown} onHide={() => setDrilldown(null)} />}
        </>
    );
};

const NationalityCard = ({ material, genre, storyTypeName, storyTypeId, roles, filterText, onDrill }: {
    material: Material;
    genre: string;
    storyTypeName: string | null;
    storyTypeId: number | 'all';
    roles: Role[];
    filterText: string;
    onDrill: (d: Drilldown) => void;
}) => {
    const books = material === 'books';
    const [role, setRole] = useState('kirjoittaja');
    const genreIds = useGenreIds();
    const data = useStatsQuery<NationalityCount[]>(books ? 'stats/nationalitycounts' : 'stats/storynationalitycounts');

    const roleOptions = useMemo(() => [
        { label: 'Kaikki roolit', value: 'all' },
        ...roles.map(r => ({ label: capitalise(r.name), value: r.name.toLowerCase() })),
    ], [roles]);
    // A role that doesn't exist for this material falls back to all roles.
    const activeRole = roleOptions.some(o => o.value === role) ? role : 'all';

    const items = useMemo(() => {
        // Breakdown key: genre abbreviation or capitalised story type name.
        const sub = books ? (genre === 'all' ? null : genre) : (storyTypeName ? capitalise(storyTypeName) : null);
        const roleKey = capitalise(activeRole);
        const countOf = (item: NationalityCount) => {
            const breakdown = (books ? item.genres : item.storytypes) ?? {};
            if (!sub && activeRole === 'all') return item.count;
            const parts = sub ? [breakdown[sub] ?? {}] : Object.values(breakdown);
            return parts.reduce((sum, roles) => sum + (activeRole === 'all'
                ? Object.values(roles).reduce((a, b) => a + b, 0)
                : roles[roleKey] ?? 0), 0);
        };
        return (data.data ?? [])
            .filter(i => i.nationality && i.nationality_id !== null)
            .map(i => ({ id: i.nationality_id, label: i.nationality!, count: countOf(i) }));
    }, [data.data, books, genre, storyTypeName, activeRole]);

    const select = (item: { id: number | null; label: string; count: number }) => {
        if (item.id === null) return;
        const params = new URLSearchParams({ nationality: String(item.id) });
        const roleId = roles.find(r => r.name.toLowerCase() === activeRole)?.id;
        if (roleId) params.append('role', String(roleId));
        if (books && genre !== 'all' && genreIds.get(genre)) params.append('genre', String(genreIds.get(genre)));
        if (!books && storyTypeId !== 'all') params.append('storytype', String(storyTypeId));
        onDrill({ title: `${item.label} (${fmt(item.count)} henkilöä)${filterText}`, params });
    };

    return (
        <StatCard
            title="Kansallisuudet"
            subtitle={`Henkilöitä kansallisuuden mukaan${books ? ' (kirjat)' : ' (novellit)'}. Henkilö lasketaan kerran kussakin roolissaan, kun rooleja ei rajata.`}
            controls={
                <Dropdown aria-label="Rooli (kansallisuudet)" ariaLabel="Rooli (kansallisuudet)" value={activeRole} options={roleOptions} optionLabel="label" optionValue="value"
                    onChange={(e) => setRole(e.value)} className="w-auto" />
            }
        >
            {data.isLoading ? (
                <div className="flex justify-content-center p-4"><ProgressSpinner /></div>
            ) : (
                <RankedBarChart items={items} topN={15} unit="henkilöä" itemHeader="Kansallisuus"
                    ariaLabel="Henkilöt kansallisuuksittain" onSelect={select} />
            )}
        </StatCard>
    );
};

const TopPeopleCard = ({ material, genre, storyType, storyTypeName, roles }: {
    material: Material;
    genre: string;
    storyType: number | 'all';
    storyTypeName: string | null;
    roles: Role[];
}) => {
    const theme = useChartTheme();
    const books = material === 'books';
    const [role, setRole] = useState(1);
    const [count, setCount] = useState(10);
    const activeRole = roles.some(r => r.id === role) ? role : 1;

    const path = books
        ? `stats/personcounts?count=${count}&role=${activeRole}${genre === 'all' ? '' : `&genre=${encodeURIComponent(genre)}`}`
        : `stats/storypersoncounts?count=${count}&role=${activeRole}${storyType === 'all' ? '' : `&storytype=${storyType}`}`;
    const people = useStatsQuery<PersonCount[]>(path);

    const rows = useMemo(() => (people.data ?? [])
        .filter(p => p.name !== 'Muut')
        .map(p => {
            let n = p.total;
            if (books && genre !== 'all') {
                n = Object.values(p.genres?.[genre] ?? {}).reduce((a, b) => a + b, 0);
            }
            return { ...p, count: n };
        })
        .filter(p => p.count > 0)
        .sort((a, b) => b.count - a.count), [people.data, books, genre]);
    const max = Math.max(1, ...rows.map(r => r.count));

    const roleName = roles.find(r => r.id === activeRole)?.name ?? 'kirjoittaja';
    const unit = capitalise(books ? 'teoksia'
        : (storyTypeName ? STORY_TYPE_PLURALS[storyTypeName.toLowerCase()] ?? storyTypeName : 'novelleja'));

    return (
        <StatCard
            title={`Tuotteliaimmat henkilöt (${count})`}
            subtitle={books ? 'Teoksia henkilöä kohden valitussa roolissa.' : 'Novelleja henkilöä kohden valitussa roolissa.'}
            controls={<>
                <Dropdown aria-label="Rooli" ariaLabel="Rooli" value={activeRole}
                    options={roles.map(r => ({ label: capitalise(r.name), value: r.id }))} optionLabel="label" optionValue="value"
                    onChange={(e) => setRole(e.value)} className="w-auto" />
                <div className="flex align-items-center gap-2">
                    <span id="top-people-count" className="text-sm">Määrä: {count}</span>
                    <Slider aria-labelledby="top-people-count" value={count}
                        onChange={(e) => setCount(e.value as number)} min={10} max={100} step={10} className="w-8rem" />
                </div>
            </>}
        >
            {people.isLoading ? (
                <div className="flex justify-content-center p-4"><ProgressSpinner /></div>
            ) : (
                <DataTable value={rows} stripedRows size="small" scrollable scrollHeight="480px" dataKey="name">
                    <Column header="#" body={(_r, opts) => opts.rowIndex + 1} style={{ width: '3rem' }} />
                    <Column field="name" header={capitalise(roleName)}
                        body={(p: PersonCount) => p.id
                            ? <a href={`/people/${p.id}`}>{p.alt_name || p.name}</a>
                            : (p.alt_name || p.name)} />
                    <Column field="count" header={unit} style={{ width: '45%' }}
                        body={(p: { count: number }) => (
                            <div className="flex align-items-center gap-2">
                                <span className="text-right" style={{ minWidth: '3rem' }}>{fmt(p.count)}</span>
                                <div className="flex-1">
                                    <div style={{
                                        height: '0.625rem', borderRadius: '0 3px 3px 0',
                                        width: `${(p.count / max) * 100}%`, minWidth: '2px',
                                        background: theme.series[0],
                                    }} aria-hidden="true" />
                                </div>
                            </div>
                        )} />
                </DataTable>
            )}
        </StatCard>
    );
};
