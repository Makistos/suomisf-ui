import React, { useEffect, useState } from 'react';

import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';

import { SfTag } from "../types";
import { Link } from 'react-router-dom';
import { tagTypeToSeverity } from '@features/tag/components/tag-type-to-severity';

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
    const [groupedTags, setGroupedTags] = useState<TagCount[]>([]);
    const [showAll, setShowAll] = useState(false);
    const [subgenres, setSubgenres] = useState<SfTag[]>([]);
    const [styles, setStyles] = useState<SfTag[]>([]);
    const [locations, setLocations] = useState<SfTag[]>([]);
    const [actors, setActors] = useState<SfTag[]>([]);
    const [eras, setEras] = useState<SfTag[]>([]);

    const filterTypes = (tags: SfTag[], type: string) => {
        return tags.filter(tag => tag.type?.name === type)
            .map(tag => tag)
    }

    const filterTags = (tag: SfTag) => {
        if (reverseFilter) {
            return types ? tag.type ? !types.includes(tag.type.name) : true : true;
        }
        return types ? tag.type ? types.includes(tag.type.name) : true : true
    }
    useEffect(() => {
        /**
         * Calculates the count of each unique tag in the provided array.
         *
         * @return {Record<string, TagCount>} An object containing the count of each unique tag.
         */
        const countTags = () => {
            let retval = tags.filter(
                tag => filterTags(tag))
                .reduce((acc, currentValue: SfTag) => {
                    const tagName = currentValue.name;
                    if (!acc[tagName]) {
                        acc[tagName] = { ...currentValue, count: 1 };
                    } else {
                        acc[tagName].count++;
                    }
                    return acc;
                }, {} as Record<string, TagCount>)
            return retval;
        }
        if (tags) {
            let groupedTags = [];
            if (showOneCount) {
                groupedTags = Object.entries(countTags())
                    .sort((a, b) => a[1].count > b[1].count ? -1 : 1)
                    .map(tag => tag[1]);
            } else {
                groupedTags = Object.entries(countTags())
                    .map(tag => tag[1]);
            }
            if (maxCount) {
                groupedTags = groupedTags.slice(0, maxCount)
            }
            setGroupedTags(groupedTags);
            setSubgenres(filterTypes(tags, 'subgenre'))
            setStyles(filterTypes(tags, 'style'))
            setLocations(filterTypes(tags, 'location'))
            setActors(filterTypes(tags, 'actor'))
            setEras(filterTypes(tags, 'era'))
        }
    }, [tags])


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
                className="p-overlay-badge"
                severity={tagTypeToSeverity(tag)}
            />
        )
    }
    return (
        <div className="flex flex-wrap m-0 p-0">
            {groupedTags.map((tag, idx) => {
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
                    onClick={(e) => setShowAll(true)}
                />
            ) : (groupedTags.length > overflow &&
                <Button label="Vähemmän" onClick={(e) => setShowAll(false)}
                    className="p-button-sm p-button-help" />
            ))}
        </div>
    )

}
