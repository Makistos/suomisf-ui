import { User } from "@features/user"
import { putApiContent } from "@services/user-service"

export const saveIssueShorts = async (data: any, user: User | null) => {
    return putApiContent('issues/shorts', data, user)
}