import React from 'react';
import { SITE_URL } from '../systemProps';

const SEPARATOR = ", ";

export type LinkItem = { id: number; name: string };

interface LinkListProps {
    path: string,
    items: LinkItem[],
    separator?: string
}

export const LinkList = ({ path, items, separator = SEPARATOR }: LinkListProps) => {
    const p = SITE_URL + path;

    const linkList = items
        .map<React.ReactNode>(({ id, name }) => (
            <a key={id} href={`${p}/${id}`}>
                {name}
            </a>
        ))
        .reduce((prev, curr) => [prev, separator, curr]);

    return <span>{linkList}</span>;
}
