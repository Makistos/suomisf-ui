import { useQuery } from '@tanstack/react-query';
import { getApiContent } from '../../../services/user-service';
import { User } from '../../user';
import { Short } from '../../short';

const fetchSimilarShorts = async (id: string | number, user: User | null): Promise<Short[]> => {
    const url = `shorts/${id}/similar`;
    const data = await getApiContent(url, user).then(response => response.data).catch((error) => {
        console.log(error);
        return [];
    });
    return data ?? [];
}

export const useSimilarShorts = (shortId: string | number, user: User | null) => {
    const { isLoading: loading, data = [] } = useQuery({
        queryKey: ['short', shortId, 'similar', user?.id],
        queryFn: () => fetchSimilarShorts(shortId, user),
        enabled: !!shortId,
    });

    return { loading, data, hasSimilarShorts: data.length > 0 };
};