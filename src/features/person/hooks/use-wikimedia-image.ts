import { useQuery } from '@tanstack/react-query';
import { Person } from '../types';
import { WikiImageInfo, fetchPersonImagesFromApi } from '../components/find-person-images';

export type { WikiImageInfo };

export const useWikimediaImage = (person: Person, enabled = true) => {
    // Not for people that already have a Wikidata id
    const active = enabled && !person.qid;

    const { data, isLoading } = useQuery({
        // Own key (not under ['person', id]) so invalidating the person after
        // an edit doesn't redo this external lookup; cached for the session.
        queryKey: ['wikimedia-image', person.id],
        queryFn: async (): Promise<WikiImageInfo | null> => {
            try {
                const images = await fetchPersonImagesFromApi(person.id, 1);
                console.debug('[useWikimediaImage] candidates:', images.map((i: WikiImageInfo) => i.url));
                return images[0] ?? null;
            } catch (err: unknown) {
                console.warn('Failed to fetch Wikimedia/Wikipedia image:', err);
                return null;
            }
        },
        enabled: active,
        staleTime: Infinity,
    });

    return {
        imageInfo: active ? data ?? null : null,
        isLoading: active && isLoading,
    };
};
