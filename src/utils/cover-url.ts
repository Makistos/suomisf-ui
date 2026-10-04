import { ImageType } from "../types/image";

type CoverImage = Pick<ImageType, 'image_src' | 'thumb_src'>;

const absolute = (src: string) =>
    src.startsWith('http') ? src : `${import.meta.env.VITE_IMAGE_URL}${src}`;

/** Full-size cover, for the work/edition page and zoomed previews. */
export const coverUrl = (image: CoverImage) => absolute(image.image_src);

/**
 * The cover's small WebP copy (320 px tall), for lists, rows and galleries.
 * The backend sends the cover's own URL as thumb_src until a thumbnail
 * exists, and older responses have no thumb_src at all.
 */
export const thumbUrl = (image: CoverImage) => absolute(image.thumb_src || image.image_src);
