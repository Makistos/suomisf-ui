export interface ImageType {
    id: number,
    edition_id?: number,
    issue_id?: number,
    image_src: string,
    /** Small WebP copy for lists; the cover's own URL if none yet. */
    thumb_src?: string,
    image_attr: string,
    size: string | null,
}