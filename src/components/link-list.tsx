import React from 'react';
import { Link } from 'react-router-dom';

const SEPARATOR = ", ";

export type LinkItem = { id: number; name: string, description?: string };

interface LinkListProps {
    path: string,
    items: LinkItem[],
    showDescription?: boolean,
    separator?: string,
}

const description = (item: LinkItem, show: boolean) => {
    if (show && item.description && item.description.length > 0) {
        return " (" + item.description + ")";
    }
    return "";
}

export const LinkList = ({ path, items, showDescription, separator = SEPARATOR }: LinkListProps) => {
    if (items.length === 0) {
        return <></>
    }
    const linkList = items
        .map<React.ReactNode>((item, index) => (
            <>
                <Link key={item.id.toString() + "_" + index.toString()} to={`/${path}/${item.id}`}>
                    {item.name}
                </Link>
                {showDescription && description(item, showDescription)}
            </>
        ))
        .reduce((prev, curr) => [prev, separator, curr]);

    return <>{linkList}</>;
}
