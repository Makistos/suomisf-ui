import { useMemo, useState } from 'react';
import { Card } from 'primereact/card';
import { SelectButton } from 'primereact/selectbutton';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useQuery } from '@tanstack/react-query';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale,
    BarElement, LineElement, PointElement, ArcElement,
    Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { getApiContent } from '../../../services/user-service';
import { getCurrenUser } from '../../../services/auth-service';

ChartJS.register(
    CategoryScale, LinearScale,
    BarElement, LineElement, PointElement, ArcElement,
    Title, Tooltip, Legend, Filler,
);

interface DailyRow { date: string; visitors: number; pageviews: number; }
interface LocationRow { location: string; visitors: number; }
interface BreakdownItem { label: string; count: number; }
interface Breakdown { browsers: BreakdownItem[]; os: BreakdownItem[]; devices: BreakdownItem[]; operators: BreakdownItem[]; }

const DAY_OPTIONS = [
    { label: '30 pv', value: 30 },
    { label: '60 pv', value: 60 },
    { label: '90 pv', value: 90 },
];

const PALETTE = [
    '#0958D7', '#D30031', '#DAA520', '#31572C', '#7B2D8E',
    '#E67E22', '#17A2B8', '#FF696D', '#82C341', '#6C757D',
];

const DEVICE_LABELS: Record<string, string> = {
    desktop: 'Tietokone',
    mobile: 'Puhelin',
    tablet: 'Tabletti',
};

