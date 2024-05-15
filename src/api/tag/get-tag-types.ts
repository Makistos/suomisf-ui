import { TagType } from "@features/tag";
import { User } from "@features/user";
import { getApiContent } from "@services/user-service";

export const getTagTypes = async (user: User | null): Promise<TagType[]> => {
    const response = await getApiContent('tags/types', user).then(response => response.data);
    return response;
}