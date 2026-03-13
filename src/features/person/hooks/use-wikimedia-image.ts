import { useEffect, useState } from 'react';
import { Person } from '../types';
import { WikiImageInfo, findPersonImages } from '../components/find-person-images';

export type { WikiImageInfo };

export const useWikimediaImage = (person: Person, enabled = true) => {
    const [imageInfo, setImageInfo] = useState<WikiImageInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!enabled || String(person.qid) === '0') return;
        let cancelled = false;
        setImageInfo(null);
        setIsLoading(true);

        findPersonImages(person)
            .then(images => {
                console.debug('[useWikimediaImage] candidates:', images.map(i => i.url));
                if (images.length > 0 && !cancelled) setImageInfo(images[0]);
            })
            .catch(err => console.warn('Failed to fetch Wikimedia/Wikipedia image:', err))
            .finally(() => { if (!cancelled) setIsLoading(false); });

        return () => { cancelled = true; };
    }, [person.id, enabled]);

    return { imageInfo, isLoading };
};
