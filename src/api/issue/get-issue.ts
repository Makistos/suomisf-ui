import { Issue } from "@features/issue";
import { User } from "@features/user";
import { getApiContent } from "@services/user-service";

export const getIssue = async (id: number | null, user: User | null): Promise<Issue> => {
    const response = getApiContent(`issues/${id}`, user).then((response) => response.data);
    return response;
}
