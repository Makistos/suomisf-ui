import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getApiContent } from '../../../services/user-service';
import { getCurrenUser } from '../../../services/auth-service';
import { Genre } from '../../genre';
import { GroupYearCount } from './year-columns-chart';

// Shapes returned by the /api/stats endpoints.

export interface LanguageYearCount {
    year: number;
    count: number;
    language_id: number | null;
    language_name: string | null;
}

export interface PublisherYearCount {
    year: number;
    count: number;
    publisher_id: number;
    publisher_name: string;
}

export interface MagazineYearCount {
    year: number;
    count: number;
    magazine_id: number;
    magazine_name: string;
}

export const fromLanguages = (data: LanguageYearCount[] = []): GroupYearCount[] =>
    data.map(d => ({ year: d.year, count: d.count, group_id: d.language_id, group_name: d.language_name }));

export const fromPublishers = (data: PublisherYearCount[] = []): GroupYearCount[] =>
    data.map(d => ({ year: d.year, count: d.count, group_id: d.publisher_id, group_name: d.publisher_name }));

export const fromMagazines = (data: MagazineYearCount[] = []): GroupYearCount[] =>
    data.map(d => ({ year: d.year, count: d.count, group_id: d.magazine_id, group_name: d.magazine_name }));

// GET /api/<path>, cached by path.
export const useStatsQuery = <T,>(path: string, enabled = true) => {
    const user = useMemo(() => getCurrenUser(), []);
    return useQuery<T>({
        queryKey: ['stats', path],
        queryFn: async () => (await getApiContent(path, user)).data,
        enabled,
    });
};

// Genre abbreviation -> id, for drill-down filters (filterworks takes ids).
export const useGenreIds = () => {
    const genres = useStatsQuery<Genre[]>('genres');
    return useMemo(() => {
        const map = new Map<string, number>();
        genres.data?.forEach(g => map.set(g.abbr, g.id));
        return map;
    }, [genres.data]);
};

// Query string fragment for an optional genre filter.
export const genreParam = (genre: string, prefix = '?') =>
    genre === 'all' ? '' : `${prefix}genre=${encodeURIComponent(genre)}`;

// Totals per group over all rows, biggest first.
export const groupTotals = (rows: GroupYearCount[]) => {
    const totals = new Map<string, { id: number | null; total: number }>();
    rows.forEach(r => {
        if (!r.group_name) return;
        const t = totals.get(r.group_name) ?? { id: r.group_id, total: 0 };
        t.total += r.count;
        totals.set(r.group_name, t);
    });
    return Array.from(totals.entries())
        .map(([name, t]) => ({ name, id: t.id, total: t.total }))
        .sort((a, b) => b.total - a.total);
};
