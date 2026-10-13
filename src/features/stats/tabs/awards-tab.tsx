// Awards: recorded winners per award, how long foreign winners took to
// reach Finnish, and the most awarded writers. Only winners that are in
// the bibliography are recorded, so every winner here exists in Finnish.

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SelectButton } from 'primereact/selectbutton';
import { ProgressSpinner } from 'primereact/progressspinner';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import {
    AwardCount, AwardLag, AwardedPerson, Histogram, HistogramBin, RankedBarChart, StatCard,
    useChartTheme, useStatsQuery,
} from '../charts';

const fmt = (n: number) => n.toLocaleString('fi-FI');
const num = (n: number) => n.toLocaleString('fi-FI', { maximumFractionDigits: 1 });

const Loading = () => <div className="flex justify-content-center p-4"><ProgressSpinner /></div>;

// Awards with fewer winners are left out of the per-award delay table.
const MIN_WINNERS = 5;
// The delay bars' scale in years; values outside are drawn at the edge
// (a few awards, e.g. Retro Hugo, go far below zero).
const SCALE_MIN = -10;
const SCALE_MAX = 20;

export const AwardsTab = () => (
    <>
        <p className="mt-0">
            Kantaan on tallennettu vain ne palkitut, jotka löytyvät bibliografiasta, eli jotka on
            julkaistu suomeksi. Siksi palkintojen suomennettujen osuutta ei voi laskea.
        </p>
        <div className="grid">
            <div className="col-12 lg:col-6">
                <AwardCountsCard />
            </div>
            <div className="col-12 lg:col-6">
                <TopAwardedCard />
            </div>
            <div className="col-12 lg:col-5">
                <AwardLagCard />
            </div>
            <div className="col-12 lg:col-7">
                <AwardLagByAwardCard />
            </div>
        </div>
    </>
);

const scopeOptions = [
    { label: 'Kaikki', value: 'all' },
    { label: 'Ulkomaiset', value: 'foreign' },
    { label: 'Kotimaiset', value: 'domestic' },
];

const AwardCountsCard = () => {
    const [scope, setScope] = useState<'all' | 'foreign' | 'domestic'>('all');
    const data = useStatsQuery<AwardCount[]>('stats/awardcounts');
    const items = useMemo(() => (data.data ?? [])
        .filter(a => scope === 'all' || (scope === 'domestic') === !!a.domestic)
        .map(a => ({ id: a.id, label: a.name, count: a.total })), [data.data, scope]);

    return (
        <StatCard title="Palkitut palkinnoittain"
            subtitle="Tallennettuja palkintoja: palkittuja teoksia, novelleja ja henkilöitä (esim. elämäntyöpalkinnot)."
            controls={
                <SelectButton aria-label="Palkinnot" value={scope} options={scopeOptions}
                    optionLabel="label" optionValue="value" allowEmpty={false}
                    onChange={(e) => setScope(e.value)} />
            }>
            {!data.data ? <Loading /> : (
                <RankedBarChart items={items} topN={20} unit="palkintoa" itemHeader="Palkinto"
                    ariaLabel="Palkitut palkinnoittain"
                    nameTemplate={(item) => item.id === null ? item.label : <Link to={`/awards/${item.id}`}>{item.label}</Link>} />
            )}
        </StatCard>
    );
};

const lagBins = (lags: AwardLag['lags']): HistogramBin[] => {
    const bins = [
        { min: -Infinity, max: -1, label: 'ennen' },
        ...Array.from({ length: 10 }, (_, i) => ({ min: i, max: i, label: String(i) })),
        { min: 10, max: 19, label: '10–19' },
        { min: 20, max: Infinity, label: '20+' },
    ];
    return bins.map((b, i) => ({
        key: i,
        label: b.label,
        count: lags.reduce((sum, l) => l.lag >= b.min && l.lag <= b.max ? sum + l.count : sum, 0),
    }));
};

const AwardLagCard = () => {
    const data = useStatsQuery<AwardLag>('stats/awardlag');
    const d = data.data;
    return (
        <StatCard title="Palkinnosta suomennokseen"
            subtitle={d
                ? `Vuosia ulkomaisesta palkinnosta ensimmäiseen suomenkieliseen julkaisuun, ${fmt(d.total)} palkittua teosta tai novellia; mediaani ${d.median === null ? '–' : num(d.median)} vuotta. "Ennen" = suomennos ilmestyi ennen palkintoa.`
                : 'Vuosia ulkomaisesta palkinnosta ensimmäiseen suomenkieliseen julkaisuun.'}>
            {!d ? <Loading /> : (
                <Histogram bins={lagBins(d.lags)} unit="palkittua" binTitle="Vuosia palkinnosta"
                    axisTitle="Palkittuja" ariaLabel="Palkinnosta suomennokseen kuluneet vuodet" />
            )}
        </StatCard>
    );
};

