import { SfTag } from '../types';

export const PickTagLinks = (tags: SfTag[]) => {
    return tags.map((tag) => ({ id: tag['id'], name: tag['name'] }));
};
