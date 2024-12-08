import { EditionWishlistStatus } from "@features/edition"
import { User } from "@features/user"
import { putApiContent } from "@services/user-service"

export const saveToWishlist = async (edition_id: number, user: User) => {
    return putApiContent(`editions/${edition_id}/wishlist/${user.id}`, {}, user)
}