export const VisitorStats = () => {
    const user = getCurrenUser();
    const [days, setDays] = useState(30);

    const daily = useQuery<DailyRow[]>({
        queryKey: ['stats', 'visitors', 'daily', days],
        queryFn: async () => (await getApiContent(`stats/visitors/daily?days=${days}`, user)).data,
    });

    const locations = useQuery<LocationRow[]>({
        queryKey: ['stats', 'visitors', 'locations'],
        queryFn: async () => (await getApiContent('stats/visitors/locations', user)).data,
    });

    const breakdown = useQuery<Breakdown>({
        queryKey: ['stats', 'visitors', 'breakdown'],
        queryFn: async () => (await getApiContent('stats/visitors/breakdown', user)).data,
    });

    const totalVisitors = useMemo(
        () => daily.data?.reduce((s, d) => s + d.visitors, 0) ?? 0,
        [daily.data],
    );
    const totalPageviews = useMemo(
        () => daily.data?.reduce((s, d) => s + d.pageviews, 0) ?? 0,
        [daily.data],
    );

    const dailyChartData = useMemo(() => ({
        labels: daily.data?.map(d => d.date) ?? [],
        datasets: [
            {
                label: 'Kävijät',
                data: daily.data?.map(d => d.visitors) ?? [],
                borderColor: '#0958D7',
                backgroundColor: 'rgba(9,88,215,0.1)',
                fill: true, tension: 0.3,
            },
            {
                label: 'Sivulataukset',
                data: daily.data?.map(d => d.pageviews) ?? [],
                borderColor: '#D30031',
                backgroundColor: 'rgba(211,0,49,0.08)',
                fill: true, tension: 0.3,
            },
        ],
    }), [daily.data]);

    const locationChartData = useMemo(() => ({
        labels: locations.data?.map(c => c.location) ?? [],
        datasets: [{
            label: 'Kävijät',
            data: locations.data?.map(c => c.visitors) ?? [],
            backgroundColor: '#0958D7',
        }],
    }), [locations.data]);

    const doughnutData = (items: BreakdownItem[] | undefined, labelMap?: Record<string, string>) => ({
        labels: items?.map(i => labelMap?.[i.label] ?? i.label) ?? [],
        datasets: [{ data: items?.map(i => i.count) ?? [], backgroundColor: PALETTE }],
    });

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'right' as const } },
    };

    if (daily.isLoading || locations.isLoading || breakdown.isLoading) {
        return <div className="flex justify-content-center p-4"><ProgressSpinner /></div>;
    }

    const locationBarHeight = Math.max(200, (locations.data?.length ?? 0) * 28 + 40);

    return (
        <div className="flex flex-column gap-3">

            {/* Summary */}
            <div className="flex gap-3 flex-wrap">
                <Card className="flex-1 text-center shadow-1">
                    <div className="text-4xl font-bold text-primary">{totalVisitors.toLocaleString('fi-FI')}</div>
                    <div className="text-500 mt-1">Kävijää ({days} pv)</div>
                </Card>
                <Card className="flex-1 text-center shadow-1">
                    <div className="text-4xl font-bold text-primary">{totalPageviews.toLocaleString('fi-FI')}</div>
                    <div className="text-500 mt-1">Sivulatausta ({days} pv)</div>
                </Card>
            </div>

            {/* Daily trend */}
            <Card className="shadow-1">
                <div className="flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <h3 className="m-0">Kävijät päivittäin</h3>
                    <SelectButton
                        value={days}
                        options={DAY_OPTIONS}
                        optionLabel="label"
                        optionValue="value"
                        onChange={e => setDays(e.value)}
                    />
                </div>
                <div style={{ height: '250px' }}>
                    <Line
                        data={dailyChartData}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { position: 'top' } },
                            scales: { y: { beginAtZero: true } },
                        }}
                    />
                </div>
            </Card>

            {/* Countries + device/OS doughnuts */}
            <div className="flex gap-3 flex-wrap">
                <Card className="shadow-1" style={{ flex: '2 1 360px' }}>
                    <h3 className="mt-0 mb-3">Sijainnit (90 pv)</h3>
                    <div style={{ height: `${locationBarHeight}px` }}>
                        <Bar
                            data={locationChartData}
                            options={{
                                indexAxis: 'y',
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: { x: { beginAtZero: true } },
                            }}
                        />
                    </div>
                </Card>

                <div className="flex flex-column gap-3" style={{ flex: '1 1 220px' }}>
                    <Card className="shadow-1">
                        <h3 className="mt-0 mb-2">Laitetyyppi</h3>
                        <div style={{ height: '140px' }}>
                            <Doughnut
                                data={doughnutData(breakdown.data?.devices, DEVICE_LABELS)}
                                options={doughnutOptions}
                            />
                        </div>
                    </Card>
                    <Card className="shadow-1">
                        <h3 className="mt-0 mb-2">Käyttöjärjestelmä</h3>
                        <div style={{ height: '170px' }}>
                            <Doughnut
                                data={doughnutData(breakdown.data?.os)}
                                options={doughnutOptions}
                            />
                        </div>
                    </Card>
                </div>
            </div>

            {/* Browser + operator breakdown */}
            <div className="flex gap-3 flex-wrap">
                <Card className="shadow-1" style={{ flex: '1 1 300px' }}>
                    <h3 className="mt-0 mb-3">Selaimet (90 pv)</h3>
                    <div style={{ height: '260px' }}>
                        <Bar
                            data={{
                                labels: breakdown.data?.browsers.map(b => b.label) ?? [],
                                datasets: [{
                                    label: 'Käyttökerrat',
                                    data: breakdown.data?.browsers.map(b => b.count) ?? [],
                                    backgroundColor: PALETTE,
                                }],
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: { y: { beginAtZero: true } },
                            }}
                        />
                    </div>
                </Card>

                <Card className="shadow-1" style={{ flex: '1 1 300px' }}>
                    <h3 className="mt-0 mb-3">Operaattorit (90 pv)</h3>
                    <div style={{ height: '260px' }}>
                        <Bar
                            data={{
                                labels: breakdown.data?.operators.map(o => o.label) ?? [],
                                datasets: [{
                                    label: 'Käyttökerrat',
                                    data: breakdown.data?.operators.map(o => o.count) ?? [],
                                    backgroundColor: PALETTE,
                                }],
                            }}
                            options={{
                                indexAxis: 'y',
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: { x: { beginAtZero: true } },
                            }}
                        />
                    </div>
                </Card>
            </div>

        </div>
    );
};
