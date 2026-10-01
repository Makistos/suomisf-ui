import React, { useMemo, useState } from 'react';

import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';

import { SfTag } from "../types";
import { Link } from 'react-router-dom';
import { tagTypeToClass, tagTypeToSeverity } from '@features/tag/components/tag-type-to-severity';

interface TagsProps {
    tags: SfTag[],
    overflow: number,
    showOneCount: boolean,
    filter?: string[],
    reverseFilter?: boolean,
    maxCount?: number
}

type TagCount = SfTag & { count: number };

interface TagCountCompProps {
    tag: TagCount
}

/**
 * Renders a group of tags with optional overflow and tag counts.
 *
 * @param {TagsProps} props - The props object containing the tags, overflow, and showOneCount.
 * @param {SfTag[]} props.tags - The array of tags to render.
 * @param {number} props.overflow - The maximum number of tags to display before showing an overflow button.
 * @param {boolean} props.showOneCount - Whether to show the count of each tag when there are multiple occurrences.
 * @return {JSX.Element} The rendered tag group component.
 */
export const TagGroup = ({ tags, overflow, showOneCount, filter: types, reverseFilter,
    maxCount }: TagsProps) => {
    const [showAll, setShowAll] = useState(false);

    // Derived from props, so a memo rather than state set in an effect. Must
    // run before the early return below: hooks can't be skipped conditionally.
    const groupedTags = useMemo(() => {
        if (!tags) return [];
        const filterTags = (tag: SfTag) => {
            if (tag === undefined) return false;
            if (reverseFilter) {
                return types ? tag.type ? !types.includes(tag.type.name) : true : true;
            }
            return types ? tag.type ? types.includes(tag.type.name) : true : true
        }
        // Count of each unique tag
        const counts = tags.filter(tag => filterTags(tag))
            .reduce((acc, currentValue: SfTag) => {
                const tagName = currentValue.name;
                if (!acc[tagName]) {
                    acc[tagName] = { ...currentValue, count: 1 };
                } else {
                    acc[tagName].count++;
                }
                return acc;
            }, {} as Record<string, TagCount>);
        let grouped = Object.values(counts);
        if (showOneCount) {
            grouped = grouped.sort((a, b) => a.count > b.count ? -1 : 1);
        }
        if (maxCount) {
            grouped = grouped.slice(0, maxCount);
        }
        return grouped;
    }, [tags, types, reverseFilter, showOneCount, maxCount]);

    if (tags == undefined || tags.length === 0) {
        return <></>;
    }

    const sortTags = (a: TagCount, b: TagCount) => {
        if (a.type?.id === 2) return -1; // Subgenre
        if (b.type?.id === 2) return 1; // Subgenre
        if (a.type?.id === 3) return -1; // Style
        if (b.type?.id === 3) return 1; // Style
        return 1;
    }



    /**
     * Renders a tag count component with the given tag and count.
     *
     * @param {SfTagProps} props - The props object containing the tag and count.
     * @param {SfTag} props.tag - The tag to render.
     * @param {number | null} props.count - The count of the tag.
     * @return {JSX.Element} The rendered tag count component.
     */
    const TagCountComp = ({ tag }: TagCountCompProps) => {
        /**
         * Returns a string that concatenates the name with the count if count is not null,
         * otherwise returns just the name.
         *
         * @param {string} name - The name to be concatenated with the count.
         * @param {number | null} count - The count to be concatenated with the name.
         * @return {string} The concatenated string.
         */
        const headerText = (name: string, count: number | null) => {
            if (count !== 0) {
                return name + " x " + count;
            } else {
                return name;
            }
        }

        return (
            <Tag value={headerText(tag?.name === undefined ? "" : tag.name,
                showOneCount && tag.count !== undefined && tag.count !== 1 ? tag.count : 0)}
                className={`p-overlay-badge${tagTypeToClass(tag) ? ` ${tagTypeToClass(tag)}` : ''}`}
                severity={tagTypeToSeverity(tag)}
            />
        )
    }
    return (
        <div className="flex flex-wrap m-0 p-0">
            {[...groupedTags].sort(sortTags).map((tag, idx) => {
                return (overflow === undefined || idx < overflow || showAll) &&
                    <span key={tag.name} className="mr-1 mb-1">
                        <Link to={`/tags/${tag.id}`} className="mr-1 mb-1"
                            title={tag.type?.name}>
                            <TagCountComp tag={{ ...tag, count: tag.count }} />
                        </Link>
                    </span>

            })}
            {(overflow !== undefined
                && groupedTags.length > overflow
                && !showAll ? (
                <Button label="+" badge={(groupedTags.length - overflow).toString()}
                    className="p-button-sm p-button-help"
                    onClick={() => setShowAll(true)}
                />
            ) : (groupedTags.length > overflow &&
                <Button label="Vähemmän" onClick={() => setShowAll(false)}
                    className="p-button-sm p-button-help" />
            ))}
        </div>
    )

}
