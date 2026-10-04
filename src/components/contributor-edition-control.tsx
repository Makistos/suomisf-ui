import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Galleria } from "primereact/galleria";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Edition } from "@features/edition/types";
import { Work } from "@features/work/types";
import { Person } from "@features/person/types";
import { GenreGroup } from "@features/genre";
import { TagGroup } from "@features/tag";
import { ImageGallery } from ".";
import { getCurrenUser } from "../services/auth-service";
import { editionIsOwned } from "@features/edition/utils/edition-is-owned";
import { editionIsWishlisted } from "@features/edition/utils/edition-is-wishlisted";
import { thumbUrl } from "../utils/cover-url";

interface ContributorEditionControlProps {
    /**
     * Editions to be displayed - already filtered down to the ones the
     * person actually contributed to in the relevant role (translator,
     * editor, cover art, illustration).
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
}

interface WorkEditionsGroup {
    work: Work;
    editions: Edition[];
}

const editionYear = (edition: Edition): number =>
    typeof edition.pubyear === 'number' ? edition.pubyear : parseInt(String(edition.pubyear || 0));

export const ContributorEditionControl = ({
    editions,
    person,
    sort = "year",
    collaborationsLast = false,
}: ContributorEditionControlProps) => {
    const [expandedTags, setExpandedTags] = useState<Set<number>>(new Set());
    const [showAllImagesGallery, setShowAllImagesGallery] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(-1);
    const [currentWorkImages, setCurrentWorkImages] = useState<{ url: string; thumbUrl?: string; workTitle: string; version?: number; editionnum?: number }[]>([]);

    // Get current user for ownership checking
    const currentUser = getCurrenUser();

    // Create list that contains all alias ids as well
    const person_ids = useMemo(
        () => [...person.aliases.map(alias => alias.id), person.id],
        [person.aliases, person.id]);

    // Group editions by work, keeping every edition of that work the
    // person contributed to in this role as its own line - mirrors how
    // ContributorWorkControl lists every edition under one work card,
    // instead of collapsing them into a single merged row.
    const groupedEditions = useMemo(() => {
        const byWork = new Map<number, WorkEditionsGroup>();
        for (const edition of editions) {
            if (!edition.work) continue;
            const key = edition.work.id;
            if (!byWork.has(key)) {
                byWork.set(key, { work: edition.work, editions: [] });
            }
            byWork.get(key)!.editions.push(edition);
        }
        const workGroups = Array.from(byWork.values());

        const grouped: { [key: string]: { editorStr: string, workGroups: WorkEditionsGroup[] } } = {};

        workGroups.forEach(wg => {
            // Determine the editor/contributor string for this work, from
            // any of its (filtered) editions - a person might be credited
            // on only one of several editions of the same work.
            let editorStr = "Muut";
            const allContributions = wg.editions.flatMap(ed => ed.contributions);
            const personContribution = allContributions.find(contrib =>
                person_ids.includes(contrib.person.id)
            );
            const editors = Array.from(new Set(
                wg.editions.flatMap(ed => ed.editors ?? []).map(editor => editor.name)
            ));

            if (personContribution) {
                editorStr = person.name;
            } else if (editors.length > 0) {
                editorStr = editors.join(", ");
            } else {
                editorStr = wg.work.author_str?.replace(" (toim.)", "") || "Tuntematon";
            }

            if (!grouped[editorStr]) {
                grouped[editorStr] = {
                    editorStr,
                    workGroups: []
                };
            }

            grouped[editorStr].workGroups.push(wg);
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
    }, [editions, person, person_ids, collaborationsLast]);

    // Get all images from every (filtered) edition of a work
    const getAllImagesFromWork = (workGroup: WorkEditionsGroup): { url: string; thumbUrl?: string; version?: number; editionnum?: number }[] => {
        const allImages: { url: string; thumbUrl?: string; version?: number; editionnum?: number }[] = [];
        const seenUrls = new Set<string>();

        workGroup.editions.forEach(edition => {
            (edition.images ?? []).forEach(img => {
                const imageUrl = img.image_src.startsWith('http')
                    ? img.image_src
                    : `${import.meta.env.VITE_IMAGE_URL}${img.image_src}`;

                if (!seenUrls.has(imageUrl)) {
                    seenUrls.add(imageUrl);
                    allImages.push({
                        url: imageUrl,
                        thumbUrl: thumbUrl(img),
                        version: edition.version,
                        editionnum: typeof edition.editionnum === 'number' ? edition.editionnum : parseInt(String(edition.editionnum || 0))
                    });
                }
            });
        });

        return allImages;
    };

    // Get all images from every work for the "view all" gallery

    const allWorkImages = useMemo(() => {
        const allImages: { url: string; thumbUrl?: string; workTitle: string; version?: number; editionnum?: number }[] = [];
        const seenUrls = new Set<string>();

        groupedEditions.forEach(group => {
            group.workGroups.forEach(wg => {
                getAllImagesFromWork(wg).forEach(img => {
                    if (!seenUrls.has(img.url)) {
                        seenUrls.add(img.url);
                        allImages.push({ ...img, workTitle: wg.work.title });
                    }
                });
            });
        });

        return allImages;
    }, [groupedEditions]);

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

    // Format image info for an individual work (without the work title)
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
        return allWorkImages.map((item) => ({
            itemImageSrc: item.url,
            thumbnailImageSrc: item.thumbUrl ?? item.url,
            alt: `${item.workTitle} kansi`,
            title: formatImageInfo(item)
        }));
    }, [allWorkImages]);

    // Create galleria items for the currently opened work
    const currentWorkGalleryItems = useMemo(() => {
        return currentWorkImages.map((item) => ({
            itemImageSrc: item.url,
            thumbnailImageSrc: item.thumbUrl ?? item.url,
            alt: `${item.workTitle} kansi`,
            title: formatWorkImageInfo(item)
        }));
    }, [currentWorkImages]);

    // Function to show gallery for a specific work
    const showWorkGallery = (workGroup: WorkEditionsGroup) => {
        const workImages = getAllImagesFromWork(workGroup).map(img => ({
            ...img,
            workTitle: workGroup.work.title
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

    // Format a single edition's own line (version/painos/publisher/year) -
    // one edition, one number, never a combined range.
    const formatEdition = (edition: Edition): string => {
        let result = "";

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

    const sortWorkGroups = (a: WorkEditionsGroup, b: WorkEditionsGroup) => {
        if (sort === "year") {
            const yearA = Math.min(...a.editions.map(editionYear));
            const yearB = Math.min(...b.editions.map(editionYear));
            return yearA - yearB;
        }
        // Sort by author_str first, then by title
        const authorA = a.work.author_str || "";
        const authorB = b.work.author_str || "";
        if (authorA !== authorB) {
            return authorA.localeCompare(authorB, "fi");
        }
        return a.work.title.localeCompare(b.work.title, "fi");
    };

    const renderWorkGroup = (workGroup: WorkEditionsGroup) => {
        const { work } = workGroup;
        const allImages = getAllImagesFromWork(workGroup);
        const sortedEditions = [...workGroup.editions].sort((a, b) => editionYear(a) - editionYear(b));

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
                        {work.orig_title && work.language_name?.id !== 7 && (
                            <div className="text-sm text-600 mb-1">
                                {work.orig_title}
                                {work.language_name && (
                                    <span> ({work.language_name.name})</span>
                                )}
                                {work.pubyear && (
                                    <span> {work.pubyear}</span>
                                )}
                            </div>
                        )}

                        {/* Bookseries */}
                        {work.bookseries && (
                            <div className="text-sm text-700 mb-1">
                                {work.bookseries.partof && (
                                    <>
                                        <Link
                                            to={`/bookseries/${work.bookseries.partof.id}`}
                                            className="no-underline text-primary hover:text-primary-700"
                                        >
                                            {work.bookseries.partof.name}
                                        </Link>
                                        {' > '}
                                    </>
                                )}
                                <Link
                                    to={`/bookseries/${work.bookseries.id}`}
                                    className="no-underline text-primary hover:text-primary-700"
                                >
                                    {work.bookseries.name}
                                </Link>
                                {work.bookseriesnum && <span> #{work.bookseriesnum}</span>}
                            </div>
                        )}

                        {/* Editions - one line per edition, like ContributorWorkControl */}
                        <div className="text-sm text-500 mb-2">
                            {sortedEditions.map((edition) => (
                                <div key={edition.id} className={editionIsOwned(edition, currentUser) ? "book owned" : editionIsWishlisted(edition, currentUser) ? "book wishlist" : "book not-owned"}>
                                    <Link
                                        to={`/editions/${edition.id}`}
                                        className="no-underline text-primary hover:text-primary-700"
                                    >
                                        <span dangerouslySetInnerHTML={{ __html: formatEdition(edition) }} />
                                    </Link>
                                </div>
                            ))}
                        </div>

                        {/* Genres and Tags from the work */}
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
                                    onClick={allImages.length > 1 ? () => showWorkGallery(workGroup) : undefined}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div>
            {/* Header with "View All Images" button */}
            {allWorkImages.length > 0 && (
                <div className="mb-3 flex justify-content-end">
                    <Button
                        icon="pi pi-images"
                        label={`Näytä kaikki kuvat (${allWorkImages.length})`}
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
                {groupedEditions.map((group) => (
                    <div key={group.editorStr} className="mb-4">
                        {/* Group header */}
                        {groupedEditions.length > 1 && group.editorStr !== person.name && (
                            <h3 className="text-xl font-semibold mb-3 text-700 pb-2 border-bottom-1 border-300">
                                {group.editorStr} ({group.workGroups.length})
                            </h3>
                        )}
                        <div className="work-list">
                            {[...group.workGroups]
                                .sort(sortWorkGroups)
                                .map(workGroup => renderWorkGroup(workGroup))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Image Gallery Dialog */}
            <Dialog
                header={currentWorkImages.length > 0
                    ? `${currentWorkImages[0]?.workTitle} - Kuvat (${currentWorkImages.length})`
                    : `Kaikki kuvat (${allWorkImages.length})`
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
                                                src={item.thumbnailImageSrc}
                                                alt={item.alt}
                                                loading="lazy"
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
