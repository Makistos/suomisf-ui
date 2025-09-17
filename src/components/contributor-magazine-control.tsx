
import { TabPanel, TabView } from "primereact/tabview";
import { Image } from "primereact/image";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Galleria } from "primereact/galleria";
import { Contribution, ContributionKey, ContributionType } from "../types/contribution";
import { useState, useMemo } from "react";
import { Issue } from "@features/issue";
import { Link } from "react-router-dom";

interface ContributorMagazineControlProps {
    /**
     * Contributions to be displayed.
     */
    issues: Issue[];
    person?: number; // Optional person ID for filtering contributions
}

export const ContributorMagazineControl = ({ issues, person }: ContributorMagazineControlProps) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [showAllImagesGallery, setShowAllImagesGallery] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(-1);

    // Group contributions by type
    const contributionsByType = useMemo(() => {
        const grouped: { [key: number]: { role: string, contributions: Array<{ issue: Issue, contribution: Contribution }> } } = {};

        issues.forEach(issue => {
            issue.contributors.forEach(contribution => {
                // Filter by person if specified
                if (person && contribution.person.id !== person) {
                    return;
                }

                const roleId = contribution.role.id;
                if (!grouped[roleId]) {
                    grouped[roleId] = {
                        role: contribution.role.name,
                        contributions: []
                    };
                }

                grouped[roleId].contributions.push({
                    issue,
                    contribution
                });
            });
        });

        return grouped;
    }, [issues, person]);

    // Get all images from all issues for the gallery
    const getAllImagesFromAllIssues = () => {
        const allImages: { url: string; issueTitle: string; year?: number; magazineName: string }[] = [];
        const seenUrls = new Set<string>();

        issues.forEach(issue => {
            // Filter by person if specified
            if (person) {
                const hasPersonContribution = issue.contributors.some(contrib => contrib.person.id === person);
                if (!hasPersonContribution) {
                    return;
                }
            }

            if (issue.image_src) {
                const imageUrl = issue.image_src.startsWith('http')
                    ? issue.image_src
                    : `${import.meta.env.VITE_IMAGE_URL}${issue.image_src}`;

                // Only add if we haven't seen this URL before
                if (!seenUrls.has(imageUrl)) {
                    seenUrls.add(imageUrl);
                    allImages.push({
                        url: imageUrl,
                        issueTitle: issue.title || issue.cover_number,
                        year: issue.year,
                        magazineName: issue.magazine.name
                    });
                }
            }
        });

        return allImages;
    };

    const allIssueImages = useMemo(() => getAllImagesFromAllIssues(), [issues, person]);

    // Format image info for gallery
    const formatImageInfo = (imageData: { issueTitle: string; year?: number; magazineName: string }): string => {
        let result = `${imageData.magazineName} ${imageData.issueTitle}`;

        if (imageData.year) {
            result += ` (${imageData.year})`;
        }

        return result;
    };

    // Create galleria items
    const galleryItems = useMemo(() => {
        return allIssueImages.map((item, index) => ({
            itemImageSrc: item.url,
            thumbnailImageSrc: item.url,
            alt: `${item.magazineName} ${item.issueTitle} kansi`,
            title: formatImageInfo(item)
        }));
    }, [allIssueImages]);

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

    // Get contribution types that have data
    const availableTypes = Object.keys(contributionsByType).map(Number).sort();

    if (availableTypes.length === 0) {
        return <div>Ei kontribuutioita löytynyt.</div>;
    }

    return (
        <div>
            {/* Header with "View All Images" button */}
            {allIssueImages.length > 0 && (
                <div className="mb-3 flex justify-content-end">
                    <Button
                        icon="pi pi-images"
                        label={`Näytä kaikki kuvat (${allIssueImages.length})`}
                        className="p-button-outlined p-button-sm"
                        onClick={() => {
                            setCurrentImageIndex(-1); // Reset to show thumbnails first
                            setShowAllImagesGallery(true);
                        }}
                    />
                </div>
            )}

            <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}
                className="w-full">
                {availableTypes.map(typeId => {
                    const typeData = contributionsByType[typeId];
                    return (
                        <TabPanel key={typeId} header={typeData.role}>
                            <div className="contribution-list">
                                {typeData.contributions.map(({ issue, contribution }, index) => (
                                    <div key={`${issue.id}-${contribution.person.id}-${index}`} className="mb-3 p-3 surface-50 border-round">
                                        <div className="flex align-items-start gap-3">
                                            <div className="flex-1">
                                                <div className="font-semibold mb-1">
                                                    <Link
                                                        to={`/issues/${issue.id}`}
                                                        className="no-underline text-primary hover:text-primary-700"
                                                    >
                                                        {issue.magazine.name} {issue.cover_number}
                                                    </Link>
                                                    {issue.title && (
                                                        <div className="text-sm text-600 mt-1">{issue.title}</div>
                                                    )}
                                                </div>

                                                <div className="text-sm text-500 mt-1">
                                                    {issue.year && `Vuosi: ${issue.year}`}
                                                    {issue.pages && ` • ${issue.pages} sivua`}
                                                </div>
                                            </div>

                                            {/* Cover Image */}
                                            {issue.image_src && (
                                                <div className="flex-shrink-0">
                                                    <Link to={`/issues/${issue.id}`}>
                                                        <Image
                                                            src={issue.image_src.startsWith('http') ? issue.image_src : `${import.meta.env.VITE_IMAGE_URL}${issue.image_src}`}
                                                            alt={`${issue.magazine.name} ${issue.cover_number} kansi`}
                                                            width="64"
                                                            height="80"
                                                            className="border-round shadow-2 hover:shadow-4 transition-all transition-duration-200"
                                                            imageClassName="object-fit-cover"
                                                            preview
                                                        />
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabPanel>
                    );
                })}
            </TabView>

            {/* Image Gallery Dialog */}
            <Dialog
                header={`Kaikki kuvat (${allIssueImages.length})`}
                visible={showAllImagesGallery}
                onHide={() => {
                    setShowAllImagesGallery(false);
                    setCurrentImageIndex(-1); // Reset to thumbnails when closing
                }}
                style={{ width: '90vw', maxWidth: '1200px' }}
                contentStyle={{ padding: '1rem', overflow: 'auto' }}
                modal
                maximizable
            >
                {galleryItems.length > 0 && (
                    <>
                        {/* Show thumbnail grid initially */}
                        {currentImageIndex === -1 ? (
                            <div className="grid justify-content-center" style={{ width: '100%' }}>
                                {galleryItems.map((item, index) => (
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
                                    value={galleryItems}
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
    )
}