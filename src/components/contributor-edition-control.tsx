import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Galleria } from "primereact/galleria";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Edition, CombinedEdition } from "@features/edition/types";
import { Person } from "@features/person/types";
import { GenreGroup } from "@features/genre";
import { TagGroup } from "@features/tag";
import { ImageGallery } from ".";
import { getCurrenUser } from "../services/auth-service";
import { editionIsOwned } from "@features/edition/utils/edition-is-owned";
import { groupSimilarEditions } from "@features/edition/utils/group-similar-editions";
import { combineEditions } from "@features/edition/utils/combine-editions";

interface ContributorEditionControlProps {
    /**
     * Editions to be displayed.
     */
    editions: Edition[];
    /**
     * The person object representing the contributor.
     */
    person: Person;
    /**
     * Sort order for editions.
     */
    sort?: string;
    /**
     * An optional boolean value indicating whether collaborations should be
     * displayed last.
     */
    collaborationsLast?: boolean;
    /**
     * Detail level for combining editions ('brief', 'condensed', or 'all').
     */
    detailLevel?: string;
}

export const ContributorEditionControl = ({
    editions,
    person,
    sort = "year",
    collaborationsLast = false,
    detailLevel = "brief"
}: ContributorEditionControlProps) => {
    const [expandedTags, setExpandedTags] = useState<Set<number>>(new Set());
    const [showAllImagesGallery, setShowAllImagesGallery] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(-1);
    const [currentEditionImages, setCurrentEditionImages] = useState<{ url: string; editionTitle: string; version?: number; editionnum?: number }[]>([]);

    // Get current user for ownership checking
    const currentUser = getCurrenUser();

    // Create list that contains all alias ids as well
    const person_ids = person.aliases.map(alias => alias.id);
    person_ids.push(person.id);

    // Group editions by editor/contributor, with person's own editions first
    const groupedEditions = useMemo(() => {
        // First, group similar editions and combine them
        const groups = groupSimilarEditions(editions, detailLevel);
        const combinedEditions = groups
            .map(group => combineEditions(group, currentUser))
            .filter((ed): ed is CombinedEdition => ed !== undefined);

        const grouped: { [key: string]: { editorStr: string, editions: CombinedEdition[] } } = {};

        combinedEditions.forEach(edition => {
            // Determine the editor/contributor string for this edition
            let editorStr = "Muut";

            // Check if this person contributed to this edition
            const personContribution = edition.contributions.find(contrib =>
                person_ids.includes(contrib.person.id)
            );

            if (personContribution) {
                editorStr = person.name;
            } else if (edition.editors && edition.editors.length > 0) {
                editorStr = edition.editors.map(editor => editor.name).join(", ");
            } else if (edition.work && edition.work.length > 0) {
                editorStr = edition.work[0].author_str.replace(" (toim.)", "") || "Tuntematon";
            }

            if (!grouped[editorStr]) {
                grouped[editorStr] = {
                    editorStr,
                    editions: []
                };
            }

            grouped[editorStr].editions.push(edition);
        });

        // Sort groups: person's editions first, then alphabetically
        const sortedKeys = Object.keys(grouped).sort((a, b) => {
            if (a === person.name) return -1;
            if (b === person.name) return 1;
            return a.localeCompare(b, "fi");
        });

        // If collaborationsLast is true, move collaborative editions to end
        if (collaborationsLast && person.name) {
            const personalIndex = sortedKeys.indexOf(person.name);
            if (personalIndex > -1) {
                const personalKey = sortedKeys.splice(personalIndex, 1)[0];
                sortedKeys.unshift(personalKey);
            }
        }

        return sortedKeys.map(key => grouped[key]);
    }, [editions, person, collaborationsLast, detailLevel, currentUser]);

    // Get all images from all editions for the gallery
    const getAllImagesFromAllEditions = () => {
        const allImages: { url: string; editionTitle: string; version?: number; editionnum?: number }[] = [];
        const seenUrls = new Set<string>();

        // First, group similar editions and combine them
        const groups = groupSimilarEditions(editions, detailLevel);
        const combinedEditions = groups
            .map(group => combineEditions(group, currentUser))
            .filter((ed): ed is CombinedEdition => ed !== undefined);

        editions.forEach(edition => {
            if (edition.images && edition.images.length > 0) {
                edition.images.forEach(img => {
                    const imageUrl = img.image_src.startsWith('http')
                        ? img.image_src
                        : `${import.meta.env.VITE_IMAGE_URL}${img.image_src}`;

                    // Only add if we haven't seen this URL before
                    if (!seenUrls.has(imageUrl)) {
                        seenUrls.add(imageUrl);
                        allImages.push({
                            url: imageUrl,
                            editionTitle: edition.title,
                            version: edition.version,
                            editionnum: typeof edition.editionnum === 'number' ? edition.editionnum : parseInt(String(edition.editionnum || 0))
                        });
                    }
                });
            }
        });

        return allImages;
    };

    const allEditionImages = useMemo(() => getAllImagesFromAllEditions(), [editions, detailLevel, currentUser]);

    // Format image info for gallery
    const formatImageInfo = (imageData: { editionTitle: string; version?: number; editionnum?: number }): string => {
        let result = imageData.editionTitle;

        if (imageData.version || imageData.editionnum) {
            const versionInfo = [];
            if (imageData.version) {
                versionInfo.push(`${imageData.version}. laitos`);
            }
            if (imageData.editionnum) {
                versionInfo.push(`${imageData.editionnum}. painos`);
            }
            if (versionInfo.length > 0) {
                result += ` (${versionInfo.join(', ')})`;
            }
        }

        return result;
    };

    // Format image info for individual edition (without edition title)
    const formatEditionImageInfo = (imageData: { version?: number; editionnum?: number }): string => {
        if (imageData.version || imageData.editionnum) {
            const versionInfo = [];
            if (imageData.version) {
                versionInfo.push(`${imageData.version}. laitos`);
            }
            if (imageData.editionnum) {
                versionInfo.push(`${imageData.editionnum}. painos`);
            }
            if (versionInfo.length > 0) {
                return versionInfo.join(', ');
            }
        }
        return "";
    };

    // Create galleria items
    const galleryItems = useMemo(() => {
        return allEditionImages.map((item, index) => ({
            itemImageSrc: item.url,
            thumbnailImageSrc: item.url,
            alt: `${item.editionTitle} kansi`,
            title: formatImageInfo(item)
        }));
    }, [allEditionImages]);

    // Create galleria items for current edition
    const currentEditionGalleryItems = useMemo(() => {
        return currentEditionImages.map((item, index) => ({
            itemImageSrc: item.url,
            thumbnailImageSrc: item.url,
            alt: `${item.editionTitle} kansi`,
            title: formatEditionImageInfo(item)
        }));
    }, [currentEditionImages]);

    // Function to show gallery for a specific edition
    const showEditionGallery = (edition: CombinedEdition) => {
        const editionImages = (edition.images || []).map(img => ({
            url: img.image_src.startsWith('http') ? img.image_src : `${import.meta.env.VITE_IMAGE_URL}${img.image_src}`,
            editionTitle: edition.title,
            version: edition.version,
            editionnum: typeof edition.editionnum === 'number' ? edition.editionnum : parseInt(String(edition.editionnum || 0))
        }));
        setCurrentEditionImages(editionImages);
        setCurrentImageIndex(-1); // Reset to show thumbnails first
        setShowAllImagesGallery(true);
    };

    // Galleria templates
    const itemTemplate = (item: any) => {
        return (
            <div className="text-center">
                <img
                    src={item.itemImageSrc}
                    alt={item.alt}
                    style={{ width: '100%', maxHeight: '60vh', objectFit: 'contain' }}
                />
                {item.title && (
                    <div className="mt-2 text-sm text-600">
                        {item.title}
                    </div>
                )}
            </div>
        );
    };

    const thumbnailTemplate = (item: any) => {
        return (
            <img
                src={item.thumbnailImageSrc}
                alt={item.alt}
                style={{ width: '60px', height: '60px', objectFit: 'cover' }}
            />
        );
    };

    // Format edition information
    const formatEdition = (edition: CombinedEdition): string => {
        let result = "";

        // Add star if user owns this edition
        if (currentUser && editionIsOwned(edition, currentUser)) {
            result += "★ ";
        }

        if (edition.version && edition.version > 1) {
            result += `${edition.version}. laitos `;
        }

        if (edition.editionnum) {
            result += `${edition.editionnum}. painos`;
        }

        // Add publisher before year with full stop
        if (edition.publisher) {
            result += `. ${edition.publisher.name}`;
        }

        if (edition.pubyear) {
            result += ` ${edition.pubyear}`;
        }

        // Add publisher series info to this edition
        if (edition.pubseries) {
            result += ` (${edition.pubseries.name}`;
            if (edition.pubseriesnum) {
                result += ` ${edition.pubseriesnum}`;
            }
            result += ')';
        }

        // Add full stop at the end
        result += '.';

        return result.trim();
    };

    if (groupedEditions.length === 0) {
        return <div>Ei painoksia löytynyt.</div>;
    }

    const toggleEditionTags = (editionId: number) => {
        setExpandedTags(prev => {
            const newSet = new Set(prev);
            if (newSet.has(editionId)) {
                newSet.delete(editionId);
            } else {
                newSet.add(editionId);
            }
            return newSet;
        });
    };

    return (
        <div>
            {/* Header with "View All Images" button */}
            {allEditionImages.length > 0 && (
                <div className="mb-3 flex justify-content-end">
                    <Button
                        icon="pi pi-images"
                        label={`Näytä kaikki kuvat (${allEditionImages.length})`}
                        className="p-button-outlined p-button-sm"
                        onClick={() => {
                            setCurrentEditionImages([]); // Clear current edition images to show all
                            setCurrentImageIndex(-1); // Reset to show thumbnails first
                            setShowAllImagesGallery(true);
                        }}
                    />
                </div>
            )}

            <div className="w-full">
                {groupedEditions.map((group, groupIndex) => (
                    <div key={group.editorStr} className="mb-4">
                        {/* Group header */}
                        {groupedEditions.length > 1 && group.editorStr !== person.name && (
                            <h3 className="text-xl font-semibold mb-3 text-700 pb-2 border-bottom-1 border-300">
                                {group.editorStr} ({group.editions.length})
                            </h3>
                        )}
                        <div className="edition-list">
                            {group.editions
                                .sort((a, b) => {
                                    if (sort === "year") {
                                        const yearA = typeof a.pubyear === 'number' ? a.pubyear : parseInt(String(a.pubyear || 0));
                                        const yearB = typeof b.pubyear === 'number' ? b.pubyear : parseInt(String(b.pubyear || 0));
                                        return yearA - yearB;
                                    }
                                    // Sort by author_str first, then by title
                                    const authorA = a.work && a.work.length > 0 ? (a.work[0].author_str || "") : "";
                                    const authorB = b.work && b.work.length > 0 ? (b.work[0].author_str || "") : "";
                                    if (authorA !== authorB) {
                                        return authorA.localeCompare(authorB, "fi");
                                    }
                                    return a.title.localeCompare(b.title, "fi");
                                })
                                .map((edition, index) => {
                                    const editionImages = edition.images || [];

                                    return (
                                        <div key={edition.id} className="mb-3 p-3 surface-50 border-round">
                                            <div className="grid align-items-start gap-3">
                                                <div className="col">
                                                    {/* Title with author */}
                                                    <div className="font-semibold mb-1">
                                                        <Link
                                                            to={`/editions/${edition.id}`}
                                                            className="no-underline text-primary hover:text-primary-700"
                                                        >
                                                            {edition.title}
                                                        </Link>
                                                    </div>

                                                    {/* Subtitle */}
                                                    {edition.subtitle && (
                                                        <div className="text-sm text-600 mb-1">
                                                            {edition.subtitle}
                                                        </div>
                                                    )}

                                                    {/* Original title and year */}
                                                    {edition.work && edition.work.length > 0 && (
                                                        <div className="text-sm text-700 mb-1">
                                                            {edition.work.map((work, workIndex) => (
                                                                <div key={work.id}>
                                                                    {work.orig_title && work.orig_title !== work.title && (
                                                                        <span>
                                                                            {work.orig_title}
                                                                            {work.language_name && work.language_name.name !== "suomi" && (
                                                                                <span> ({work.language_name.name})</span>
                                                                            )}
                                                                            {work.pubyear && (
                                                                                <span>, {work.pubyear}</span>
                                                                            )}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Edition details */}
                                                    <div className="text-sm text-500 mb-2">
                                                        <span dangerouslySetInnerHTML={{ __html: formatEdition(edition) }} />
                                                    </div>

                                                    {/* Genres and Tags from the work */}
                                                    {edition.work && edition.work.length > 0 && (
                                                        <div className="mt-2">
                                                            {edition.work[0].genres && edition.work[0].genres.length > 0 && (
                                                                <div className="mb-2">
                                                                    <GenreGroup genres={edition.work[0].genres} showOneCount />
                                                                </div>
                                                            )}
                                                            {edition.work[0].tags && edition.work[0].tags.length > 0 && (
                                                                <div>
                                                                    <Button
                                                                        icon={expandedTags.has(edition.id) ? "pi pi-chevron-up" : "pi pi-chevron-down"}
                                                                        label={`Asiasanat (${edition.work[0].tags.length})`}
                                                                        className="p-button-text p-button-sm p-0"
                                                                        onClick={() => toggleEditionTags(edition.id)}
                                                                    />
                                                                    {expandedTags.has(edition.id) && (
                                                                        <div className="mt-2">
                                                                            <TagGroup tags={edition.work[0].tags} showOneCount overflow={50} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Cover Image */}
                                                {editionImages.length > 0 && (
                                                    <div className="col-fixed" style={{ width: '182px' }}>
                                                        <div className="flex justify-content-end" style={{ minHeight: '182px' }}>
                                                            <ImageGallery
                                                                imageData={editionImages.map(img => ({
                                                                    url: img.image_src.startsWith('http') ? img.image_src : `${import.meta.env.VITE_IMAGE_URL}${img.image_src}`,
                                                                    version: edition.version,
                                                                    editionnum: typeof edition.editionnum === 'number' ? edition.editionnum : parseInt(String(edition.editionnum || 0))
                                                                }))}
                                                                alt={`${edition.title} kansi`}
                                                                height="150"
                                                                className="border-round shadow-2 hover:shadow-4 transition-all transition-duration-200"
                                                                imageClassName="object-fit-cover"
                                                                preview={editionImages.length === 1}
                                                                showGalleryButton={false}
                                                                onClick={editionImages.length > 1 ? () => showEditionGallery(edition) : undefined}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Image Gallery Dialog */}
            <Dialog
                header={currentEditionImages.length > 0
                    ? `${currentEditionImages[0]?.editionTitle} - Kuvat (${currentEditionImages.length})`
                    : `Kaikki kuvat (${allEditionImages.length})`
                }
                visible={showAllImagesGallery}
                onHide={() => {
                    setShowAllImagesGallery(false);
                    setCurrentImageIndex(-1); // Reset to thumbnails when closing
                    setCurrentEditionImages([]); // Clear current edition images
                }}
                style={{ width: '90vw', maxWidth: '1200px' }}
                contentStyle={{ padding: '1rem', overflow: 'auto' }}
                modal
                maximizable
            >
                {(currentEditionImages.length > 0 ? currentEditionGalleryItems : galleryItems).length > 0 && (
                    <>
                        {/* Show thumbnail grid initially */}
                        {currentImageIndex === -1 ? (
                            <div className="grid justify-content-center" style={{ width: '100%' }}>
                                {(currentEditionImages.length > 0 ? currentEditionGalleryItems : galleryItems).map((item, index) => (
                                    <div className="col-12 sm:col-6 md:col-4 lg:col-3 mb-3" key={index}>
                                        <div className="text-center cursor-pointer p-2" onClick={() => setCurrentImageIndex(index)}>
                                            <img
                                                src={item.itemImageSrc}
                                                alt={item.alt}
                                                style={{ width: '100%', maxHeight: '200px', objectFit: 'contain' }}
                                                className="border-round hover:opacity-80 transition-all transition-duration-200"
                                            />
                                            <div className="mt-2 text-sm text-600">
                                                {item.title}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* Show full gallery when image is selected */
                            <div>
                                <Button
                                    icon="pi pi-arrow-left"
                                    label="Takaisin"
                                    className="p-button-text mb-2"
                                    onClick={() => setCurrentImageIndex(-1)}
                                />
                                <Galleria
                                    value={currentEditionImages.length > 0 ? currentEditionGalleryItems : galleryItems}
                                    activeIndex={currentImageIndex}
                                    onItemChange={(e) => setCurrentImageIndex(e.index)}
                                    item={itemTemplate}
                                    thumbnail={thumbnailTemplate}
                                    numVisible={5}
                                    showThumbnails
                                    showIndicators
                                    showItemNavigators
                                    showItemNavigatorsOnHover
                                    circular
                                    autoPlay={false}
                                    transitionInterval={0}
                                />
                            </div>
                        )}
                    </>
                )}
            </Dialog>
        </div>
    );
};
