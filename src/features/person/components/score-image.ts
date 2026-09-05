import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision'

let detectorPromise: Promise<FaceDetector> | null = null

async function ensureDetector(): Promise<FaceDetector> {
    if (!detectorPromise) {
        detectorPromise = (async () => {
            const vision = await FilesetResolver.forVisionTasks(
                'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
            )
            return FaceDetector.createFromOptions(vision, {
                baseOptions: { modelAssetPath: '/models/blaze_face_short_range.tflite' },
                runningMode: 'IMAGE',
            })
        })()
    }
    return detectorPromise
}

async function fetchImageBitmap(url: string): Promise<ImageBitmap> {
    const resp = await fetch(url)
    const blob = await resp.blob()
    return createImageBitmap(blob)
}

/** Returns a face-detection bonus score for the given image URL.
 *  +15 for exactly one face (likely a portrait), +6 for multiple faces.
 *  Returns 0 on failure or timeout. */
export async function scoreFaces(imageUrl: string): Promise<number> {
    try {
        const detector = await ensureDetector()
        const bitmap = await fetchImageBitmap(imageUrl)
        const { detections } = detector.detect(bitmap)
        bitmap.close()
        if (detections.length === 1) return 15
        if (detections.length > 1) return 6
        return 0
    } catch {
        return 0
    }
}

export function scoreImage(file: string, width?: number, height?: number): number {

    const name = file.toLowerCase()

    let score = 0

    if (name.includes("portrait")) score += 6
    if (name.includes("headshot")) score += 6

    if (/\d{4}/.test(name)) score += 1

    if (width && height && Math.max(width, height) > 400) score += 2

    // Give bonus for images that have greater height than width
    if (width && height && height > width) score += 3

    // Commas, and, & tend to point to an image with more than one person
    const commaCount = (name.match(/,/g) || []).length
    if (commaCount >= 2) score -= 10

    if (/ and | & /.test(name)) score -= 5

    const negatives: [string, number][] = [
        ["cover", 10],
        ["poster", 10],
        ["logo", 10],
        ["signature", 6],
        ["book", 5],
        ["scan", 4],
        ["award", 2],
    ]

    for (const [bad, penalty] of negatives) {
        if (name.includes(bad)) score -= penalty
    }

    return score
}
