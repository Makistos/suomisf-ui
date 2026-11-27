import { forwardRef, MouseEvent, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Galleria } from "primereact/galleria";

import { coverUrl, thumbUrl } from "@utils/cover-url";
import type { CoverItem } from "../utils/work-facts";
import type { CoverTarget } from "./cover-tools";

export interface CoverGalleryHandle {
    /** Opens the gallery on these covers at the given one. */
    open: (covers: CoverItem[], at: number) => void;
}

/**
 * Full-screen gallery of covers (the work's, or one table row's): the full-size image with its printing as the caption,
 * arrows and thumbnails to move between covers. One instance per page.
 *
 * Galleria renders nothing while it has no covers, and when its content (a Portal) mounts already open, its transition
 * skips onEntering, which adds the dark overlay and the z-index: the white controls were then invisible on the page and
 * the admin SpeedDial sat on top of them. So it is mounted with the work's covers from the start, and a row's covers are
 * swapped in before show() runs.
 */
export const CoverGallery = forwardRef<CoverGalleryHandle, { initial: CoverItem[]; onCoverMenu?: (e: MouseEvent, t: CoverTarget) => void }>(({ initial, onCoverMenu }, ref) => {
    const galleria = useRef<Galleria>(null);
    // Mounted with the work's covers, so Galleria's content and Portal are in the page before the first open.
    const [covers, setCovers] = useState<CoverItem[]>(initial);
    const [index, setIndex] = useState(0);
    // Counts open requests; each one shows the gallery once its covers have rendered.
    const [opens, setOpens] = useState(0);
    useImperativeHandle(ref, () => ({
        open: (items, at) => {
            setCovers(items);
            setIndex(at);
            setOpens(n => n + 1);
        },
    }), []);
    useEffect(() => {
        if (opens > 0) galleria.current?.show();
    }, [opens]);
    return (
        <Galleria ref={galleria} value={covers} activeIndex={index} onItemChange={e => setIndex(e.index)}
            fullScreen circular showItemNavigators showThumbnails={covers.length > 1} numVisible={Math.max(1, Math.min(covers.length, 7))}
            className="wn-gallery" style={{ maxWidth: "min(92vw, 900px)" }}
            item={(c: CoverItem) => <img className="wn-gallery-img" src={coverUrl(c.image)} alt={`Kansikuva: ${c.caption}`}
                onContextMenu={e => onCoverMenu?.(e, { image: c.image, imageEdition: c.edition.id, addTo: c.edition.id })} />}
            thumbnail={(c: CoverItem) => <img className="wn-gallery-thumb" src={thumbUrl(c.image)} alt="" />}
            caption={(c: CoverItem) => <span className="wn-gallery-cap">{c.caption}</span>} />
    );
});
CoverGallery.displayName = "CoverGallery";
