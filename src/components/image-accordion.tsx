import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

// Import directly from the leaf modules, not the "@features/genre"/
// "@features/tag" barrels - those re-export whole route pages (and even
// mainmenu.tsx, for genre) alongside the components actually needed here,
// which pulls that unrelated code into whatever chunk imports this file.
import { Genre } from "@features/genre/types";
import { GenreGroup } from "@features/genre/components/genre-group";
import { SfTag } from "@features/tag/types";
import { TagGroup } from "@features/tag/components/sftag-group";

export interface ImageAccordionItem {
    id: number;
    imageSrc: string | null;
    imageAlt: string;
    title: string;
    author?: string;
    description?: string;
    genres?: Genre[];
    tags?: SfTag[];
    linkTo: string;
}

interface ImageAccordionProps {
    items: ImageAccordionItem[];
    imageHeight?: number;
}

const DEFAULT_IMAGE_HEIGHT = 160;

/**
 * A row of images that, at rest, sit side by side like a normal cover strip
 * (same size as the "latest additions" covers, wrapping onto more lines if
 * they don't fit on one). Hovering (or focusing) one shows its description
 * to the right of the image in a panel that expands leftward over the rest
 * of that image's row - without touching any other item's position.
 *
 * The resting grid never reflows: the active item's own box (and every
 * other item's box) stays exactly where it was, and the expanded panel is
 * an absolutely positioned overlay anchored to that box's row. Earlier
 * versions hid every other item and reordered the active one to the front,
 * which collapsed the whole grid down to one row - if the hovered item
 * wasn't already in the first row, that reflow moved it out from under the
 * cursor, which immediately un-hovered it (a self-cancelling loop that made
 * every row after the first unusable).
 */
export const ImageAccordion = ({ items, imageHeight = DEFAULT_IMAGE_HEIGHT }: ImageAccordionProps) => {
    const [activeId, setActiveId] = useState<number | null>(null);
    const [activeTop, setActiveTop] = useState(0);
    const itemRefs = useRef(new Map<number, HTMLDivElement>());
    const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => () => {
        if (leaveTimer.current !== null) clearTimeout(leaveTimer.current);
    }, []);

    // The overlay sits on top of (and covers) the item that triggered it, so
    // moving the mouse onto the overlay fires that item's mouseleave right
    // as the overlay's own mouseenter fires. Deferring the actual
    // deactivation by a tick - and cancelling it if any tracked element
    // reports another mouseenter first - absorbs that handoff instead of
    // letting the two events fight and flicker the overlay open/closed.
    const activate = (id: number) => {
        if (leaveTimer.current !== null) {
            clearTimeout(leaveTimer.current);
            leaveTimer.current = null;
        }
        const el = itemRefs.current.get(id);
        if (el) setActiveTop(el.offsetTop);
        setActiveId(id);
    };
    const scheduleDeactivate = () => {
        if (leaveTimer.current !== null) clearTimeout(leaveTimer.current);
        leaveTimer.current = setTimeout(() => setActiveId(null), 0);
    };

    const activeItem = items.find(item => item.id === activeId) ?? null;

    return (
        <div className="image-accordion">
            {items.map(item => (
                <div
                    key={item.id}
                    ref={el => {
                        if (el) itemRefs.current.set(item.id, el);
                        else itemRefs.current.delete(item.id);
                    }}
                    className="image-accordion-item"
                    style={{ height: `${imageHeight}px`, visibility: activeId === item.id ? "hidden" : "visible" }}
                    onMouseEnter={() => activate(item.id)}
                    onMouseLeave={scheduleDeactivate}
                    onFocus={() => activate(item.id)}
                    onBlur={scheduleDeactivate}
                >
                    <Link to={item.linkTo} className="image-accordion-cover-link">
                        {item.imageSrc ? (
                            <img
                                alt={item.imageAlt}
                                src={item.imageSrc}
                                className="image-accordion-cover"
                                style={{ height: `${imageHeight}px` }}
                            />
                        ) : (
                            <div
                                className="image-accordion-cover-fallback"
                                style={{ height: `${imageHeight}px` }}
                            >
                                {item.author && (
                                    <span className="image-accordion-cover-author">{item.author}</span>
                                )}
                                <span className="image-accordion-cover-title">{item.title}</span>
                            </div>
                        )}
                    </Link>
                </div>
            ))}
            {activeItem && (
                <div
                    className="image-accordion-overlay"
                    style={{ top: `${activeTop}px` }}
                    onMouseEnter={() => activate(activeItem.id)}
                    onMouseLeave={scheduleDeactivate}
                >
                    <Link to={activeItem.linkTo} className="image-accordion-cover-link">
                        {activeItem.imageSrc ? (
                            <img
                                alt={activeItem.imageAlt}
                                src={activeItem.imageSrc}
                                className="image-accordion-cover"
                                style={{ height: `${imageHeight}px` }}
                            />
                        ) : (
                            <div
                                className="image-accordion-cover-fallback"
                                style={{ height: `${imageHeight}px` }}
                            >
                                {activeItem.author && (
                                    <span className="image-accordion-cover-author">{activeItem.author}</span>
                                )}
                                <span className="image-accordion-cover-title">{activeItem.title}</span>
                            </div>
                        )}
                    </Link>
                    <div className="image-accordion-details">
                        <div className="image-accordion-details-title">{activeItem.title}</div>
                        {activeItem.author && (
                            <div className="image-accordion-details-author">{activeItem.author}</div>
                        )}
                        {activeItem.genres && activeItem.genres.length > 0 && (
                            <GenreGroup genres={activeItem.genres} className="mb-2" />
                        )}
                        {activeItem.description && (
                            <div
                                className="image-accordion-details-description html-content"
                                dangerouslySetInnerHTML={{ __html: activeItem.description }}
                            />
                        )}
                        {activeItem.tags && activeItem.tags.length > 0 && (
                            <div className="mt-2">
                                <TagGroup tags={activeItem.tags} overflow={5} showOneCount />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageAccordion;
