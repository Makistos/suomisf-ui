/**
 * Resizes a cover image in the browser before it is uploaded.
 *
 * Every cover is stored exactly COVER_HEIGHT pixels high, width in
 * proportion. This also keeps phone photos (several megabytes) small
 * enough for the server, and turns PNG screenshots and other formats
 * into the JPEG the backend accepts.
 */

/** Height of every uploaded cover, in pixels. */
export const COVER_HEIGHT = 500;
const JPEG_QUALITY = 0.9;

const isJpeg = (file: File) =>
    file.type === 'image/jpeg' || /\.jpe?g$/i.test(file.name);

/** The file name with its extension replaced by .jpg. */
export const jpegName = (name: string): string => {
    const stem = name.replace(/\.[^./\\]*$/, '') || 'kansikuva';
    return `${stem}.jpg`;
};

/** Width and height scaled (up or down) to exactly the given height. */
export const fitToHeight = (width: number, height: number, target = COVER_HEIGHT) => ({
    width: Math.max(1, Math.round(width * target / height)),
    height: target,
});

/**
 * Returns the file to upload: a JPEG exactly COVER_HEIGHT pixels high.
 * A JPEG that already has that height is sent as is. Throws an Error
 * with a Finnish message if the browser can't read the image (e.g. HEIC
 * on Android).
 */
export const prepareCoverUpload = async (file: File): Promise<File> => {
    let bitmap: ImageBitmap;
    try {
        // createImageBitmap applies the EXIF orientation of phone photos.
        bitmap = await createImageBitmap(file);
    } catch {
        throw new Error('Kuvaa ei voitu lukea. Käytä JPEG- tai PNG-kuvaa.');
    }

    if (isJpeg(file) && bitmap.height === COVER_HEIGHT) {
        bitmap.close();
        // Keep the bytes, but make sure the name ends in .jpg/.jpeg:
        // the backend checks the extension.
        return /\.jpe?g$/i.test(file.name)
            ? file
            : new File([file], jpegName(file.name), { type: 'image/jpeg' });
    }

    const { width, height } = fitToHeight(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        bitmap.close();
        throw new Error('Kuvan käsittely ei onnistunut.');
    }
    // JPEG has no transparency: put PNG covers on white, not black.
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>(resolve =>
        canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
    if (!blob) {
        throw new Error('Kuvan käsittely ei onnistunut.');
    }
    return new File([blob], jpegName(file.name), { type: 'image/jpeg' });
};
