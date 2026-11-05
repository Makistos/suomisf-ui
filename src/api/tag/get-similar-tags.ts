import { SfTag } from "@features/tag";
import { User } from "@features/user";
import { getApiContent } from "@services/user-service";

/** Tags the backend's similarity job suggests for a tag (dismissed pairs
 * left out): probable duplicates first, then related tags, best first. */
export const getSimilarTags = async (id: number, user: User | null): Promise<SfTag[]> => {
    const response = await getApiContent(`tags/${id}/similar`, user);
    return (response.data as Omit<SfTag, "type_id">[]).map(tag => ({ ...tag, type_id: tag.type?.id ?? 0 }));
}
