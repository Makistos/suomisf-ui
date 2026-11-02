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
import { KirjasampoImportedNote } from "@features/tag/components/kirjasampo-imported-note";
import { safeHtml } from "@utils/safe-html";

export interface ImageAccordionItem {
    id: number;
    imageSrc: string | null;
    imageAlt: string;
    title: string;
    author?: string;
    description?: string;
    genres?: Genre[];
    tags?: SfTag[];
    // When Kirjasampo tags were last imported (ISO timestamp), if ever.
    kirjasampoImported?: string | null;
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
 *
 * On touch screens there is no hover: the first tap on a cover opens its
 * panel (instead of following the link), tapping the cover in the panel
 * follows the link, and tapping anywhere outside the panel closes it.
 * Hover is reacted to only for a real mouse and focus only for keyboard
 * focus, because a tap also fires emulated mouseenter and focus events -
 * those used to swap the overlay in under the finger mid-tap, so the tap's
 * click was lost and nothing happened at all.
 */
export const ImageAccordion = ({ items, imageHeight = DEFAULT_IMAGE_HEIGHT }: ImageAccordionProps) => {
    const [activeId, setActiveId] = useState<number | null>(null);
    const [activeTop, setActiveTop] = useState(0);
    const itemRefs = useRef(new Map<number, HTMLDivElement>());
    const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    // Pointer type of the latest press, to tell a tap from a mouse click.
    const lastPointerType = useRef<string>("mouse");
    // Whether the panel was opened by keyboard focus; only then does losing
    // focus close it (a tap leaves focus on the cover, and the panel should
    // stay open until the next tap elsewhere).
    const keyboardFocus = useRef(false);

    useEffect(() => () => {
        if (leaveTimer.current !== null) clearTimeout(leaveTimer.current);
    }, []);

    // A tap outside the open panel closes it (a mouse closes it by leaving).
    useEffect(() => {
        if (activeId === null) return;
        const onPointerDown = (e: PointerEvent) => {
            if (e.pointerType === "mouse") return;
            if (overlayRef.current?.contains(e.target as Node)) return;
            setActiveId(null);
        };
        document.addEventListener("pointerdown", onPointerDown);
        return () => document.removeEventListener("pointerdown", onPointerDown);
    }, [activeId]);

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

    const onPointerEnter = (e: React.PointerEvent, id: number) => {
        if (e.pointerType === "mouse") activate(id);
    };
    const onPointerLeave = (e: React.PointerEvent) => {
        if (e.pointerType === "mouse") scheduleDeactivate();
    };
    const onFocus = (e: React.FocusEvent, id: number) => {
        if ((e.target as HTMLElement).matches(":focus-visible")) {
            keyboardFocus.current = true;
            activate(id);
        }
    };
    const onBlur = (e: React.FocusEvent) => {
        // Focus moving between links inside the panel keeps it open.
        if (overlayRef.current?.contains(e.relatedTarget as Node | null)) return;
        if (keyboardFocus.current) {
            keyboardFocus.current = false;
            scheduleDeactivate();
        }
    };
    // First tap on a closed cover opens its panel instead of navigating.
    const onCoverClick = (e: React.MouseEvent, id: number) => {
        if (lastPointerType.current !== "mouse" && activeId !== id) {
            e.preventDefault();
            activate(id);
        }
    };

    const activeItem = items.find(item => item.id === activeId) ?? null;

    return (
        <div
            className="image-accordion"
            onPointerDownCapture={e => { lastPointerType.current = e.pointerType; }}
        >
            {items.map(item => (
                <div
                    key={item.id}
                    ref={el => {
                        if (el) itemRefs.current.set(item.id, el);
                        else itemRefs.current.delete(item.id);
                    }}
                    className="image-accordion-item"
                    style={{ height: `${imageHeight}px`, opacity: activeId === item.id ? 0 : 1 }}
                    onPointerEnter={e => onPointerEnter(e, item.id)}
                    onPointerLeave={onPointerLeave}
                    onFocus={e => onFocus(e, item.id)}
                    onBlur={onBlur}
                >
                    <Link
                        to={item.linkTo}
                        className="image-accordion-cover-link"
                        onClick={e => onCoverClick(e, item.id)}
                    >
                        {item.imageSrc ? (
                            <img
                                alt={item.imageAlt}
                                src={item.imageSrc}
                                loading="lazy"
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
                    ref={overlayRef}
                    className="image-accordion-overlay"
                    style={{ top: `${activeTop}px` }}
                    onPointerEnter={e => onPointerEnter(e, activeItem.id)}
                    onPointerLeave={onPointerLeave}
                    onFocus={e => onFocus(e, activeItem.id)}
                    onBlur={onBlur}
                >
                    {/* Duplicates the covered item's link, which keeps the focus. */}
                    <Link to={activeItem.linkTo} className="image-accordion-cover-link" tabIndex={-1}>
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
                                dangerouslySetInnerHTML={safeHtml(activeItem.description)}
                            />
                        )}
                        {activeItem.tags && activeItem.tags.length > 0 && (
                            <div className="mt-2">
                                <TagGroup tags={activeItem.tags} overflow={5} showOneCount />
                            </div>
                        )}
                        {activeItem.kirjasampoImported && (
                            <div className="mt-2">
                                <KirjasampoImportedNote imported={activeItem.kirjasampoImported} />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageAccordion;
