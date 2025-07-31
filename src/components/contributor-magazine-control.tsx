
import { TabPanel, TabView } from "primereact/tabview";
import { Image } from "primereact/image";
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

    // Get contribution types that have data
    const availableTypes = Object.keys(contributionsByType).map(Number).sort();

    if (availableTypes.length === 0) {
        return <div>Ei kontribuutioita löytynyt.</div>;
    }

    return (
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
    )
}