import { User } from "@features/user";
import { deleteApiContent } from "@services/user-service";

export const deleteTag = async (id: number | null) => {
    const response = await deleteApiContent(`tags/${id}`).then((response) => response);
    return response;
}