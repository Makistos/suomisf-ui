import { Short } from "@features/short";
import { User } from "@features/user";
import { getApiContent } from "@services/user-service";

export const getIssueShorts = async (id: string, user: User | null): Promise<Short[]> => {
    const response = await getApiContent(`issues/${id}/shorts`, user).then((response) => response.data);
    return response;
}