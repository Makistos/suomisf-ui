import { useEffect, useState } from 'react';
import { getApiContent } from '../../../services/user-service';
import { User } from '../../user';
import { Short } from '../../short';

export const useSimilarShorts = (shortId: string | number, user: User | null) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<Short[]>([]);

    const fetchSimilarShorts = async (id: string | number, user: User | null): Promise<Short[]> => {
        const url = `shorts/${id}/similar`;
        const data = await getApiContent(url, user).then(response => response.data).catch((error) => {
            console.log(error);
            return [];
        });
        return data;
    }

    useEffect(() => {
        if (!shortId) return;
        setLoading(true);
        fetchSimilarShorts(shortId, user).then(data => {
            setData(data || []);
            setLoading(false);
        });
    }, [shortId, user]);

    return { loading, data, hasSimilarShorts: data.length > 0 };
};