// Per award: the middle half of the delays as a band, the median as a tick,
// on a shared scale.
const AwardLagByAwardCard = () => {
    const theme = useChartTheme();
    const data = useStatsQuery<AwardLag>('stats/awardlag');
    const rows = useMemo(() => (data.data?.by_award ?? []).filter(a => a.count >= MIN_WINNERS), [data.data]);
    const clamp = (v: number) => Math.min(SCALE_MAX, Math.max(SCALE_MIN, v));
    const pos = (v: number) => `${(clamp(v) - SCALE_MIN) / (SCALE_MAX - SCALE_MIN) * 100}%`;

    return (
        <StatCard title="Viive palkinnoittain"
            subtitle={`Vuosia palkinnosta suomennokseen palkinnoittain (vähintään ${MIN_WINNERS} palkittua). Palkki on keskimmäinen puolikas ja viiva mediaani asteikolla ${num(SCALE_MIN)}…${num(SCALE_MAX)} vuotta; sen ulkopuoliset arvot piirretään reunaan. Negatiivinen luku: suomennos ilmestyi ennen palkintoa.`}>
            {!data.data ? <Loading /> : (
                <DataTable value={rows} size="small" stripedRows dataKey="id">
                    <Column header="Palkinto" body={(r: AwardLag['by_award'][number]) => <Link to={`/awards/${r.id}`}>{r.name}</Link>} />
                    <Column field="count" header="Palkittuja" style={{ textAlign: 'right', width: '6rem' }} />
                    <Column field="median" header="Mediaani" body={(r: { median: number }) => num(r.median)}
                        style={{ textAlign: 'right', width: '6rem' }} />
                    <Column header="Keskimmäinen puolikas" style={{ width: '40%' }}
                        body={(r: AwardLag['by_award'][number]) => (
                            <div className="flex align-items-center gap-2">
                                <span className="text-sm white-space-nowrap" style={{ minWidth: '6.5rem' }}>{num(r.q1)} … {num(r.q3)}</span>
                                <div className="flex-1 relative" style={{ height: '0.875rem' }} aria-hidden="true">
                                    <div className="absolute" style={{
                                        left: pos(0), width: '1px', top: 0, height: '100%', background: theme.grid,
                                    }} />
                                    <div className="absolute border-round" style={{
                                        left: pos(r.q1), width: `max(2px, calc(${pos(r.q3)} - ${pos(r.q1)}))`,
                                        top: '0.125rem', height: '0.625rem', background: `${theme.series[0]}66`,
                                    }} />
                                    <div className="absolute" style={{
                                        left: pos(r.median), width: '2px', top: 0, height: '100%', background: theme.series[0],
                                    }} />
                                </div>
                            </div>
                        )} />
                </DataTable>
            )}
        </StatCard>
    );
};

const TopAwardedCard = () => {
    const theme = useChartTheme();
    const data = useStatsQuery<AwardedPerson[]>('stats/topawarded');
    const rows = data.data ?? [];
    const max = Math.max(1, ...rows.map(r => r.awards));
    const parts = (p: AwardedPerson) => [
        p.works ? `${fmt(p.works)} teoksesta` : '',
        p.stories ? `${fmt(p.stories)} novellista` : '',
        p.personal ? `${fmt(p.personal)} henkilökohtainen` : '',
    ].filter(Boolean).join(', ');

    return (
        <StatCard title="Palkituimmat kirjailijat"
            subtitle="Henkilökohtaiset palkinnot sekä palkinnot kirjoittamistaan teoksista ja novelleista.">
            {!data.data ? <Loading /> : (
                <DataTable value={rows} size="small" stripedRows dataKey="id" scrollable scrollHeight="560px">
                    <Column header="#" body={(_r, opts) => opts.rowIndex + 1} style={{ width: '3rem' }} />
                    <Column header="Kirjailija" body={(p: AwardedPerson) => (
                        <div>
                            <Link to={`/people/${p.id}`}>{p.alt_name || p.name}</Link>
                            <div className="text-sm text-color-secondary">{parts(p)}</div>
                        </div>
                    )} />
                    <Column header="Palkintoja" style={{ width: '40%' }} body={(p: AwardedPerson) => (
                        <div className="flex align-items-center gap-2">
                            <span className="text-right" style={{ minWidth: '2.5rem' }}>{fmt(p.awards)}</span>
                            <div className="flex-1">
                                <div style={{
                                    height: '0.625rem', borderRadius: '0 3px 3px 0',
                                    width: `${(p.awards / max) * 100}%`, minWidth: '2px', background: theme.series[0],
                                }} aria-hidden="true" />
                            </div>
                        </div>
                    )} />
                </DataTable>
            )}
        </StatCard>
    );
};
