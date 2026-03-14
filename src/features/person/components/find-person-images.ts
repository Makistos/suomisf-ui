import { scoreImage, scoreFaces } from './score-image'
import { getPublicContent } from '../../../services/user-service'

/** Fetch free person images from the backend API. */
export async function fetchPersonImagesFromApi(
    personId: number | string,
    limit = 20
): Promise<WikiImageInfo[]> {
    const res = await getPublicContent(`person/${personId}/images?limit=${limit}`)
    return (res.data || []).map((img: any) => ({
        url: img.url,
        descriptionUrl: img.description_url || null,
        credit: img.credit || null,
        license: img.license || null,
        _score: img.score ?? 0,
        dimensions: img.dimensions || null,
        scoring: img.scoring || undefined,
    }))
}

export interface WikiImageInfo {
    url: string
    descriptionUrl: string | null
    credit: string | null
    license: string | null
    _score?: number
    dimensions?: { width: number; height: number } | null
    scoring?: Record<string, number>
}

export interface PersonImageQuery {
    qid?: string | null
    fullname?: string | null
    alt_name?: string | null
    name: string
    dob?: number | null
    dod?: number | null
}

const WIKIDATA_API = 'https://www.wikidata.org/w/api.php'
const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php'
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php'

/** Fetch imageinfo + extmetadata for a file or Wikipedia image (must be free). */
async function fetchImageMeta(title: string, apiBase = COMMONS_API): Promise<WikiImageInfo | null> {
    const params = new URLSearchParams({
        action: 'query',
        titles: title,
        prop: 'imageinfo',
        iiprop: 'url|descriptionurl|extmetadata|user',
        format: 'json',
        origin: '*',
    })
    try {
        const res = await fetch(`${apiBase}?${params}`)
        if (!res.ok) return null
        const data = await res.json()
        const pages = data.query?.pages
        if (!pages) return null
        for (const pageId in pages) {
            const info = pages[pageId].imageinfo?.[0]
            if (!info) continue
            const meta = info.extmetadata || {}
            if (meta.NonFree?.value === 'true') return null
            return {
                url: info.url,
                descriptionUrl: info.descriptionurl || null,
                credit: meta.Artist?.value || meta.Credit?.value || info.user || 'Unknown',
                license: meta.LicenseShortName?.value || 'Unknown',
            }
        }
    } catch {
        return null
    }
    return null
}

/** Check if a Wikidata entity's birth/death years match the person's dob/dod. */
async function matchPersonYears(
    qid: string,
    birthYear: number | null | undefined,
    deathYear: number | null | undefined
): Promise<boolean> {
    if (!birthYear) return false
    try {
        const params = new URLSearchParams({
            action: 'wbgetentities',
            ids: qid,
            props: 'claims',
            format: 'json',
            origin: '*',
        })
        const res = await fetch(`${WIKIDATA_API}?${params}`)
        const data = await res.json()
        const claims = data?.entities?.[qid]?.claims
        if (!claims) return false
        const extractYear = (list: any[]): number | null => {
            const time = list?.[0]?.mainsnak?.datavalue?.value?.time
            return time ? parseInt(time.substring(1, 5), 10) : null
        }
        if (extractYear(claims.P569) !== birthYear) return false
        if (deathYear != null && extractYear(claims.P570) !== deathYear) return false
        return true
    } catch {
        return false
    }
}

/** Search Wikidata for human entities with a P18 image matching a name.
 *  Returns { qid, files } for each verified human. */
async function searchWikidataByName(name: string): Promise<{ qid: string; files: string[] }[]> {
    try {
        const searchParams = new URLSearchParams({
            action: 'wbsearchentities',
            search: name,
            language: 'en',
            type: 'item',
            limit: '10',
            format: 'json',
            origin: '*',
        })
        const searchData = await (await fetch(`${WIKIDATA_API}?${searchParams}`)).json()
        const qids: string[] = searchData.search?.map((r: any) => r.id) || []
        if (!qids.length) return []

        const entityParams = new URLSearchParams({
            action: 'wbgetentities',
            ids: qids.join('|'),
            props: 'claims',
            format: 'json',
            origin: '*',
        })
        const entityData = await (await fetch(`${WIKIDATA_API}?${entityParams}`)).json()

        const results: { qid: string; files: string[] }[] = []
        for (const qid of qids) {
            const claims = entityData.entities?.[qid]?.claims
            if (!claims) continue
            const isHuman = claims.P31?.some((c: any) => c.mainsnak.datavalue?.value?.id === 'Q5')
            if (!isHuman || !claims.P18?.length) continue
            results.push({ qid, files: claims.P18.map((c: any) => 'File:' + c.mainsnak.datavalue.value) })
        }
        return results
    } catch {
        return []
    }
}

/** Fetch P18 portraits from a QID. */
async function fetchP18(qid: string): Promise<string[]> {
    try {
        const params = new URLSearchParams({
            action: 'wbgetentities',
            ids: qid,
            props: 'claims',
            format: 'json',
            origin: '*',
        })
        const res = await fetch(`${WIKIDATA_API}?${params}`)
        const data = await res.json()
        const claims = data?.entities?.[qid]?.claims
        if (!claims?.P18?.length) return []
        return claims.P18.map((c: any) => 'File:' + c.mainsnak.datavalue.value)
    } catch {
        return []
    }
}

