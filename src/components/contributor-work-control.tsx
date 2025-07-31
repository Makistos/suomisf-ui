import { TabPanel, TabView } from "primereact/tabview";
import { Image } from "primereact/image";
import { Button } from "primereact/button";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Work } from "@features/work/types";
import { Edition } from "@features/edition/types";
import { GenreGroup } from "@features/genre";
import { TagGroup } from "@features/tag";

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
    const [activeIndex, setActiveIndex] = useState(0);
    const [expandedTags, setExpandedTags] = useState<Set<number>>(new Set());

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
            return a.localeCompare(b);
        });

        // If collaborationsLast is true, move collaborative works to end
        if (collaborationsLast && personName) {
            const personalIndex = sortedKeys.indexOf(personName);
            if (personalIndex > -1) {
                const personalKey = sortedKeys.splice(personalIndex, 1)[0];
                sortedKeys.unshift(personalKey);
            }
        }

        return sortedKeys.map(key => grouped[key]);
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

    // Format edition information
    const formatEdition = (edition: Edition, workTitle: string): string => {
        let result = "";

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

    if (groupedWorks.length === 0) {
        return <div>Ei teoksia löytynyt.</div>;
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
        <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}
            className="w-full">
            {groupedWorks.map((group, groupIndex) => (
                <TabPanel key={group.authorStr} header={`${group.authorStr} (${group.works.length})`}>
                    <div className="work-list">
                        {group.works.map((work, index) => {
                            const firstEdition = getFirstEditionWithImage(work);

                            return (
                                <div key={work.id} className="mb-3 p-3 surface-50 border-round">
                                    <div className="flex align-items-start gap-3">
                                        <div className="flex-1">
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
                                        {firstEdition && firstEdition.images && firstEdition.images.length > 0 && (
                                            <div className="flex-shrink-0">
                                                <Link to={`/editions/${firstEdition.id}`}>
                                                    <Image
                                                        src={firstEdition.images[0].image_src.startsWith('http') ? firstEdition.images[0].image_src : `${import.meta.env.VITE_IMAGE_URL}${firstEdition.images[0].image_src}`}
                                                        alt={`${work.title} kansi`}
                                                        height="150"
                                                        className="border-round shadow-2 hover:shadow-4 transition-all transition-duration-200"
                                                        imageClassName="object-fit-cover"
                                                        preview
                                                    />
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </TabPanel>
            ))}
        </TabView>
    );
};
