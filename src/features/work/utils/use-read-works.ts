import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getApiContent, postApiContent, deleteApiContent }
    from "@services/user-service";
import { getCurrenUser } from "@services/auth-service";

/** A work the current user has marked as read, with an optional opinion. */
export interface ReadWork {
    work_id: number;
    opinion: number | null; // -1 didn't like, 0 it was ok, 1 liked, null none
    description: string | null; // the user's own note on the work
    title: string;
    author_str: string;
    pubyear: number;
}

/**
 * Shared read-status state for the logged-in user.
 *
 * Loads the user's read works once (react-query, cached) and exposes helpers
 * to check and mutate the read state of any work. Mutations invalidate the
 * cache so every consumer (work page, lists, suggestion badges) stays in sync.
 */
export const useReadWorks = () => {
    const user = getCurrenUser();
    const userId = user?.id ?? null;
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ["readworks", userId],
        queryFn: async (): Promise<ReadWork[]> =>
            getApiContent(`works/read/${userId}`, user)
                .then(response => response.data),
        enabled: !!userId,
    });

    const readMap = new Map<number, number | null>();
    const notes = new Map<number, string | null>();
    (query.data ?? []).forEach(w => {
        readMap.set(w.work_id, w.opinion);
        notes.set(w.work_id, w.description);
    });

    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: ["readworks", userId] });

    /**
     * Mark a work read (or update its opinion). Pass description to set the
     * note; leave it out to keep the current one.
     */
    const setRead = async (workId: number, opinion: number | null, description?: string) => {
        const note = description === undefined ? undefined : (description.trim() || null);
        // Optimistic: update the cache synchronously so the UI redraws at
        // once instead of waiting for the request and refetch.
        queryClient.setQueryData<ReadWork[]>(["readworks", userId], (old) => {
            const list = old ? [...old] : [];
            const idx = list.findIndex(w => w.work_id === workId);
            if (idx >= 0) {
                list[idx] = {
                    ...list[idx], opinion,
                    ...(note === undefined ? {} : { description: note }),
                };
                return list;
            }
            return [...list, {
                work_id: workId, opinion, description: note ?? null,
                title: "", author_str: "", pubyear: 0,
            }];
        });
        try {
            await postApiContent("works/read", {
                work_id: workId, user_id: userId, opinion,
                ...(note === undefined ? {} : { description: note ?? "" }),
            }, user);
        } catch (err) {
            console.error("Failed to set read status", err);
        }
        invalidate();
    };

    /** Unmark a work as read. */
    const unsetRead = async (workId: number) => {
        // Optimistic: drop it from the cache immediately (see setRead).
        queryClient.setQueryData<ReadWork[]>(["readworks", userId], (old) =>
            (old ?? []).filter(w => w.work_id !== workId));
        try {
            await deleteApiContent(`works/${workId}/read/${userId}`);
        } catch (err) {
            console.error("Failed to remove read status", err);
        }
        invalidate();
    };

    return {
        readMap,
        isLoading: query.isLoading,
        isRead: (id: number) => readMap.has(id),
        opinionOf: (id: number) => readMap.get(id) ?? null,
        descriptionOf: (id: number) => notes.get(id) ?? null,
        setRead,
        unsetRead,
    };
};
