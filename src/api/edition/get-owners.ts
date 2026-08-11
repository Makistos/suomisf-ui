import { EditionOwner } from "@features/edition";
import { getApiContent } from "@services/user-service"

export const getOwners = async (editionId: number): Promise<EditionOwner[]> => {
    const response = getApiContent(`editions/${editionId}/owners`, null).then(response =>
        response.data);
    return response;
}
