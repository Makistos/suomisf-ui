import { deleteApiContent } from "@services/user-service";

export const deleteIssue = async (id: string | null) => {
    console.log("Deleting issue: " + id);
    if (!id) { return null; }
    const response = await deleteApiContent(`issues/${id}`).then((response) => response);
    return response;
}