import { deleteApiContent } from "@services/user-service";

export const deleteEditionImage = async (editionId: number | string, imageId: number) => {
    const response = await deleteApiContent(`editions/${editionId}/images/${imageId}`);
    return response;
}