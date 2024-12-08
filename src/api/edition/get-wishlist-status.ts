import { EditionWishlistStatus } from "@features/edition";
import { User } from "@features/user";
import { getApiContent } from "@services/user-service";

export const getWishlistStatus = async (edition_id: number, user: User | null): Promise<EditionWishlistStatus> => {
    const response = await getApiContent(`editions/${edition_id}/wishlist/${user?.id}`, user).then((response) => response.data);
    return response;
}