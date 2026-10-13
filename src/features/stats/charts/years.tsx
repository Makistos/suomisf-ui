import { useMemo } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { SelectButton } from 'primereact/selectbutton';

// Years before this are rare; the default range starts here, earlier years
// stay selectable.
export const DEFAULT_START_YEAR = 1900;

export interface YearRange {
    start: number;
    end: number;
    decades: boolean;
}

// Bucket a year falls in: the year itself, or the first year of its decade.
export const bucketOf = (year: number, decades: boolean) =>
    decades ? Math.floor(year / 10) * 10 : year;

export const bucketLabel = (bucket: number, decades: boolean) =>
    decades ? `${bucket}-luku` : String(bucket);

// Every bucket in the range, including empty ones, so the time axis is even.
export const bucketsIn = ({ start, end, decades }: YearRange) => {
    const buckets: number[] = [];
    const step = decades ? 10 : 1;
    for (let b = bucketOf(start, decades); b <= end; b += step) buckets.push(b);
    return buckets;
};

// First and last year a bucket covers inside the range (for drill-downs).
export const bucketYears = (bucket: number, { start, end, decades }: YearRange) =>
    decades
        ? { min: Math.max(bucket, start), max: Math.min(bucket + 9, end) }
        : { min: bucket, max: bucket };

export const yearSpanLabel = (min: number, max: number) =>
    min === max ? String(min) : `${min}–${max}`;

// Smallest and largest year in some data, for the range dropdowns.
export const yearBounds = (...datasets: { year: number }[][]) => {
    const years = datasets.flat().map(d => d.year).filter(y => y > 0);
    if (years.length === 0) return { min: DEFAULT_START_YEAR, max: new Date().getFullYear() };
    return { min: Math.min(...years), max: Math.max(...years) };
};

const resolutionOptions = [
    { label: 'Vuosittain', value: false },
    { label: 'Vuosikymmenittäin', value: true },
];

interface YearRangeFilterProps {
    value: YearRange;
    min: number;
    max: number;
    onChange: (value: YearRange) => void;
}

// Start and end year plus yearly/decade resolution, for a tab's FilterBar.
export const YearRangeFilter = ({ value, min, max, onChange }: YearRangeFilterProps) => {
    const options = useMemo(() => {
        const opts = [];
        for (let y = min; y <= max; y++) opts.push({ label: String(y), value: y });
        return opts;
    }, [min, max]);
    return (
        <>
            <div className="flex align-items-center gap-2">
                <label htmlFor="stats-start-year">Alku:</label>
                <Dropdown
                    inputId="stats-start-year"
                    ariaLabel="Alkuvuosi"
                    value={value.start}
                    options={options} optionLabel="label" optionValue="value"
                    onChange={(e) => onChange({ ...value, start: e.value, end: Math.max(e.value, value.end) })}
                    filter
                    className="w-auto"
                />
            </div>
            <div className="flex align-items-center gap-2">
                <label htmlFor="stats-end-year">Loppu:</label>
                <Dropdown
                    inputId="stats-end-year"
                    ariaLabel="Loppuvuosi"
                    value={value.end}
                    options={options} optionLabel="label" optionValue="value"
                    onChange={(e) => onChange({ ...value, end: e.value, start: Math.min(e.value, value.start) })}
                    filter
                    className="w-auto"
                />
            </div>
            <SelectButton
                aria-label="Tarkkuus"
                value={value.decades}
                options={resolutionOptions}
                optionLabel="label"
                optionValue="value"
                allowEmpty={false}
                onChange={(e) => onChange({ ...value, decades: e.value })}
            />
        </>
    );
};
