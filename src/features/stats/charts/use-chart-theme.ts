import { useEffect, useMemo, useState } from 'react';
import { Chart as ChartJS } from 'chart.js';
import { OTHER_DARK, OTHER_LIGHT, SERIES_DARK, SERIES_LIGHT } from './palette';

const DARK_QUERY = '(prefers-color-scheme: dark)';

const prefersDark = () =>
    typeof window !== 'undefined' && !!window.matchMedia?.(DARK_QUERY).matches;

// The site follows the system theme (see DESIGN.md), so charts do too.
const usePrefersDark = () => {
    const [dark, setDark] = useState(prefersDark);
    useEffect(() => {
        const media = window.matchMedia?.(DARK_QUERY);
        if (!media) return;
        const onChange = (e: MediaQueryListEvent) => setDark(e.matches);
        media.addEventListener('change', onChange);
        return () => media.removeEventListener('change', onChange);
    }, []);
    return dark;
};

export interface ChartTheme {
    dark: boolean;
    text: string;
    textSecondary: string;
    grid: string;
    surface: string;
    // Categorical slots, in validated order.
    series: string[];
    // "Muut" and other de-emphasised marks.
    other: string;
}

const cssVar = (name: string, fallback: string) => {
    if (typeof document === 'undefined') return fallback;
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
};

// Chart colours that follow the light/dark theme. Text, grid and surface come
// from the PrimeReact theme variables; Chart.js defaults are updated too, so
// charts elsewhere on the site pick up readable axis text in the dark theme.
export const useChartTheme = (): ChartTheme => {
    const dark = usePrefersDark();
    const theme = useMemo((): ChartTheme => ({
        dark,
        text: cssVar('--text-color', dark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)'),
        textSecondary: cssVar('--text-color-secondary', dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'),
        grid: cssVar('--surface-border', dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'),
        surface: cssVar('--surface-card', dark ? '#1e1e1e' : '#ffffff'),
        series: dark ? SERIES_DARK : SERIES_LIGHT,
        other: dark ? OTHER_DARK : OTHER_LIGHT,
    }), [dark]);
    useEffect(() => {
        ChartJS.defaults.color = theme.textSecondary;
        ChartJS.defaults.borderColor = theme.grid;
    }, [theme]);
    return theme;
};

// Shared Chart.js options: recessive grid, theme text, Finnish numbers.
export const baseChartOptions = (theme: ChartTheme) => ({
    responsive: true,
    maintainAspectRatio: false,
    locale: 'fi-FI',
    color: theme.textSecondary,
    plugins: {
        legend: {
            labels: { color: theme.text, usePointStyle: true, boxWidth: 8 },
        },
        tooltip: {
            backgroundColor: theme.dark ? '#2c2c2c' : 'rgba(33,33,33,0.92)',
        },
    },
});

export const axisColours = (theme: ChartTheme) => ({
    ticks: { color: theme.textSecondary },
    grid: { color: theme.grid },
    border: { color: theme.grid },
});
