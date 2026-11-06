import { SfTag } from "@features/tag";
import { User } from "@features/user";
import { Work } from "@features/work/types";
import { getApiContent, postApiContent } from "@services/user-service";

export type SimilarReason = "baseform" | "spelling" | "place" | "name" | "usage" | "manual"
    // Finto's KOKO ontology: the same concept, or concepts linked as related.
    | "concept" | "concept_related";

export type SimilarTag = SfTag & {
    kind: "duplicate" | "related";
    // How it was found; "manual" = linked by an admin.
    reason: SimilarReason;
};

/** Tags the backend's similarity job suggests for a tag, and ones admins
 * linked by hand (dismissed pairs left out): probable duplicates first,
 * then related tags, best first. */
export const getSimilarTags = async (id: number, user: User | null): Promise<SimilarTag[]> => {
    const response = await getApiContent(`tags/${id}/similar`, user);
    return (response.data as Omit<SimilarTag, "type_id">[]).map(tag => ({ ...tag, type_id: tag.type?.id ?? 0 }));
}

/** Link two tags as similar by hand. */
export const addSimilarTag = (tagId: number, otherId: number, user: User | null) =>
    postApiContent("tags/similar/add", { tag_a: tagId, tag_b: otherId }, user);

/** Remove a similar tag: a suggestion is dismissed (not suggested again),
 * a pair linked by hand is deleted. */
export const removeSimilarTag = (tagId: number, otherId: number, user: User | null) =>
    postApiContent("tags/similar/dismiss", { tag_a: tagId, tag_b: otherId }, user);

/** The works of a tag and of its similar tags, each once, with the tags
 * it matched (matched_tags: the tag itself first). */
export const getSimilarTagWorks = async (id: number, user: User | null): Promise<Work[]> =>
    (await getApiContent(`tags/${id}/similar/works`, user)).data;
