import { postApiContent } from "@services/user-service";
import { User } from "@features/user";
import { Work } from "@features/work/types";

export interface IncompleteWorksResult {
    works: Work[];
    total: number;
}

/**
 * Random works lacking every one of missingFields (POST
 * /api/works/random/incomplete). The backend answers 404 when nothing
 * matches; that is returned as an empty result, not an error.
 */
export const fetchIncompleteWorks = async (
    count: number,
    missingFields: string[],
    user: User | null,
): Promise<IncompleteWorksResult> => {
    try {
        const response = await postApiContent(
            "works/random/incomplete",
            { count, missing_fields: missingFields },
            user,
        );
        const result = response.response as unknown as IncompleteWorksResult | null;
        return { works: result?.works ?? [], total: result?.total ?? 0 };
    } catch (error) {
        if ((error as { status?: number }).status === 404) {
            return { works: [], total: 0 };
        }
        throw error;
    }
};
