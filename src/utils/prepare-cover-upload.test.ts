import { afterEach, describe, expect, it, vi } from 'vitest';
import { COVER_HEIGHT, fitToHeight, jpegName, prepareCoverUpload } from './prepare-cover-upload';

const file = (name: string, type: string, size: number) =>
    new File([new Uint8Array(size)], name, { type });

const stubBitmap = (width: number, height: number) =>
    vi.stubGlobal('createImageBitmap', vi.fn<() => Promise<unknown>>().mockResolvedValue({ width, height, close: vi.fn<() => void>() }));

describe('jpegName', () => {
    it('replaces the extension', () => {
        expect(jpegName('IMG_0001.HEIC')).toBe('IMG_0001.jpg');
        expect(jpegName('kuva.png')).toBe('kuva.jpg');
    });
    it('adds one when missing', () => {
        expect(jpegName('1000012345')).toBe('1000012345.jpg');
    });
    it('falls back to a name for an empty stem', () => {
        expect(jpegName('.png')).toBe('kansikuva.jpg');
    });
});

describe('fitToHeight', () => {
    it('scales a tall photo down to exactly 500 px high', () => {
        expect(fitToHeight(3000, 4000)).toEqual({ width: 375, height: COVER_HEIGHT });
    });
    it('scales a small image up', () => {
        expect(fitToHeight(200, 300)).toEqual({ width: 333, height: COVER_HEIGHT });
    });
});

describe('prepareCoverUpload', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('returns a JPEG that is already 500 px high unchanged', async () => {
        stubBitmap(330, COVER_HEIGHT);
        const f = file('cover.jpg', 'image/jpeg', 1000);
        expect(await prepareCoverUpload(f)).toBe(f);
    });

    it('renames a 500 px JPEG without a .jpg extension', async () => {
        stubBitmap(330, COVER_HEIGHT);
        const out = await prepareCoverUpload(file('photo', 'image/jpeg', 1000));
        expect(out.name).toBe('photo.jpg');
        expect(out.size).toBe(1000);
    });

    it('gives a readable error when the image cannot be decoded', async () => {
        vi.stubGlobal('createImageBitmap', vi.fn<() => Promise<ImageBitmap>>().mockRejectedValue(new Error('x')));
        await expect(prepareCoverUpload(file('a.heic', 'image/heic', 5000)))
            .rejects.toThrow('Kuvaa ei voitu lukea');
    });
});
