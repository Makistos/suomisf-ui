import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Dropdown } from 'primereact/dropdown';
import { SelectButton } from 'primereact/selectbutton';
import { Slider } from 'primereact/slider';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ProgressSpinner } from 'primereact/progressspinner';
import {
    BirthDecades, COLOURED_NATIONALITIES, Contributor, Drilldown, FilterBar, GENRE_NAMES, Heatmap,
    HeatmapRow, Material, NATIONALITY_SLOTS, NationalityDecadeCount, NationalityPeople, OTHERS_LABEL,
    RankedBarChart, Series, StatCard, StoriesDrilldownDialog, TranslatorLanguage, WorksDrilldownDialog,
    YearColumnsChart, fromNationalities, genreOptions, statsParams, useChartTheme, useGenreIds,
    useStatsQuery,
} from '../charts';

interface Role {
    id: number;
    name: string;
}

interface StoryType {
    id: number;
    name: string;
}

const materialOptions = [
    { label: 'Kirjat', value: 'books' },
    { label: 'Novellit', value: 'stories' },
    { label: 'Kaikki', value: 'all' },
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

const Loading = () => <div className="flex justify-content-center p-4"><ProgressSpinner /></div>;

// The tab's filters, shared by its cards.
interface PeopleFilters {
    material: Material;
    genre: string;
    storyType: number | 'all';
    storyTypeName: string | null;
    // Role id, or 'all' for any role.
    role: number | 'all';
}

// What the cards count, by material: [unit after a number, plural header].
const itemWords = (f: PeopleFilters): [string, string] => {
    if (f.material === 'books') return ['teosta', 'Teoksia'];
    if (f.material === 'all') return ['teosta tai novellia', 'Teoksia ja novelleja'];
    const type = f.storyTypeName?.toLowerCase();
    return [type ? STORY_TYPE_UNITS[type] ?? 'novellia' : 'novellia',
        capitalise(type ? STORY_TYPE_PLURALS[type] ?? 'novelleja' : 'novelleja')];
};

const queryOf = (f: PeopleFilters, extra: Record<string, string | number | undefined> = {}) => statsParams({
    material: f.material,
    role: f.role,
    genre: f.material === 'books' ? f.genre : undefined,
    storytype: f.material === 'stories' ? f.storyType : undefined,
    ...extra,
}, ['material']);

export const PeopleTab = () => {
    const [material, setMaterial] = useState<Material>('books');
    const [genre, setGenre] = useState('all');
    const [storyType, setStoryType] = useState<number | 'all'>('all');
    const [role, setRole] = useState<number | 'all'>(1);
    const [drilldown, setDrilldown] = useState<Drilldown | null>(null);

    const roles = useStatsQuery<Role[]>('roles/');
    const storyTypes = useStatsQuery<StoryType[]>('shorttypes');

    const roleList = useMemo(() => {
        const bookRoles = (roles.data ?? []).filter(r => !EXCLUDED_ROLES.includes(r.name.toLowerCase()));
        return material === 'stories' ? STORY_ROLES : bookRoles;
    }, [material, roles.data]);
    // A role that doesn't exist for this material falls back to all roles.
    // (Until the role list has loaded, the chosen role stands.)
    const activeRole = role === 'all' || roleList.length === 0 || roleList.some(r => r.id === role) ? role : 'all';
    const storyTypeName = storyType === 'all' ? null
        : storyTypes.data?.find(t => t.id === storyType)?.name ?? null;

    const filters: PeopleFilters = { material, genre, storyType, storyTypeName, role: activeRole };

    const storyTypeOptions = useMemo(() => [
        { label: 'Kaikki tyypit', value: 'all' as const },
        ...(storyTypes.data ?? []).map(t => ({ label: capitalise(t.name), value: t.id })),
    ], [storyTypes.data]);
    const roleOptions = useMemo(() => [
        { label: 'Kaikki roolit', value: 'all' as const },
        ...roleList.map(r => ({ label: capitalise(r.name), value: r.id })),
    ], [roleList]);

    return (
        <>
            <FilterBar>
                <SelectButton aria-label="Aineisto" value={material} options={materialOptions}
                    optionLabel="label" optionValue="value" allowEmpty={false}
                    onChange={(e) => setMaterial(e.value)} />
                {material === 'books' && (
                    <Dropdown aria-label="Genre" ariaLabel="Genre" value={genre} options={genreOptions} optionLabel="label" optionValue="value"
                        onChange={(e) => setGenre(e.value)} className="w-auto" />
                )}
                {material === 'stories' && (
                    <Dropdown aria-label="Novellityyppi" ariaLabel="Novellityyppi" value={storyType} options={storyTypeOptions} optionLabel="label" optionValue="value"
                        onChange={(e) => setStoryType(e.value)} className="w-auto" />
                )}
                <div className="flex align-items-center gap-2">
                    <label htmlFor="people-role">Rooli:</label>
                    <Dropdown inputId="people-role" ariaLabel="Rooli" value={activeRole} options={roleOptions}
                        optionLabel="label" optionValue="value" onChange={(e) => setRole(e.value)} className="w-auto" />
                </div>
            </FilterBar>
            <div className="grid">
                <div className="col-12 lg:col-6">
                    <NationalityCard filters={filters} onDrill={setDrilldown} />
                </div>
                <div className="col-12 lg:col-6">
                    <TopPeopleCard filters={filters}
                        roleName={activeRole === 'all' ? null : roleList.find(r => r.id === activeRole)?.name ?? null} />
                </div>
                <div className="col-12">
                    <NationalityDecadesCard filters={filters} />
                </div>
                <div className="col-12 lg:col-6">
                    <BirthDecadesCard filters={filters} />
                </div>
                <div className="col-12 lg:col-6">
                    <TranslatorLanguagesCard filters={filters} />
                </div>
            </div>
            {material === 'stories'
                ? <StoriesDrilldownDialog drilldown={drilldown} onHide={() => setDrilldown(null)} />
                : <WorksDrilldownDialog drilldown={drilldown} onHide={() => setDrilldown(null)} />}
        </>
    );
};

const NationalityCard = ({ filters, onDrill }: { filters: PeopleFilters; onDrill: (d: Drilldown) => void }) => {
    const [mode, setMode] = useState<'people' | 'items'>('people');
    const genreIds = useGenreIds();
    const data = useStatsQuery<NationalityPeople[]>(`stats/contributornationalities${queryOf(filters)}`);
    const [unit, header] = itemWords(filters);
    const people = mode === 'people';
    const modeOptions = [
        { label: 'Henkilöt', value: 'people' },
        { label: header, value: 'items' },
    ];

    const items = useMemo(() => (data.data ?? [])
        .filter(i => i.nationality && i.nationality_id !== null)
        .map(i => ({ id: i.nationality_id, label: i.nationality!, count: people ? i.people : i.items })),
    [data.data, people]);
    const unknown = data.data?.find(i => i.nationality_id === null);

    // The lists behind a bar: works or stories with a contributor of the
    // nationality in the role. Not available for books and stories together.
    const select = filters.material === 'all' ? undefined : (item: { id: number | null; label: string; count: number }) => {
        if (item.id === null) return;
        const params = new URLSearchParams({ nationality: String(item.id) });
        if (filters.role !== 'all') params.append('role', String(filters.role));
        if (filters.material === 'books' && filters.genre !== 'all' && genreIds.get(filters.genre)) {
            params.append('genre', String(genreIds.get(filters.genre)));
        }
        if (filters.material === 'stories' && filters.storyType !== 'all') params.append('storytype', String(filters.storyType));
        const filterText = filters.material === 'books'
            ? (filters.genre === 'all' ? '' : ` · ${GENRE_NAMES[filters.genre]}`)
            : (filters.storyTypeName ? ` · ${filters.storyTypeName}` : '');
        onDrill({ title: `${item.label}${filterText}`, params });
    };

    return (
        <StatCard
            title="Kansallisuudet"
            subtitle={people
                ? `Henkilöitä kansallisuuden mukaan; kukin lasketaan kerran.${unknown ? ` Kansallisuus puuttuu ${fmt(unknown.people)} henkilöltä.` : ''}`
                : `${header} tekijän kansallisuuden mukaan. Kukin lasketaan kerran kullekin tekijöidensä kansallisuudelle.`}
            controls={
                <SelectButton aria-label="Henkilöt vai teokset" value={mode} options={modeOptions}
                    optionLabel="label" optionValue="value" allowEmpty={false}
                    onChange={(e) => setMode(e.value)} />
            }
        >
            {!data.data ? <Loading /> : (
                <RankedBarChart items={items} topN={15} unit={people ? 'henkilöä' : unit} itemHeader="Kansallisuus"
                    ariaLabel={people ? 'Henkilöt kansallisuuksittain' : `${header} tekijän kansallisuuden mukaan`}
                    onSelect={select} />
            )}
        </StatCard>
    );
};

const TopPeopleCard = ({ filters, roleName }: { filters: PeopleFilters; roleName: string | null }) => {
    const theme = useChartTheme();
    const [count, setCount] = useState(10);
    const people = useStatsQuery<Contributor[]>(`stats/topcontributors${queryOf(filters, { count })}`);
    const rows = people.data ?? [];
    const max = Math.max(1, ...rows.map(r => r.count));
    const [, header] = itemWords(filters);

    return (
        <StatCard
            title={`Tuotteliaimmat henkilöt (${count})`}
            subtitle={roleName
                ? `${header} henkilöä kohden valitussa roolissa.`
                : `${header} henkilöä kohden missä tahansa roolissa; kukin lasketaan henkilölle kerran.`}
            controls={
                <div className="flex align-items-center gap-2">
                    <span id="top-people-count" className="text-sm">Määrä: {count}</span>
                    <Slider aria-labelledby="top-people-count" value={count}
                        onChange={(e) => setCount(e.value as number)} min={10} max={100} step={10} className="w-8rem" />
                </div>
            }
        >
            {!people.data ? <Loading /> : (
                <DataTable value={rows} stripedRows size="small" scrollable scrollHeight="480px" dataKey="id">
                    <Column header="#" body={(_r, opts) => opts.rowIndex + 1} style={{ width: '3rem' }} />
                    <Column field="name" header={roleName ? capitalise(roleName) : 'Henkilö'}
                        body={(p: Contributor) => <Link to={`/people/${p.id}`}>{p.alt_name || p.name}</Link>} />
                    <Column field="count" header={header} style={{ width: '45%' }}
                        body={(p: Contributor) => (
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

const shareOptions = [
    { label: 'Määrä', value: false },
    { label: 'Osuus', value: true },
];

// First decade shown; earlier decades have only a handful of items.
const FIRST_DECADE = 1900;

const NationalityDecadesCard = ({ filters }: { filters: PeopleFilters }) => {
    const theme = useChartTheme();
    const [share, setShare] = useState(true);
    const data = useStatsQuery<NationalityDecadeCount[]>(`stats/nationalitiesbydecade${queryOf(filters)}`);
    const [unit, header] = itemWords(filters);
    // Unknown nationality is left out rather than shown as "Muut".
    const rows = useMemo(() => fromNationalities(data.data).filter(r => r.group_name), [data.data]);
    const range = useMemo(() => ({
        start: FIRST_DECADE,
        end: Math.max(FIRST_DECADE, ...rows.map(r => r.year)) + 9,
        decades: true,
    }), [rows]);
    const series: Series[] = COLOURED_NATIONALITIES.map(n => ({
        key: n, label: n, color: theme.series[NATIONALITY_SLOTS[n]], id: null,
    }));

    return (
        <StatCard
            title="Kansallisuudet vuosikymmenittäin"
            subtitle={`${header} tekijän kansallisuuden ja ensimmäisen suomenkielisen julkaisun vuosikymmenen mukaan. Kukin lasketaan kerran kullekin tekijöidensä kansallisuudelle; tuntemattomat kansallisuudet jätetään pois.`}
            controls={
                <SelectButton aria-label="Määrä vai osuus" value={share} options={shareOptions}
                    optionLabel="label" optionValue="value" allowEmpty={false}
                    onChange={(e) => setShare(e.value)} />
            }
        >
            {!data.data ? <Loading /> : (
                <YearColumnsChart rows={rows} range={range} series={series} showOthers
                    othersColor={theme.other} share={share} unit={unit} axisTitle={header}
                    ariaLabel="Kansallisuudet vuosikymmenittäin" />
            )}
        </StatCard>
    );
};

// Births before this go into one first bar.
const FIRST_BIRTH_DECADE = 1800;

const BirthDecadesCard = ({ filters }: { filters: PeopleFilters }) => {
    const theme = useChartTheme();
    const data = useStatsQuery<BirthDecades>(`stats/birthdecades${queryOf(filters)}`);
    const d = data.data;
    const rows = useMemo(() => (d?.decades ?? []).map(x => ({
        year: Math.max(x.decade, FIRST_BIRTH_DECADE), count: x.count, group_id: null, group_name: null,
    })), [d]);
    const earlier = (d?.decades ?? []).filter(x => x.decade < FIRST_BIRTH_DECADE).reduce((s, x) => s + x.count, 0);
    const range = useMemo(() => ({
        start: FIRST_BIRTH_DECADE,
        end: Math.max(FIRST_BIRTH_DECADE, ...rows.map(r => r.year)) + 9,
        decades: true,
    }), [rows]);
    const coverage = d && d.people ? d.with_birth_year / d.people * 100 : 0;

    return (
        <StatCard
            title="Syntymävuosikymmenet"
            subtitle={d
                ? `Henkilöitä syntymävuosikymmenen mukaan. Syntymävuosi tiedetään ${fmt(d.with_birth_year)} henkilöltä ${fmt(d.people)}:sta (${coverage.toLocaleString('fi-FI', { maximumFractionDigits: 0 })} %).${earlier ? ` Ennen vuotta ${FIRST_BIRTH_DECADE} syntyneet (${fmt(earlier)}) ovat ensimmäisessä pylväässä.` : ''}`
                : 'Henkilöitä syntymävuosikymmenen mukaan.'}
        >
            {!d ? <Loading /> : (
                <YearColumnsChart rows={rows} range={range}
                    series={[{ key: '*', label: 'Henkilöt', color: theme.series[0], id: null }]}
                    showOthers={false} othersColor={theme.other} unit="henkilöä" axisTitle="Henkilöitä"
                    ariaLabel="Henkilöt syntymävuosikymmenen mukaan" />
            )}
        </StatCard>
    );
};

// Original languages shown as their own column; the rest are "Muut".
const TRANSLATOR_LANGUAGES = 7;

const TranslatorLanguagesCard = ({ filters }: { filters: PeopleFilters }) => {
    const data = useStatsQuery<TranslatorLanguage[]>(
        `stats/translatorlanguages${queryOf({ ...filters, role: 'all' })}`);
    const [unit, header] = itemWords(filters);

    const { rows, columns } = useMemo(() => {
        const list = data.data ?? [];
        const languageTotals = new Map<string, number>();
        const personTotals = new Map<number, { label: string; total: number }>();
        list.forEach(r => {
            const lang = r.language_name ?? OTHERS_LABEL;
            languageTotals.set(lang, (languageTotals.get(lang) ?? 0) + r.count);
            const p = personTotals.get(r.person_id) ?? { label: r.alt_name || r.name, total: 0 };
            p.total += r.count;
            personTotals.set(r.person_id, p);
        });
        const languages = [...languageTotals.entries()]
            .filter(([l]) => l !== OTHERS_LABEL)
            .sort((a, b) => b[1] - a[1])
            .slice(0, TRANSLATOR_LANGUAGES)
            .map(([l]) => l);
        const hasOthers = [...languageTotals.keys()].some(l => !languages.includes(l));
        const cols = [...languages, ...(hasOthers ? [OTHERS_LABEL] : [])];
        const heatmapRows: HeatmapRow[] = [...personTotals.entries()]
            .sort((a, b) => b[1].total - a[1].total)
            .map(([id, p]) => {
                const values = cols.map(() => 0);
                list.filter(r => r.person_id === id).forEach(r => {
                    const i = cols.indexOf(r.language_name && languages.includes(r.language_name) ? r.language_name : OTHERS_LABEL);
                    values[i] += r.count;
                });
                return { id, label: p.label, values };
            });
        return { rows: heatmapRows, columns: cols.map((c, i) => ({ key: i, label: c })) };
    }, [data.data]);

    return (
        <StatCard
            title="Kääntäjät lähdekielittäin"
            subtitle={`${header} alkukielen mukaan, ${rows.length} tuotteliainta kääntäjää. Rooli-suodatin ei vaikuta tähän.`}
        >
            {!data.data ? <Loading /> : (
                <Heatmap rows={rows} columns={columns} unit={unit} rowHeader="Kääntäjä"
                    caption="Kääntäjät lähdekielittäin" verticalLabels />
            )}
        </StatCard>
    );
};
