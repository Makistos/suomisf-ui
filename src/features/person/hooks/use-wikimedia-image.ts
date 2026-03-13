import { useEffect, useState } from 'react';
import { Person } from '../types';
import { scoreImage } from '../components/score-image';

const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';

export interface WikiImageInfo {
    url: string;
    descriptionUrl: string | null;
    credit: string | null;
    license: string | null;
}
export async function matchPersonYears(
    qid: string,
    birthYear: number | null,
    deathYear: number | null
): Promise<boolean> {

    if (birthYear === null) {
        return false;
    }

    const params = new URLSearchParams({
        action: "wbgetentities",
        ids: qid,
        props: "claims",
        format: "json",
        origin: "*"
    });

    const res = await fetch(`${WIKIDATA_API}?${params}`);
    const data = await res.json();

    const claims = data?.entities?.[qid]?.claims;
    if (!claims) return false;

    const extractYear = (claimList: any[]): number | null => {
        if (!claimList?.length) return null;

        const time = claimList[0].mainsnak?.datavalue?.value?.time;
        if (!time) return null;

        // format: "+1920-01-02T00:00:00Z"
        return parseInt(time.substring(1, 5), 10);
    };

    const wikidataBirth = extractYear(claims.P569);
    const wikidataDeath = extractYear(claims.P570);

    if (birthYear !== null && wikidataBirth !== birthYear) {
        return false;
    }

    if (deathYear !== null && wikidataDeath !== deathYear) {
        return false;
    }

    return true;
}
/** Fetch imageinfo + extmetadata for a file title (e.g. "File:Foo.jpg").
 *  Returns null if the image is non-free or not found. */
const fetchImageMeta = async (apiBase: string, title: string): Promise<WikiImageInfo | null> => {
    const params = new URLSearchParams({
        action: 'query',
        titles: title,
        prop: 'imageinfo',
        iiprop: 'url|descriptionurl|extmetadata',
        format: 'json',
        origin: '*',
    });
    const res = await fetch(`${apiBase}?${params}`);
    const data = await res.json();
    for (const pageId in data.query?.pages) {
        const info = data.query.pages[pageId].imageinfo?.[0];
        if (!info) continue;
        const meta = info.extmetadata || {};
        if (meta.NonFree?.value === 'true') return null;
        return {
            url: info.url,
            descriptionUrl: info.descriptionurl || null,
            credit: meta.Artist?.value || meta.Credit?.value || null,
            license: meta.LicenseShortName?.value || null,
        };
    }
    return null;
};

/** Fetch P18 image directly from a known QID. */
const fetchImageByQid = async (qid: string): Promise<WikiImageInfo | null> => {
    const params = new URLSearchParams({
        action: 'wbgetentities',
        ids: qid,
        props: 'claims',
        format: 'json',
        origin: '*',
    });
    const res = await fetch(`${WIKIDATA_API}?${params}`);
    const data = await res.json();
    const claims = data?.entities?.[qid]?.claims;
    if (!claims?.P18?.length) return null;
    const filename: string = claims.P18[0].mainsnak.datavalue.value;
    return fetchImageMeta(COMMONS_API, `File:${filename}`);
};

/** Search Wikidata for humans with P18 images by name.
 *  Returns candidates as { qid, info } pairs for year verification. */
const searchWikidataCandidates = async (name: string): Promise<{ qid: string; info: WikiImageInfo }[]> => {
    const searchParams = new URLSearchParams({
        action: 'wbsearchentities',
        search: name,
        type: 'item',
        language: 'en',
        limit: '10',
        format: 'json',
        origin: '*',
    });
    const searchRes = await fetch(`${WIKIDATA_API}?${searchParams}`);
    const searchData = await searchRes.json();
    const qids: string[] = searchData.search?.map((r: any) => r.id) || [];
    if (!qids.length) return [];

    const entityParams = new URLSearchParams({
        action: 'wbgetentities',
        ids: qids.join('|'),
        props: 'claims',
        format: 'json',
        origin: '*',
    });
    const entityRes = await fetch(`${WIKIDATA_API}?${entityParams}`);
    const entityData = await entityRes.json();

    const results: { qid: string; info: WikiImageInfo }[] = [];
    for (const qid of qids) {
        const entity = entityData.entities?.[qid];
        if (!entity) continue;
        const claims = entity.claims || {};
        const isHuman = claims.P31?.some(
            (c: any) => c.mainsnak.datavalue?.value?.id === 'Q5'
        );
        if (!isHuman || !claims.P18?.length) continue;
        const filename: string = claims.P18[0].mainsnak.datavalue.value;
        const info = await fetchImageMeta(COMMONS_API, `File:${filename}`);
        if (info) results.push({ qid, info });
    }
    return results;
};

