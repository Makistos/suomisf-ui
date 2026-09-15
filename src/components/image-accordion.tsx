import { useState } from "react";
import { Link } from "react-router-dom";

import { Genre, GenreGroup } from "@features/genre";
import { SfTag, TagGroup } from "@features/tag";

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
 * they don't fit on one). Hovering (or focusing) one hides every other item
 * and expands that one to show its description to the right of the image -
 * moving it to the left edge of the component in the process, since it ends
 * up the only item left.
 */
export const ImageAccordion = ({ items, imageHeight = DEFAULT_IMAGE_HEIGHT }: ImageAccordionProps) => {
    const [activeId, setActiveId] = useState<number | null>(null);

    return (
        <div className="image-accordion">
            {items.map(item => {
                const isActive = activeId === item.id;
                if (activeId !== null && !isActive) {
                    return null;
                }
                return (
                    <div
                        key={item.id}
                        className={`image-accordion-item${isActive ? " image-accordion-item-active" : ""}`}
                        style={{ order: isActive ? -1 : 0, height: isActive ? undefined : `${imageHeight}px` }}
                        onMouseEnter={() => setActiveId(item.id)}
                        onMouseLeave={() => setActiveId(null)}
                        onFocus={() => setActiveId(item.id)}
                        onBlur={() => setActiveId(null)}
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
                        {isActive && (
                            <div className="image-accordion-details">
                                <div className="image-accordion-details-title">{item.title}</div>
                                {item.author && (
                                    <div className="image-accordion-details-author">{item.author}</div>
                                )}
                                {item.genres && item.genres.length > 0 && (
                                    <GenreGroup genres={item.genres} className="mb-2" />
                                )}
                                {item.description && (
                                    <div
                                        className="image-accordion-details-description html-content"
                                        dangerouslySetInnerHTML={{ __html: item.description }}
                                    />
                                )}
                                {item.tags && item.tags.length > 0 && (
                                    <div className="mt-2">
                                        <TagGroup tags={item.tags} overflow={5} showOneCount />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ImageAccordion;
