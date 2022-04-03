import React, { Fragment } from 'react';

const SEPARATOR = ", ";

export type LinkItem = { id: number; name: string };

interface LinkListProps {
    path: string,
    items: LinkItem[],
    separator?: string,
}

export const LinkList = ({ path, items, separator = SEPARATOR }: LinkListProps) => {
    const p = "/" + path;

    if (items.length === 0) {
        return <></>
    }
    const linkList = items
        .map<React.ReactNode>(({ id, name }) => (
            <a key={id} href={`${p}/${id}`}>
                {name}
            </a>
        ))
        .reduce((prev, curr) => [prev, separator, curr]);

    return <>{linkList}</>;
}