/** Convert "Last, First" to "First Last"; leave other formats unchanged. */
const toNaturalOrder = (name: string) =>
    name.includes(',')
        ? name.split(',').map((s: string) => s.trim()).reverse().join(' ')
        : name;

export const useWikimediaImage = (person: Person, enabled = true) => {
    const [imageInfo, setImageInfo] = useState<WikiImageInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!enabled || String(person.qid) === '0') return;
        let cancelled = false;
        setImageInfo(null);
        setIsLoading(true);

        (async () => {
            try {
                // -----------------------
                // 1️⃣ QID known — load image directly, no year check needed
                // -----------------------
                if (person.qid) {
                    const info = await fetchImageByQid(person.qid);
                    console.debug('[useWikimediaImage] QID path, found:', info?.url ?? 'none');
                    if (info && !cancelled) setImageInfo(info);
                    return;
                }

                // -----------------------
                // 2️⃣ No QID — search by name, verify years for each candidate
                // -----------------------
                const namesToTry = [
                    person.fullname,
                    person.alt_name,
                    toNaturalOrder(person.name),
                ].filter((n): n is string => !!n);

                const seen = new Set<string>();
                const uniqueNames = namesToTry.filter(n => !seen.has(n) && seen.add(n));

                for (const name of uniqueNames) {
                    const candidates = await searchWikidataCandidates(name);
                    console.debug(`[useWikimediaImage] name search "${name}": ${candidates.length} candidate(s)`, candidates.map(c => `${c.qid}: ${c.info.url}`));
                    for (const { qid, info } of candidates) {
                        const yearsMatch = await matchPersonYears(qid, person.dob, person.dod);
                        console.debug(`[useWikimediaImage]   ${qid} years match: ${yearsMatch}, image: ${info.url}`);
                        if (yearsMatch) {
                            if (!cancelled) setImageInfo(info);
                            return;
                        }
                    }
                }

                // -----------------------
                // 3️⃣ Fallback: Wikipedia page images
                // -----------------------
                const searchName = toNaturalOrder(person.alt_name || person.name);
                const wpImagesParams = new URLSearchParams({
                    action: 'query',
                    titles: searchName,
                    prop: 'images',
                    format: 'json',
                    origin: '*',
                });
                const wpImagesRes = await fetch(`${WIKIPEDIA_API}?${wpImagesParams}`);
                const wpImagesData = await wpImagesRes.json();
                const pages = wpImagesData.query?.pages;
                if (!pages) return;

                const candidates: { title: string; score: number }[] = [];
                for (const pageId in pages) {
                    for (const img of (pages[pageId].images || [])) {
                        if (!img.title.match(/\.(jpg|jpeg|png)$/i)) continue;
                        const s = scoreImage(img.title);
                        if (s > 0) candidates.push({ title: img.title, score: s });
                    }
                }
                candidates.sort((a, b) => b.score - a.score);
                console.debug('[useWikimediaImage] Wikipedia fallback candidates (sorted):', candidates.map(c => `${c.title} (score ${c.score})`));
                for (const { title } of candidates) {
                    const info = await fetchImageMeta(WIKIPEDIA_API, title);
                    console.debug(`[useWikimediaImage]   ${title}: ${info ? info.url : 'no metadata / non-free'}`);
                    if (info && !cancelled) {
                        setImageInfo(info);
                        return;
                    }
                }
            } catch (err) {
                console.warn('Failed to fetch Wikimedia/Wikipedia image:', err);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [person.id, enabled]);

    return { imageInfo, isLoading };
};
