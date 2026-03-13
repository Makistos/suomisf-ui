import { scoreImage } from './score-image'

export interface WikiImageInfo {
    url: string
    descriptionUrl: string | null
    credit: string | null
    license: string | null
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

/** Convert "Last, First" to "First Last"; leave other formats unchanged. */
const toNaturalOrder = (name: string) =>
    name.includes(',')
        ? name.split(',').map(s => s.trim()).reverse().join(' ')
        : name

/** Fetch imageinfo + extmetadata for a file title (e.g. "File:Foo.jpg"). */
async function fetchImageMeta(apiBase: string, title: string): Promise<WikiImageInfo | null> {
    const params = new URLSearchParams({
        action: 'query',
        titles: title,
        prop: 'imageinfo',
        iiprop: 'url|descriptionurl|extmetadata',
        format: 'json',
        origin: '*',
    })
    const res = await fetch(`${apiBase}?${params}`)
    const data = await res.json()
    for (const pageId in data.query?.pages) {
        const info = data.query.pages[pageId].imageinfo?.[0]
        if (!info) continue
        const meta = info.extmetadata || {}
        if (meta.NonFree?.value === 'true') return null
        const license: string | null =
            meta.LicenseShortName?.value ||
            meta.License?.value ||
            meta.UsageTerms?.value ||
            null
        if (!license) return null
        return {
            url: info.url,
            descriptionUrl: info.descriptionurl || null,
            credit: meta.Artist?.value || meta.Credit?.value || null,
            license,
        }
    }
    return null
}

/** Fetch P18 image directly from a known QID. */
async function fetchImageByQid(qid: string): Promise<WikiImageInfo | null> {
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
    if (!claims?.P18?.length) return null
    const filename: string = claims.P18[0].mainsnak.datavalue.value
    return fetchImageMeta(COMMONS_API, `File:${filename}`)
}

/** Fetch all images from the Commons category linked to a QID via P373. */
async function fetchQidCategoryImages(qid: string): Promise<WikiImageInfo[]> {
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
    if (!claims?.P373) return []
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
    const files: string[] = (catData.query?.categorymembers || []).map((m: any) => m.title)

    const images: WikiImageInfo[] = []
    for (const file of files) {
        if (!file.match(/\.(jpg|jpeg|png)$/i)) continue
        const img = await fetchImageMeta(COMMONS_API, file)
        if (img) images.push(img)
    }
    return images
}

/** Verify that a Wikidata entity's birth/death years match the given values. */
export async function matchPersonYears(
    qid: string,
    birthYear: number | null,
    deathYear: number | null
): Promise<boolean> {
    if (birthYear === null) return false

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

    const extractYear = (claimList: any[]): number | null => {
        const time = claimList?.[0]?.mainsnak?.datavalue?.value?.time
        if (!time) return null
        return parseInt(time.substring(1, 5), 10)
    }

    if (birthYear !== null && extractYear(claims.P569) !== birthYear) return false
    if (deathYear !== null && extractYear(claims.P570) !== deathYear) return false
    return true
}

/** Search Wikidata for humans with P18 images by name.
 *  Returns candidates as { qid, info } pairs for year verification. */
async function searchWikidataCandidates(name: string): Promise<{ qid: string; info: WikiImageInfo }[]> {
    const searchParams = new URLSearchParams({
        action: 'wbsearchentities',
        search: name,
        type: 'item',
        language: 'en',
        limit: '10',
        format: 'json',
        origin: '*',
    })
    const searchRes = await fetch(`${WIKIDATA_API}?${searchParams}`)
    const searchData = await searchRes.json()
    const qids: string[] = searchData.search?.map((r: any) => r.id) || []
    if (!qids.length) return []

    const entityParams = new URLSearchParams({
        action: 'wbgetentities',
        ids: qids.join('|'),
        props: 'claims',
        format: 'json',
        origin: '*',
    })
    const entityRes = await fetch(`${WIKIDATA_API}?${entityParams}`)
    const entityData = await entityRes.json()

    const results: { qid: string; info: WikiImageInfo }[] = []
    for (const qid of qids) {
        const entity = entityData.entities?.[qid]
        if (!entity) continue
        const claims = entity.claims || {}
        const isHuman = claims.P31?.some((c: any) => c.mainsnak.datavalue?.value?.id === 'Q5')
        if (!isHuman || !claims.P18?.length) continue
        const filename: string = claims.P18[0].mainsnak.datavalue.value
        const info = await fetchImageMeta(COMMONS_API, `File:${filename}`)
        if (info) results.push({ qid, info })
    }
    return results
}

/** Fetch Wikipedia page images for a name, score and sort them, return free images. */
async function fetchWikipediaPageImages(name: string): Promise<WikiImageInfo[]> {
    const params = new URLSearchParams({
        action: 'query',
        titles: name,
        prop: 'images',
        format: 'json',
        origin: '*',
    })
    const res = await fetch(`${WIKIPEDIA_API}?${params}`)
    const data = await res.json()
    const pages = data.query?.pages
    if (!pages) return []

    const candidates: { title: string; score: number }[] = []
    for (const pageId in pages) {
        for (const img of (pages[pageId].images || [])) {
            if (!img.title.match(/\.(jpg|jpeg|png)$/i)) continue
            candidates.push({ title: img.title, score: scoreImage(img.title) })
        }
    }
    candidates.sort((a, b) => b.score - a.score)

    const images: WikiImageInfo[] = []
    for (const { title } of candidates) {
        const info = await fetchImageMeta(COMMONS_API, title)
        if (info) images.push(info)
    }
    return images
}

async function searchCommonsFiles(name: string): Promise<string[]> {

    const params = new URLSearchParams({
        action: "query",
        list: "search",
        srsearch: `${name} filetype:bitmap`,
        srnamespace: "6",
        srlimit: "50",
        format: "json",
        origin: "*"
    })

    const res = await fetch(`${COMMONS_API}?${params}`)
    const data = await res.json()

    return (data?.query?.search || []).map((r: any) => r.title)
}


/** Fetch all free images for a person and return them sorted by score (best first).
 *
 *  Steps:
 *  1. QID known  → P18 portrait + Commons category images
 *  2. No QID     → name search on Wikidata, year-verified candidates
 *  3. Fallback   → Wikipedia page images scored by filename heuristics
 */
export async function findPersonImages(person: PersonImageQuery): Promise<WikiImageInfo[]> {
    const { qid, fullname, alt_name, name, dob, dod } = person

    if (qid && String(qid) !== '0') {
        // QID path: P18 portrait first, then category images
        const [p18, categoryImages] = await Promise.all([
            fetchImageByQid(qid),
            fetchQidCategoryImages(qid),
        ])
        const seen = new Set<string>()
        const images: WikiImageInfo[] = []
        for (const img of [p18, ...categoryImages]) {
            if (img && !seen.has(img.url)) {
                seen.add(img.url)
                images.push(img)
            }
        }
        images.sort((a, b) => scoreImage(b.url) - scoreImage(a.url))
        return images
    }

    // No QID: collect year-verified Wikidata candidates then Wikipedia fallback
    const namesToTry = [...new Set(
        [fullname, alt_name, name].filter(Boolean) as string[]
    )]

    const seen = new Set<string>()
    const images: WikiImageInfo[] = []

    const addImage = (img: WikiImageInfo) => {
        if (!seen.has(img.url)) { seen.add(img.url); images.push(img) }
    }

    for (const n of namesToTry) {
        const candidates = await searchWikidataCandidates(n)
        for (const { qid: candidateQid, info } of candidates) {
            const yearsMatch = await matchPersonYears(candidateQid, dob ?? null, dod ?? null)
            if (yearsMatch) addImage(info)
        }
    }

    // Commons full-text search + Wikipedia page images, run in parallel per name
    const searchNames = [...new Set([fullname, alt_name, name].filter(Boolean) as string[])]
    const [commonsResults, ...wikiResults] = await Promise.all([
        Promise.all(searchNames.map(n => searchCommonsFiles(n))),
        ...searchNames.map(n => fetchWikipediaPageImages(toNaturalOrder(n))),
    ])

    for (const files of commonsResults) {
        for (const file of files) {
            if (!file.match(/\.(jpg|jpeg|png)$/i)) continue
            const info = await fetchImageMeta(COMMONS_API, file)
            if (info) addImage(info)
        }
    }
    for (const wikiImages of wikiResults) {
        wikiImages.forEach(addImage)
    }

    images.sort((a, b) => scoreImage(b.url) - scoreImage(a.url))
    return images
}
