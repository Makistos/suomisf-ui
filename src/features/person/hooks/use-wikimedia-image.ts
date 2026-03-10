import { useEffect, useState } from 'react';
import { Person } from '../types';

const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';

export interface WikiImageInfo {
    url: string;
    descriptionUrl: string | null;
    credit: string | null;
    license: string | null;
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

export const useWikimediaImage = (person: Person) => {
    const [imageInfo, setImageInfo] = useState<WikiImageInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const name = person.fullname || person.alt_name || person.name;
        if (!name) return;

        let cancelled = false;
        setImageInfo(null);
        setIsLoading(true);

        (async () => {
            try {
                // -----------------------
                // 1️⃣ Try Wikidata P18
                // -----------------------
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

                if (qids.length) {
                    const entityParams = new URLSearchParams({
                        action: 'wbgetentities',
                        ids: qids.join('|'),
                        props: 'claims',
                        format: 'json',
                        origin: '*',
                    });
                    const entityRes = await fetch(`${WIKIDATA_API}?${entityParams}`);
                    const entityData = await entityRes.json();

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
                        if (info && !cancelled) {
                            setImageInfo(info);
                            return;
                        }
                    }
                }

                // -----------------------
                // 2️⃣ Fallback: Wikipedia page images
                // -----------------------
                const wpImagesParams = new URLSearchParams({
                    action: 'query',
                    titles: name,
                    prop: 'images',
                    format: 'json',
                    origin: '*',
                });
                const wpImagesRes = await fetch(`${WIKIPEDIA_API}?${wpImagesParams}`);
                const wpImagesData = await wpImagesRes.json();
                const pages = wpImagesData.query?.pages;
                if (!pages) return;

                const altLower = (person.alt_name || '').toLowerCase().replace(/\s/g, '_');
                for (const pageId in pages) {
                    for (const img of (pages[pageId].images || [])) {
                        const lower: string = img.title.toLowerCase();
                        if (
                            lower.match(/\.(jpg|jpeg|png)$/) &&
                            !lower.includes('logo') &&
                            !lower.includes('cover') &&
                            !lower.includes('icon') &&
                            !lower.includes('signature') &&
                            (altLower && lower.includes(altLower) || lower.includes('portrait'))
                        ) {
                            const info = await fetchImageMeta(WIKIPEDIA_API, img.title);
                            if (info && !cancelled) {
                                setImageInfo(info);
                                return;
                            }
                        }
                    }
                }
            } catch (err) {
                console.warn('Failed to fetch Wikimedia/Wikipedia image:', err);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [person.id]);

    return { imageInfo, isLoading };
};
