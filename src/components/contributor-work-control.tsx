import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Galleria } from "primereact/galleria";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Work } from "@features/work/types";
import { Edition } from "@features/edition/types";
import { GenreGroup } from "@features/genre";
import { TagGroup } from "@features/tag";
import { ImageGallery } from ".";
import { getCurrenUser } from "../services/auth-service";
import { editionIsOwned } from "@features/edition/utils/edition-is-owned";

interface ContributorWorkControlProps {
    /**
     * Works to be displayed.
     */
    works: Work[];
    person?: number; // Optional person ID for filtering contributions
    personName?: string; // Person name for grouping
    collaborationsLast?: boolean;
}

export const ContributorWorkControl = ({ works, person, personName = "", collaborationsLast = false }: ContributorWorkControlProps) => {
    const [expandedTags, setExpandedTags] = useState<Set<number>>(new Set());
    const [showAllImagesGallery, setShowAllImagesGallery] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(-1);
    const [currentWorkImages, setCurrentWorkImages] = useState<{ url: string; workTitle: string; version?: number; editionnum?: number }[]>([]);

    // Get current user for ownership checking
    const currentUser = getCurrenUser();

    // Group works by author_str, with person's own works first
    const groupedWorks = useMemo(() => {
        const grouped: { [key: string]: { authorStr: string, works: Work[] } } = {};

        works.forEach(work => {
            const authorStr = work.author_str || "Tuntematon";

            if (!grouped[authorStr]) {
                grouped[authorStr] = {
                    authorStr,
                    works: []
                };
            }

            grouped[authorStr].works.push(work);
        });

        // Sort groups: person's works first, then alphabetically
        const sortedKeys = Object.keys(grouped).sort((a, b) => {
            if (a === personName) return -1;
            if (b === personName) return 1;
            return a.localeCompare(b, "fi");
        });

        // If collaborationsLast is true, move collaborative works to end
        if (collaborationsLast && personName) {
            const personalIndex = sortedKeys.indexOf(personName);
            if (personalIndex > -1) {
                const personalKey = sortedKeys.splice(personalIndex, 1)[0];
                sortedKeys.unshift(personalKey);
            }
        }

        // Sort works within each group by title using Finnish locale
        return sortedKeys.map(key => ({
            ...grouped[key],
            works: grouped[key].works.sort((a, b) => a.title.localeCompare(b.title, "fi"))
        }));
    }, [works, person, personName, collaborationsLast]);

    // Get the first edition with an image for a work
    const getFirstEditionWithImage = (work: Work): Edition | null => {
        if (!work.editions || work.editions.length === 0) return null;

        // Sort editions by year only
        const sortedEditions = [...work.editions].sort((a, b) => {
            const yearA = typeof a.pubyear === 'number' ? a.pubyear : parseInt(String(a.pubyear || 0));
            const yearB = typeof b.pubyear === 'number' ? b.pubyear : parseInt(String(b.pubyear || 0));
            return yearA - yearB;
        });

        return sortedEditions.find(edition => edition.images && edition.images.length > 0) || sortedEditions[0] || null;
    };

    // Get all images from all editions of a work
    const getAllImagesFromWork = (work: Work): { url: string; version?: number; editionnum?: number }[] => {
        if (!work.editions || work.editions.length === 0) return [];

        const allImages: { url: string; version?: number; editionnum?: number }[] = [];
        const seenUrls = new Set<string>();

        work.editions.forEach(edition => {
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
                            version: edition.version,
                            editionnum: typeof edition.editionnum === 'number' ? edition.editionnum : parseInt(String(edition.editionnum || 0))
                        });
                    }
                });
            }
        });

        return allImages;
    };

    // Get all images from all works for the gallery
    const getAllImagesFromAllWorks = () => {
        const allImages: { url: string; workTitle: string; version?: number; editionnum?: number }[] = [];
        const seenUrls = new Set<string>();

        works.forEach(work => {
            if (work.editions && work.editions.length > 0) {
                work.editions.forEach(edition => {
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
                                    workTitle: work.title,
                                    version: edition.version,
                                    editionnum: typeof edition.editionnum === 'number' ? edition.editionnum : parseInt(String(edition.editionnum || 0))
                                });
                            }
                        });
                    }
                });
            }
        });

        return allImages;
    };

    const allWorksImages = useMemo(() => getAllImagesFromAllWorks(), [works]);

    // Format image info for gallery
    const formatImageInfo = (imageData: { workTitle: string; version?: number; editionnum?: number }): string => {
        let result = imageData.workTitle;

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

    // Format image info for individual work (without work title)
    const formatWorkImageInfo = (imageData: { version?: number; editionnum?: number }): string => {
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
        return allWorksImages.map((item, index) => ({
            itemImageSrc: item.url,
            thumbnailImageSrc: item.url,
            alt: `${item.workTitle} kansi`,
            title: formatImageInfo(item)
        }));
    }, [allWorksImages]);

    // Create galleria items for current work
    const currentWorkGalleryItems = useMemo(() => {
        return currentWorkImages.map((item, index) => ({
            itemImageSrc: item.url,
            thumbnailImageSrc: item.url,
            alt: `${item.workTitle} kansi`,
            title: formatWorkImageInfo(item)
        }));
    }, [currentWorkImages]);

    // Function to show gallery for a specific work
    const showWorkGallery = (work: Work) => {
        const workImages = getAllImagesFromWork(work).map(img => ({
            ...img,
            workTitle: work.title
        }));
        setCurrentWorkImages(workImages);
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
    const formatEdition = (edition: Edition, workTitle: string): string => {
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

            // Add edition title if different from work title
            if (edition.title && edition.title !== workTitle) {
                result += `: <strong>${edition.title}</strong>`;
            }
        }

        // Add publisher before year with full stop
        if (edition.publisher) {
            if (result.length > 2 && !result.endsWith('.')) {
                result += ". ";
            }
            result += `${edition.publisher.name}`;
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

    if (groupedWorks.length === 0) {
        return <div>Ei teoksia.</div>;
    }

    const toggleWorkTags = (workId: number) => {
        setExpandedTags(prev => {
            const newSet = new Set(prev);
            if (newSet.has(workId)) {
                newSet.delete(workId);
            } else {
                newSet.add(workId);
            }
            return newSet;
        });
    };

    return (
        <div>
            {/* Header with "View All Images" button */}
            {allWorksImages.length > 0 && (
                <div className="mb-3 flex justify-content-end">
                    <Button
                        icon="pi pi-images"
                        label={`Näytä kaikki kuvat (${allWorksImages.length})`}
                        className="p-button-outlined p-button-sm"
                        onClick={() => {
                            setCurrentWorkImages([]); // Clear current work images to show all
                            setCurrentImageIndex(-1); // Reset to show thumbnails first
                            setShowAllImagesGallery(true);
                        }}
                    />
                </div>
            )}

            <div className="w-full">
                {groupedWorks.map((group, groupIndex) => (
                    <div key={group.authorStr} className="mb-4">
                        {/* Group header */}
                        {groupedWorks.length > 1 && group.authorStr !== personName && (
                            <h3 className="text-xl font-semibold mb-3 text-700 pb-2 border-bottom-1 border-300">
                                {group.authorStr} ({group.works.length})
                            </h3>
                        )}
                        <div className="work-list">
                            {group.works.map((work, index) => {
                                const firstEdition = getFirstEditionWithImage(work);
                                const allImages = getAllImagesFromWork(work);

                                return (
                                    <div key={work.id} className="mb-3 p-3 surface-50 border-round">
                                        <div className="grid align-items-start gap-3">
                                            <div className="col">
                                                {/* Title */}
                                                <div className="font-semibold mb-1">
                                                    <Link
                                                        to={`/works/${work.id}`}
                                                        className="no-underline text-primary hover:text-primary-700"
                                                    >
                                                        {work.title}
                                                    </Link>
                                                </div>

                                                {/* Original name and language */}
                                                {work.orig_title && work.orig_title !== work.title && (
                                                    <div className="text-sm text-600 mb-1">
                                                        {work.orig_title}
                                                        {work.language && work.language.name !== "suomi" && (
                                                            <span> ({work.language.name})</span>
                                                        )}
                                                        {work.pubyear && (
                                                            <span> {work.pubyear}</span>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Bookseries */}
                                                {work.bookseries && (
                                                    <div className="text-sm text-700 mb-1">
                                                        <Link
                                                            to={`/bookseries/${work.bookseries.id}`}
                                                            className="no-underline text-primary hover:text-primary-700"
                                                        >
                                                            {work.bookseries.name}
                                                        </Link>
                                                        {work.bookseriesnum && <span> #{work.bookseriesnum}</span>}
                                                    </div>
                                                )}

                                                {/* Editions */}
                                                {work.editions && work.editions.length > 0 && (
                                                    <div className="text-sm text-500 mb-2">
                                                        {work.editions
                                                            .sort((a, b) => {
                                                                const yearA = typeof a.pubyear === 'number' ? a.pubyear : parseInt(String(a.pubyear || 0));
                                                                const yearB = typeof b.pubyear === 'number' ? b.pubyear : parseInt(String(b.pubyear || 0));
                                                                return yearA - yearB;
                                                            })
                                                            .map((edition, edIndex) => (
                                                                <div key={edition.id}>
                                                                    <Link
                                                                        to={`/editions/${edition.id}`}
                                                                        className="no-underline text-primary hover:text-primary-700"
                                                                    >
                                                                        <span dangerouslySetInnerHTML={{ __html: formatEdition(edition, work.title) }} />
                                                                    </Link>
                                                                </div>
                                                            ))
                                                        }
                                                    </div>
                                                )}

                                                {/* Genres and Tags */}
                                                <div className="mt-2">
                                                    {work.genres && work.genres.length > 0 && (
                                                        <div className="mb-2">
                                                            <GenreGroup genres={work.genres} showOneCount />
                                                        </div>
                                                    )}
                                                    {work.tags && work.tags.length > 0 && (
                                                        <div>
                                                            <Button
                                                                icon={expandedTags.has(work.id) ? "pi pi-chevron-up" : "pi pi-chevron-down"}
                                                                label={`Asiasanat (${work.tags.length})`}
                                                                className="p-button-text p-button-sm p-0"
                                                                onClick={() => toggleWorkTags(work.id)}
                                                            />
                                                            {expandedTags.has(work.id) && (
                                                                <div className="mt-2">
                                                                    <TagGroup tags={work.tags} showOneCount overflow={50} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Cover Image */}
                                            {allImages.length > 0 && (
                                                <div className="col-fixed" style={{ width: '182px' }}>
                                                    <div className="flex justify-content-end" style={{ minHeight: '182px' }}>
                                                        <ImageGallery
                                                            imageData={allImages}
                                                            alt={`${work.title} kansi`}
                                                            height="150"
                                                            className="border-round shadow-2 hover:shadow-4 transition-all transition-duration-200"
                                                            imageClassName="object-fit-cover"
                                                            preview={allImages.length === 1}
                                                            showGalleryButton={false}
                                                            onClick={allImages.length > 1 ? () => showWorkGallery(work) : undefined}
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
                header={currentWorkImages.length > 0
                    ? `${currentWorkImages[0]?.workTitle} - Kuvat (${currentWorkImages.length})`
                    : `Kaikki kuvat (${allWorksImages.length})`
                }
                visible={showAllImagesGallery}
                onHide={() => {
                    setShowAllImagesGallery(false);
                    setCurrentImageIndex(-1); // Reset to thumbnails when closing
                    setCurrentWorkImages([]); // Clear current work images
                }}
                style={{ width: '90vw', maxWidth: '1200px' }}
                contentStyle={{ padding: '1rem', overflow: 'auto' }}
                modal
                maximizable
            >
                {(currentWorkImages.length > 0 ? currentWorkGalleryItems : galleryItems).length > 0 && (
                    <>
                        {/* Show thumbnail grid initially */}
                        {currentImageIndex === -1 ? (
                            <div className="grid justify-content-center" style={{ width: '100%' }}>
                                {(currentWorkImages.length > 0 ? currentWorkGalleryItems : galleryItems).map((item, index) => (
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
                                    value={currentWorkImages.length > 0 ? currentWorkGalleryItems : galleryItems}
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
