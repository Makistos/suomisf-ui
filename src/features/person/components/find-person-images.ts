export interface WikiImageInfo {
    url: string
    descriptionUrl: string | null
    credit: string | null
    license: string | null
}

const WIKIDATA_API = "https://www.wikidata.org/w/api.php"
const COMMONS_API = "https://commons.wikimedia.org/w/api.php"

const isFree = (meta: any) =>
    meta && meta.NonFree?.value !== "true"

async function fetchImageMeta(title: string): Promise<WikiImageInfo | null> {

    const params = new URLSearchParams({
        action: "query",
        titles: title,
        prop: "imageinfo",
        iiprop: "url|descriptionurl|extmetadata",
        format: "json",
        origin: "*"
    })

    const res = await fetch(`${COMMONS_API}?${params}`)
    const data = await res.json()

    for (const pageId in data.query?.pages) {

        const info = data.query.pages[pageId].imageinfo?.[0]
        if (!info) continue

        const meta = info.extmetadata || {}

        if (!isFree(meta)) return null

        return {
            url: info.url,
            descriptionUrl: info.descriptionurl || null,
            credit: meta.Artist?.value || meta.Credit?.value || null,
            license: meta.LicenseShortName?.value || null
        }
    }

    return null
}

async function getWikidataClaims(qid: string) {

    const params = new URLSearchParams({
        action: "wbgetentities",
        ids: qid,
        props: "claims",
        format: "json",
        origin: "*"
    })

    const res = await fetch(`${WIKIDATA_API}?${params}`)
    const data = await res.json()

    return data.entities?.[qid]?.claims || {}
}

async function fetchCommonsCategory(category: string) {

    const params = new URLSearchParams({
        action: "query",
        list: "categorymembers",
        cmtitle: `Category:${category}`,
        cmtype: "file",
        cmlimit: "200",
        format: "json",
        origin: "*"
    })

    const res = await fetch(`${COMMONS_API}?${params}`)
    const data = await res.json()

    return (data.query?.categorymembers || []).map((m: any) => m.title)
}

export async function findAuthorImages(qid: string): Promise<WikiImageInfo[]> {

    const claims = await getWikidataClaims(qid)

    const files = new Set<string>()

    // P18 portrait
    if (claims.P18) {
        for (const c of claims.P18) {
            files.add(`File:${c.mainsnak.datavalue.value}`)
        }
    }

    // Commons category
    let commonsCategory: string | null = null

    if (claims.P373) {
        commonsCategory = claims.P373[0].mainsnak.datavalue.value
    }

    if (commonsCategory) {
        const catFiles = await fetchCommonsCategory(commonsCategory)
        catFiles.forEach((f: string) => files.add(f))
    }

    const images: WikiImageInfo[] = []

    for (const file of files) {

        if (!file.match(/\.(jpg|jpeg|png)$/i)) continue

        const meta = await fetchImageMeta(file)

        if (meta) images.push(meta)
    }

    return images
}