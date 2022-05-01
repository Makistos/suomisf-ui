import { Tag } from 'primereact/tag';
import { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
export interface ITag {
    id: number,
    name: string,
    type: string
}

interface TagProps {
    tag: string,
    count: number | null
}

interface TagsProps {
    tags: ITag[],
    overflow: number,
    showOneCount: boolean
}

export const PickTagLinks = (tags: ITag[]) => {
    return tags.map((tag) => ({ id: tag['id'], name: tag['name'] }))
}

export const TagGroup = ({ tags, overflow, showOneCount }: TagsProps) => {
    const [groupedTags, setGroupedTags] = useState<[string, number][]>([]);
    const [showAll, setShowAll] = useState(false);
    const [subgenres, setSubgenres] = useState<string[]>([]);
    const [styles, setStyles] = useState<string[]>([]);

    const filterTypes = (tags: ITag[], type: string) => {
        return tags.filter(tag => tag.type === type)
            .map(tag => tag.name)
    }

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
        if (tags) {
            setGroupedTags(Object.entries(countTags())
                .sort((a, b) => a[1] > b[1] ? -1 : 1)
                .map(tag => tag));
            setSubgenres(filterTypes(tags, 'subgenre'))
            setStyles(filterTypes(tags, 'style'))
        }
    }, [tags])


    const TagCount = ({ tag, count }: TagProps) => {
        const TypeToSeverity = (type: string) => {
            if (type !== null) {
                if (subgenres.includes(tag)) {
                    return "success";
                }
                if (styles.includes(tag)) {
                    return "warning";
                }
            }
            return "";
        }

        const headerText = (name: string, count: number | null) => {
            if (count !== null) {
                return name + " x " + count;
            } else {
                return name;
            }
        }

        return (
            <Tag value={headerText(tag, count)}
                className="p-overlay-badge"
                severity={TypeToSeverity(tag)}
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
