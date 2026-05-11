import { deleteApiContent } from "@services/user-service";

export const deleteIssueImage = async (issueId: number | string, imageId: number) => {
    const response = await deleteApiContent(`issues/${issueId}/images/${imageId}`);
    return response;
}
