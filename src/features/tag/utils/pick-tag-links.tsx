import { TagType } from '../types';

export const PickTagLinks = (tags: TagType[]) => {
    return tags.map((tag) => ({ id: tag['id'], name: tag['name'] }));
};
