import { User } from "@features/user";
import { postApiContent } from "@services/user-service";

export const createTag = async (name: string, user: User | null) => {
    const response = await postApiContent("tags", { data: { name: name } }, user).then((response) => response);
    return response.response;
}