/** Fetch Commons category images from a QID (P373). */
async function fetchCategoryImages(qid: string): Promise<string[]> {
    try {
        const params = new URLSearchParams({
            action: 'wbgetentities',
            ids: qid,
            props: 'claims',
            format: 'json',
            origin: '*',
        })
        const res = await fetch(`${WIKIDATA_API}?${params}`)
        const data = await res.json()
        const claims = data?.entities?.[qid]?.claims
        if (!claims?.P373?.length) return []
        const category = claims.P373[0].mainsnak.datavalue.value

        const catParams = new URLSearchParams({
            action: 'query',
            list: 'categorymembers',
            cmtitle: `Category:${category}`,
            cmtype: 'file',
            cmlimit: '200',
            format: 'json',
            origin: '*',
        })
        const catRes = await fetch(`${COMMONS_API}?${catParams}`)
        const catData = await catRes.json()
        return (catData.query?.categorymembers || []).map((m: any) => m.title)
    } catch {
        return []
    }
}

/** Fetch Wikipedia page images (jpg/png). */
async function fetchWikipediaPageImages(title: string): Promise<string[]> {
    try {
        const params = new URLSearchParams({
            action: 'query',
            titles: title,
            prop: 'images',
            format: 'json',
            origin: '*',
        })
        const res = await fetch(`${WIKIPEDIA_API}?${params}`)
        const data = await res.json()
        const pages = data.query?.pages
        if (!pages) return []
        const images: string[] = []
        for (const pageId in pages) {
            for (const img of pages[pageId].images || []) {
                if (img.title.match(/\.(jpg|jpeg|png)$/i)) images.push(img.title)
            }
        }
        return images
    } catch {
        return []
    }
}

/** Search Commons full-text for files. */
async function searchCommonsFiles(name: string): Promise<string[]> {
    try {
        const params = new URLSearchParams({
            action: 'query',
            list: 'search',
            srsearch: `"${name}"`,
            srnamespace: '6',
            srlimit: '50',
            format: 'json',
            origin: '*',
        })
        const res = await fetch(`${COMMONS_API}?${params}`)
        const data = await res.json()
        return (data?.query?.search || []).map((r: any) => r.title)
    } catch {
        return []
    }
}

/** Throttle async calls to avoid hitting rate limits. */
async function throttledMap<T, R>(
    items: T[],
    fn: (item: T) => Promise<R>,
    concurrency = 5
): Promise<R[]> {
    const results: R[] = []
    const queue = [...items]
    const workers = Array(concurrency).fill(null).map(async () => {
        while (queue.length) {
            const item = queue.shift()!
            try { results.push(await fn(item)) } catch { }
        }
    })
    await Promise.all(workers)
    return results
}

/** Fetch all free images for a person with async face scoring. */
export async function findPersonImages(person: PersonImageQuery): Promise<WikiImageInfo[]> {
    const { qid, fullname, alt_name, name } = person
    const allFiles: string[] = []

    // 1️⃣ QID known: P18 + category
    if (qid) {
        const [p18Files, categoryFiles] = await Promise.all([
            fetchP18(qid),
            fetchCategoryImages(qid),
        ])
        allFiles.push(...p18Files, ...categoryFiles)
    } else {
        // 1b️⃣ No QID: search Wikidata by name, add P18 files from year-verified matches
        const names = [...new Set([fullname, alt_name, name].filter(Boolean) as string[])]
        for (const n of names) {
            const candidates = await searchWikidataByName(n)
            for (const { qid: candidateQid, files } of candidates) {
                if (await matchPersonYears(candidateQid, person.dob, person.dod)) {
                    allFiles.push(...files)
                }
            }
        }
    }
    console.log("by qid: " + allFiles.length)
    // 2️⃣ Wikipedia page images + 3️⃣ Commons full-text search (all in parallel)
    const titles = [fullname, alt_name, name].filter(Boolean) as string[]
    const [wpResults, commonsResults] = await Promise.all([
        Promise.all(titles.map(fetchWikipediaPageImages)),
        Promise.all(titles.map(searchCommonsFiles)),
    ])
    allFiles.push(...wpResults.flat(), ...commonsResults.flat())
    console.log("with wikipedia: " + allFiles.length)
    // Remove duplicates and filter jpg/png
    const uniqueFiles = Array.from(new Set(allFiles)).filter(f => f.match(/\.(jpg|jpeg|png)$/i))

    console.log("unique: " + uniqueFiles.length)
    // Fetch metadata (throttled)
    const images = await throttledMap(uniqueFiles, async (file) => {
        const apiBase = file.startsWith('File:') ? COMMONS_API : WIKIPEDIA_API
        return fetchImageMeta(file, apiBase)
    }, 5)

    console.log("images: " + images.length)
    const freeImages = images.filter(Boolean) as WikiImageInfo[]
    // Apply heuristic scoring (async face detection)
    await Promise.all(freeImages.map(async img => {
        const bonus = await scoreFaces(img.url)
            ; (img as any)._score = scoreImage(img.url) + bonus
    }))

    console.log("freeImages: " + freeImages.length)
    // Sort best first
    freeImages.sort((a, b) => ((b as any)._score ?? 0) - ((a as any)._score ?? 0))
    return freeImages
}
