import { Tag } from 'primereact/tag';

export interface ITag {
    id: number,
    name: string
}

interface TagProps {
    tag: string,
    count: number
}

export const PickTagLinks = (tags: ITag[]) => {
    return tags.map((tag) => ({ id: tag['id'], name: tag['name'] }))
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