import { EditionOwnershipStatus } from "@features/edition";
import { User } from "@features/user"
import { getApiContent } from "@services/user-service"

export const getOwnership = async (editionId: number, user: User): Promise<EditionOwnershipStatus> => {
    const response = getApiContent(`editions/${editionId}/owner/${user.id}`, user).then(response =>
        response.data);
    return response;
}