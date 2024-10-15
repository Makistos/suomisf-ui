import { IssueFormData } from "@features/issue";
import { User } from "@features/user";
import { HttpStatusResponse, postApiContent, putApiContent } from "@services/user-service";

export const saveIssue = async (data: IssueFormData, user: User | null) => {
    if (data.id != null) {
        return putApiContent('issues', data, user);
    } else {
        return postApiContent('issues', data, user);
    }
}