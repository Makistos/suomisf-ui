import { SfTag } from "@features/tag";
import { User } from "@features/user";
import { getApiContent } from "@services/user-service";

export const filterTags = async (query: string, user: User | null): Promise<SfTag[]> => {
    const response = await getApiContent(`filter/tags/${query}`, user).then((response) => response.data);
    return response;
}