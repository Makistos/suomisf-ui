import { SfTag } from "@features/tag";
import { User } from "@features/user";
import { getApiContent } from "@services/user-service";

export const getTags = async (user: User | null): Promise<SfTag[]> => {
    const response = await getApiContent("tagsquick", user).then((response) => response.data);
    return response;
}