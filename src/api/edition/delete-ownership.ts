import { EditionOwnershipStatus } from "@features/edition";
import { User } from "@features/user"
import { deleteApiContent, HttpStatusResponse } from "@services/user-service"

export const deleteOwnership = async (editionId: number, user: User): Promise<HttpStatusResponse> => {
    return deleteApiContent(`editions/${editionId}/owner/${user.id}`);
}

