import { SfTag } from "@features/tag";
import { User } from "@features/user";
import { getApiContent } from "@services/user-service";

export const getTag = async (id: number | null, user: User | null): Promise<SfTag> => {
    const response = await getApiContent(`tags/${id}`, user).then((response) =>
        response.data);
    return response;
}