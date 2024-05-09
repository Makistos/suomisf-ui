import React, { useEffect, useState } from 'react';

import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';

import { TagType, SfTagProps } from "../types";
import { Link } from 'react-router-dom';

interface TagsProps {
    tags: TagType[],
    overflow: number,
    showOneCount: boolean
}

type TagCount = TagType & { count: number };


/**
 * Renders a group of tags with optional overflow and tag counts.
 *
 * @param {TagsProps} props - The props object containing the tags, overflow, and showOneCount.
 * @param {TagType[]} props.tags - The array of tags to render.
 * @param {number} props.overflow - The maximum number of tags to display before showing an overflow button.
 * @param {boolean} props.showOneCount - Whether to show the count of each tag when there are multiple occurrences.
 * @return {JSX.Element} The rendered tag group component.
 */
export const TagGroup = ({ tags, overflow, showOneCount }: TagsProps) => {
    const [groupedTags, setGroupedTags] = useState<TagCount[]>([]);
    const [showAll, setShowAll] = useState(false);
    const [subgenres, setSubgenres] = useState<TagType[]>([]);
    const [styles, setStyles] = useState<TagType[]>([]);
    const [locations, setLocations] = useState<TagType[]>([]);
    const [actors, setActors] = useState<TagType[]>([]);
    const [eras, setEras] = useState<TagType[]>([]);

    const filterTypes = (tags: TagType[], type: string) => {
        return tags.filter(tag => tag.type === type)
            .map(tag => tag)
    }

    useEffect(() => {
        /**
         * Calculates the count of each unique tag in the provided array.
         *
         * @return {Record<string, TagCount>} An object containing the count of each unique tag.
         */
        const countTags = () => {
            let retval = tags.reduce((acc, currentValue: TagType) => {
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
            if (showOneCount) {
                setGroupedTags(Object.entries(countTags())
                    .sort((a, b) => a[1].count > b[1].count ? -1 : 1)
                    .map(tag => tag[1]));
            } else {
                setGroupedTags(Object.entries(countTags())
                    .map(tag => tag[1]));
            }
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
     * @param {TagType} props.tag - The tag to render.
     * @param {number | null} props.count - The count of the tag.
     * @return {JSX.Element} The rendered tag count component.
     */
    const TagCount = ({ tag, count }: SfTagProps) => {
        const TypeToSeverity = (type: string) => {
            if (tag === undefined) return undefined;
            if (type !== null) {
                if (subgenres.find((genre) => genre.id === tag.id)) {
                    return "success";
                }
                if (styles.find((style) => style.id === tag.id)) {
                    return "warning";
                }
            }
            return undefined;
        }

        /**
         * Returns a string that concatenates the name with the count if count is not null,
         * otherwise returns just the name.
         *
         * @param {string} name - The name to be concatenated with the count.
         * @param {number | null} count - The count to be concatenated with the name.
         * @return {string} The concatenated string.
         */
        const headerText = (name: string, count: number | null) => {
            if (count !== null) {
                return name + " x " + count;
            } else {
                return name;
            }
        }

        return (
            <Tag value={headerText(tag?.name === undefined ? "" : tag.name, count === undefined ? 0 : count)}
                className="p-overlay-badge"
                severity={TypeToSeverity(tag?.type === undefined ? "" : tag.type)}
            />
        )
    }
    return (
        <div className="flex justify-content-center flex-wrap m-0 p-0">
            {groupedTags.map((tag, idx) => {
                return (overflow === undefined || idx < overflow || showAll) &&
                    <span key={tag.name} className="mr-1 mb-1">
                        <Link to={`/tags/${tag.id}`} className="mr-1 mb-1">
                            <TagCount tag={tag}
                                count={showOneCount && tag.count !== 1 ? tag.count : null} />
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
