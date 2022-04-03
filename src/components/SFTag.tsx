import { Tag } from 'primereact/tag';
import { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
export interface ITag {
    id: number,
    name: string
}

interface TagProps {
    tag: string,
    count: number
}

interface TagsProps {
    tags: ITag[],
    overflow: number
}

export const PickTagLinks = (tags: ITag[]) => {
    return tags.map((tag) => ({ id: tag['id'], name: tag['name'] }))
}

export const TagGroup = ({ tags, overflow }: TagsProps) => {
    const [groupedTags, setGroupedTags] = useState<[string, number][]>([]);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        const countTags = () => {
            let retval = tags.reduce((acc, currentValue: ITag) => {
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
        setGroupedTags(Object.entries(countTags())
            .sort((a, b) => a[1] > b[1] ? -1 : 1)
            .map(tag => tag));
    }, [tags])


    return (
        <div className="flex justify-content-center flex-wrap m-0 p-0">
            {groupedTags.map((tag, idx) => {
                return (overflow === undefined || idx < overflow || showAll) &&
                    <span key={tag[0]} className="mr-1 mb-1">
                        <TagCount tag={tag[0]} count={tag[1]} />
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
            )
            )
            }

        </div>
    )

}

export const TagCount = ({ tag, count }: TagProps) => {
    const headerText = (name: string, count: number) => {
        return name + " x " + count;
    }

    return (
        <Tag value={headerText(tag, count)} className="p-overlay-badge">
        </Tag>
    )
}