import React from 'react';

import { ProgressSpinner } from 'primereact/progressspinner';

import { ShortsList } from '../../short';
import { useSimilarShorts } from '../hooks/use-similar-shorts';
import { User } from '../../user';

interface SimilarShortsProps {
    shortId: string | number;
    user: User | null;
}

export const SimilarShorts = ({ shortId, user }: SimilarShortsProps) => {
    const { loading, data } = useSimilarShorts(shortId, user);

    if (loading) return <ProgressSpinner />;

    if (!data || data.length === 0) return <></>;

    return <ShortsList shorts={data} />
}

export default SimilarShorts;
