import { scoreImage, scoreFaces } from './score-image'

export type WikimediaImage = {
    url: string
    license: string
    author: string
    _score?: number
}

const WIKIDATA_API = "https://www.wikidata.org/w/api.php"
const WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php"
const COMMONS_API = "https://commons.wikimedia.org/w/api.php"

// Normalize names and filenames for matching
const normalize = (s: string) => s.toLowerCase().replace(/[\s_()]/g, '')

// Check if image is free
function isFreeLicense(meta: any): boolean {
    if (!meta) return false
    return meta.NonFree?.value !== "true"
}

// Fetch image metadata from Commons/Wikipedia
async function getImageInfo(file: string): Promise<WikimediaImage | null> {
    const params = new URLSearchParams({
        action: "query",
        titles: file,
        prop: "imageinfo",
        iiprop: "url|user|extmetadata",
        format: "json",
        origin: "*"
    })

    const apis = [COMMONS_API, WIKIPEDIA_API]
    for (const api of apis) {
        const res = await fetch(`${api}?${params}`)
        const data = await res.json()
        const pages = data?.query?.pages
        if (!pages) continue
        const page = Object.values(pages)[0] as any
        const info = page?.imageinfo?.[0]
        if (!info) continue
        const meta = info.extmetadata || {}
        if (!isFreeLicense(meta)) return null
        return {
            url: info.url,
            license: meta?.LicenseShortName?.value || "Unknown",
            author: meta?.Artist?.value || info.user || "Unknown"
        }
    }
    return null
}

// Fetch P18 images from Wikidata
async function fetchWikidataImages(qid: string): Promise<string[]> {
    const params = new URLSearchParams({
        action: "wbgetentities",
        ids: qid,
        props: "claims",
        format: "json",
        origin: "*"
    })
    const res = await fetch(`${WIKIDATA_API}?${params}`)
    const data = await res.json()
    const p18 = data?.entities?.[qid]?.claims?.P18
    return p18 ? p18.map((c: any) => "File:" + c.mainsnak.datavalue.value) : []
}

// Fetch Commons category images by QID
async function fetchCommonsCategoryByQid(qid: string): Promise<string[]> {
    const params = new URLSearchParams({
        action: "wbgetentities",
        ids: qid,
        props: "claims",
        format: "json",
        origin: "*"
    })
    const res = await fetch(`${WIKIDATA_API}?${params}`)
    const data = await res.json()
    const claims = data?.entities?.[qid]?.claims
    if (!claims?.P373) return []
    const category = claims.P373[0].mainsnak.datavalue.value

    const catParams = new URLSearchParams({
        action: "query",
        list: "categorymembers",
        cmtitle: `Category:${category}`,
        cmtype: "file",
        cmlimit: "200",
        format: "json",
        origin: "*"
    })
    const catRes = await fetch(`${COMMONS_API}?${catParams}`)
    const catData = await catRes.json()
    return (catData.query?.categorymembers || []).map((m: any) => m.title)
}

// Fetch Commons category images by title string (fallback if no P373)
async function fetchCommonsCategoryByTitle(title: string): Promise<string[]> {
    const catTitle = title.replace(/\s/g, '_')
    const params = new URLSearchParams({
        action: "query",
        list: "categorymembers",
        cmtitle: `Category:${catTitle}`,
        cmtype: "file",
        cmlimit: "200",
        format: "json",
        origin: "*"
    })
    const res = await fetch(`${COMMONS_API}?${params}`)
    const data = await res.json()
    return (data.query?.categorymembers || []).map((m: any) => m.title)
}

// Fetch Wikipedia page images
async function fetchWikipediaImages(title: string): Promise<string[]> {
    const params = new URLSearchParams({
        action: "query",
        titles: title,
        prop: "images",
        imlimit: "50",
        format: "json",
        origin: "*"
    })
    const res = await fetch(`${WIKIPEDIA_API}?${params}`)
    const data = await res.json()
    const pages = data?.query?.pages
    if (!pages) return []
    const page = Object.values(pages)[0] as any
    return (page?.images || []).map((img: any) => img.title)
}

// Convert "Last, First" -> "First Last"
const toNaturalOrder = (n: string) =>
    n.includes(',') ? n.split(',').map(s => s.trim()).reverse().join(' ') : n

// Main function
export async function findAllFreeImages({
    qid,
    fullname,
    alt_name,
    name
}: {
    qid?: string
    fullname?: string
    alt_name?: string
    name?: string
}): Promise<WikimediaImage[]> {

    const files = new Set<string>()
    const names = [...new Set([fullname, alt_name, name].filter(Boolean))] as string[]

    // 1 — Wikidata P18 + P373
    if (qid) {
        const [wikidataFiles, categoryFiles] = await Promise.all([
            fetchWikidataImages(qid),
            fetchCommonsCategoryByQid(qid)
        ])
        wikidataFiles.forEach(f => files.add(f))
        categoryFiles.forEach(f => files.add(f))
    }

    // 2 — Wikipedia page images + Commons category fallback by title string
    for (const n of names) {
        const titles = [toNaturalOrder(n), n]
        for (const t of titles) {
            const wikiImages = await fetchWikipediaImages(t)
            wikiImages.forEach(f => files.add(f))

            const commonsByTitle = await fetchCommonsCategoryByTitle(t)
            commonsByTitle.forEach(f => files.add(f))
        }
    }

    // 3 — Filter & fetch metadata
    const results: WikimediaImage[] = []
    const normNames = names.map(normalize)

    for (const file of files) {
        if (!file.match(/\.(jpg|jpeg|png)$/i)) continue
        const img = await getImageInfo(file)
        if (!img) continue

        const normFile = normalize(file)
        if (!normNames.some(n => normFile.includes(n)) && !normFile.includes('portrait')) continue

        results.push({ ...img, _score: scoreImage(file) } as WikimediaImage)
    }

    // 4 — Score faces asynchronously
    await Promise.all(results.map(async img => {
        const bonus = await scoreFaces(img.url)
            ; (img as any)._score = ((img as any)._score ?? 0) + bonus
    }))

    // 5 — Sort by score descending
    results.sort((a, b) => ((b as any)._score ?? 0) - ((a as any)._score ?? 0))

    return results
}