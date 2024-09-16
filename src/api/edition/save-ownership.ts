import { editionCmp, EditionOwnershipStatus } from "@features/edition";
import { User } from "@features/user"
import { deleteApiContent, HttpStatusResponse, putApiContent } from "@services/user-service"

export const saveOwnership = async (data: EditionOwnershipStatus, user: User): Promise<HttpStatusResponse> => {
    if (data.condition?.value !== 0) {
        return putApiContent(`editions/owner`, data, user);
    }
    return deleteApiContent(`editions/${data.edition_id}/owner/${user.id}`);
}
