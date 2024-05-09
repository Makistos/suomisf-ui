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


export const TagGroup = ({ tags, overflow, showOneCount }: TagsProps) => {
    const [groupedTags, setGroupedTags] = useState<TagCount[]>([]);
    const [showAll, setShowAll] = useState(false);
    const [subgenres, setSubgenres] = useState<TagType[]>([]);
    const [styles, setStyles] = useState<TagType[]>([]);

    const filterTypes = (tags: TagType[], type: string) => {
        return tags.filter(tag => tag.type === type)
            .map(tag => tag)
    }

    useEffect(() => {
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
        }
    }, [tags])


    const TagCount = ({ tag, count }: SfTagProps) => {
        const TypeToSeverity = (type: string) => {
            if (tag === undefined) return undefined;
            if (type !== null) {
                if (subgenres.includes(tag)) {
                    return "success";
                }
                if (styles.includes(tag)) {
                    return "warning";
                }
            }
            return undefined;
        }

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
