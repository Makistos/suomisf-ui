import { deleteApiContent } from "@services/user-service";

export const deleteLogItem = async (id: number) => {
    const response = deleteApiContent('changes/' + id);
    return response;
}