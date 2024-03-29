import React, { useEffect, useState } from 'react';

import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';

import { TagType, SfTagProps } from "../types";

interface TagsProps {
    tags: TagType[],
    overflow: number,
    showOneCount: boolean
}


export const TagGroup = ({ tags, overflow, showOneCount }: TagsProps) => {
    const [groupedTags, setGroupedTags] = useState<[string, number][]>([]);
    const [showAll, setShowAll] = useState(false);
    const [subgenres, setSubgenres] = useState<string[]>([]);
    const [styles, setStyles] = useState<string[]>([]);

    const filterTypes = (tags: TagType[], type: string) => {
        return tags.filter(tag => tag.type === type)
            .map(tag => tag.name)
    }

    useEffect(() => {
        const countTags = () => {
            let retval = tags.reduce((acc, currentValue: TagType) => {
                const tagName: string = currentValue.name;
                if (!acc[tagName]) {
                    acc[tagName] = 1;
                } else {
                    acc[tagName]++;
                }
                return acc;
            }, {} as Record<string, number>)
            return retval;
        }
        if (tags) {
            if (showOneCount) {
                setGroupedTags(Object.entries(countTags())
                    .sort((a, b) => a[1] > b[1] ? -1 : 1)
                    .map(tag => tag));
            } else {
                setGroupedTags(Object.entries(countTags())
                    .map(tag => tag));
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
            <Tag value={headerText(tag === undefined ? "" : tag, count === undefined ? 0 : count)}
                className="p-overlay-badge"
                severity={TypeToSeverity(tag === undefined ? "" : tag)}
            />
        )
    }
    return (
        <div className="flex justify-content-center flex-wrap m-0 p-0">
            {groupedTags.map((tag, idx) => {
                return (overflow === undefined || idx < overflow || showAll) &&
                    <span key={tag[0]} className="mr-1 mb-1">
                        <TagCount tag={tag[0]}
                            count={showOneCount && tag[1] !== 1 ? tag[1] : null} />
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
