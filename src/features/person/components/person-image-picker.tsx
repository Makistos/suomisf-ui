export type WikimediaImage = {
    url: string
    license: string
    author: string
}

const WIKIDATA_API = "https://www.wikidata.org/w/api.php"
const WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php"
const COMMONS_API = "https://commons.wikimedia.org/w/api.php"

function isFreeLicense(meta: any): boolean {

    if (!meta) return false

    if (meta.NonFree?.value === "true") return false

    const license = meta.LicenseShortName?.value || ""

    return (
        license.includes("CC") ||
        license.includes("Public domain") ||
        license.includes("CC0")
    )
}

async function getImageInfo(file: string): Promise<WikimediaImage | null> {

    const params = new URLSearchParams({
        action: "query",
        titles: file,
        prop: "imageinfo",
        iiprop: "url|user|extmetadata",
        format: "json",
        origin: "*"
    })

    const res = await fetch(`${COMMONS_API}?${params}`)
    const data = await res.json()

    const pages = data?.query?.pages
    if (!pages) return null

    const page = Object.values(pages)[0] as any
    const info = page?.imageinfo?.[0]

    if (!info) return null

    const meta = info.extmetadata || {}

    if (!isFreeLicense(meta)) return null

    return {
        url: info.url,
        license: meta?.LicenseShortName?.value || "Unknown",
        author: meta?.Artist?.value || info.user || "Unknown"
    }
}

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

    if (!p18) return []

    return p18.map((c: any) => "File:" + c.mainsnak.datavalue.value)
}

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
    const images = page?.images || []

    return images.map((img: any) => img.title)
}

async function fetchCommonsCategoryImages(category: string): Promise<string[]> {

    const params = new URLSearchParams({
        action: "query",
        list: "categorymembers",
        cmtitle: `Category:${category}`,
        cmtype: "file",
        cmlimit: "100",
        format: "json",
        origin: "*"
    })

    const res = await fetch(`${COMMONS_API}?${params}`)
    const data = await res.json()

    const members = data?.query?.categorymembers || []

    return members.map((m: any) => m.title)
}

export async function findWikimediaImages({
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

    // 1 — Wikidata images
    if (qid) {
        const wikidataFiles = await fetchWikidataImages(qid)
        wikidataFiles.forEach(f => files.add(f))
    }

    // 2 — Wikipedia page images
    const title = alt_name || fullname || name

    if (title) {
        const wikiFiles = await fetchWikipediaImages(title)
        wikiFiles.forEach(f => files.add(f))
    }

    // 3 — Commons category images
    if (title) {
        const commonsFiles = await fetchCommonsCategoryImages(title)
        commonsFiles.forEach(f => files.add(f))
    }

    const results: WikimediaImage[] = []

    for (const file of files) {

        if (!file.match(/\.(jpg|jpeg|png)$/i)) continue

        const img = await getImageInfo(file)

        if (img) results.push(img)
    }

    return results
}