import { User } from "@features/user"
import { putApiContent } from "@services/user-service"

export const updateTag = async (data: any, user: User | null) => {
    return putApiContent('tags', data, user)
}