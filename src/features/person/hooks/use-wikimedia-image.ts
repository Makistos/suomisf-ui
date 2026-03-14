import { useEffect, useState } from 'react';
import { Person } from '../types';
import { WikiImageInfo, fetchPersonImagesFromApi } from '../components/find-person-images';

export type { WikiImageInfo };

export const useWikimediaImage = (person: Person, enabled = true) => {
    const [imageInfo, setImageInfo] = useState<WikiImageInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!enabled || String(person.qid) === '0') return;
        let cancelled = false;
        setImageInfo(null);
        setIsLoading(true);

        fetchPersonImagesFromApi(person.id, 1)
            .then((images: WikiImageInfo[]) => {
                console.debug('[useWikimediaImage] candidates:', images.map((i: WikiImageInfo) => i.url));
                if (images.length > 0 && !cancelled) setImageInfo(images[0]);
            })
            .catch((err: unknown) => console.warn('Failed to fetch Wikimedia/Wikipedia image:', err))
            .finally(() => { if (!cancelled) setIsLoading(false); });

        return () => { cancelled = true; };
    }, [person.id, enabled]);

    return { imageInfo, isLoading };
};
