import { EditionWishlistStatus } from "@features/edition"
import { User } from "@features/user"
import { deleteApiContent } from "@services/user-service"

export const removeFromWishlist = async (edition_id: number, user: User) => {
    return deleteApiContent(`editions/${edition_id}/wishlist/${user.id}`)
}