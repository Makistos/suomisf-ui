import { deleteApiContent } from "@services/user-service";

export const deletePubseries = async (id: number | null) => {
    const response = await deleteApiContent("pubseries/" + id).then((response) => response);
    return response;
}