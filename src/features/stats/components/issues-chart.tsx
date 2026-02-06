import { useMemo } from 'react';
import { Card } from 'primereact/card';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface IssueYearCount {
    year: number;
    count: number;
}

interface IssuesChartProps {
    data: IssueYearCount[];
}

export const IssuesChart = ({ data }: IssuesChartProps) => {
    const chartData = useMemo(() => {
        const sortedData = [...data].sort((a, b) => a.year - b.year);

        return {
            labels: sortedData.map(item => String(item.year)),
            datasets: [
                {
                    label: 'Lehdet-numeroita vuosittain',
                    data: sortedData.map(item => item.count),
                    backgroundColor: '#0958D7',
                    borderColor: '#0958D7',
                    borderWidth: 1,
                }
            ]
        };
    }, [data]);

    const chartOptions = {
        indexAxis: 'x' as const,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        return `${context.parsed.y.toLocaleString('fi-FI')} numeroa`;
                    }
                }
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Lehdet-numeroita vuosittain'
                }
            },
            y: {
                title: {
                    display: false
                }
            }
        }
    };

    // Calculate height based on number of years
    const chartHeight = Math.max(300, data.length * 20 + 80);

    return (
        <div className="flex justify-content-center">
            <Card className="shadow-2 text-center w-full">
                <h2 className="mt-0 mb-4">Lehdet-numerot vuosittain</h2>
                <div style={{ height: `${chartHeight}px` }}>
                    <Bar data={chartData} options={chartOptions} />
                </div>
            </Card>
        </div>
    );
};
