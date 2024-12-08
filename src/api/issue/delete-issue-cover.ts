import { User } from "@features/user";
import { deleteApiContent } from "@services/user-service";

export const deleteIssueCover = async (issueId: number) => {
    const response = await deleteApiContent(`issues/${issueId}/covers`);
    return response;
}