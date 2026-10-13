import { useMemo } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
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

// GET /api/<path>, cached by path. While a changed filter loads, the
// previous result stays on screen instead of a spinner.
export const useStatsQuery = <T,>(path: string, enabled = true) => {
    const user = useMemo(() => getCurrenUser(), []);
    return useQuery<T>({
        queryKey: ['stats', path],
        queryFn: async () => (await getApiContent(path, user)).data,
        enabled,
        placeholderData: keepPreviousData,
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

export interface TranslationLag {
    total: number;
    median: number | null;
    histogram: { lag: number; count: number }[];
    by_decade: { decade: number; count: number; q1: number; median: number; q3: number }[];
}

export interface EditionTypeYear {
    year: number;
    first: number;
    new_version: number;
    reprint: number;
}

export interface WorkListEntry {
    work_id: number;
    title: string;
    author: string | null;
    year: number | null;
}

export interface EditionsPerWork {
    histogram: { editions: number; works: number }[];
    top: (WorkListEntry & { editions: number })[];
}

export interface Retranslations {
    translated_works: number;
    retranslated_works: number;
    by_year: { year: number; count: number }[];
    works: (WorkListEntry & { translations: { year: number; translators: string[] }[] })[];
}

export interface BindingYearCount {
    year: number;
    count: number;
    binding_id: number | null;
    binding_name: string | null;
}

export interface QuartileYear {
    year: number;
    count: number;
    q1: number;
    median: number;
    q3: number;
}

export interface PageHistogram {
    bucket: number;
    histogram: { pages: number; count: number }[];
    thickest: (WorkListEntry & { edition_id: number; pages: number })[];
}

export interface SizeCount {
    size: number;
    count: number;
}

export const fromBindings = (data: BindingYearCount[] = []): GroupYearCount[] =>
    data.map(d => ({ year: d.year, count: d.count, group_id: d.binding_id, group_name: d.binding_name }));

// Query string from optional parameters. Undefined values are left out, and
// so is 'all' (a filter's "no filter" value) except for keys in `keepAll`.
export const statsParams = (params: Record<string, string | number | undefined>, keepAll: string[] = []) => {
    const p = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && (v !== 'all' || keepAll.includes(k))) p.append(k, String(v));
    });
    const query = p.toString();
    return query ? `?${query}` : '';
};

export type Material = 'books' | 'stories' | 'all';

export interface NationalityPeople {
    nationality_id: number | null;
    nationality: string | null;
    people: number;
    items: number;
}

export interface Contributor {
    id: number;
    name: string;
    alt_name: string | null;
    nationality: string | null;
    count: number;
}

export interface NationalityDecadeCount {
    year: number;
    count: number;
    nationality_id: number | null;
    nationality: string | null;
}

export interface BirthDecades {
    people: number;
    with_birth_year: number;
    decades: { decade: number; count: number }[];
}

export interface TranslatorLanguage {
    person_id: number;
    name: string;
    alt_name: string | null;
    language_id: number | null;
    language_name: string | null;
    count: number;
}

export const fromNationalities = (data: NationalityDecadeCount[] = []): GroupYearCount[] =>
    data.map(d => ({ year: d.year, count: d.count, group_id: d.nationality_id, group_name: d.nationality }));

export interface NamedCount {
    id: number;
    name: string;
    count: number;
}

export interface TagCounts {
    types: { id: number; name: string }[];
    tags: NamedCount[];
}

export interface TagDecadeCount {
    year: number;
    count: number;
    tag_id: number;
    tag_name: string;
}

export interface GenreYearCount {
    year: number;
    count: number;
    genre_id: number;
    genre_abbr: string;
}

export interface BookseriesStats {
    longest: { id: number; name: string; works: number }[];
    by_year: { year: number; total: number; in_series: number }[];
}

export interface PubseriesCounts {
    editions: number;
    in_series: number;
    series: { id: number; name: string; publisher_id: number | null; publisher_name: string | null; editions: number }[];
}

export interface StoryChannelCount {
    year: number;
    channel: 'magazine' | 'collection' | 'anthology';
    count: number;
}

export interface MagazineStats {
    id: number;
    name: string;
    type: string | null;
    first: number | null;
    last: number | null;
    issues: number;
    stories: number;
}

export interface MagazineContentCount {
    year: number;
    count: number;
    storytype_id: number | null;
    storytype_name: string | null;
}

export interface AwardCount {
    id: number;
    name: string;
    domestic: boolean | null;
    works: number;
    stories: number;
    people: number;
    total: number;
}

export interface AwardLag {
    total: number;
    median: number | null;
    lags: { lag: number; count: number }[];
    by_award: { id: number; name: string; count: number; q1: number; median: number; q3: number }[];
}

export interface AwardedPerson {
    id: number;
    name: string;
    alt_name: string | null;
    awards: number;
    personal: number;
    works: number;
    stories: number;
}
