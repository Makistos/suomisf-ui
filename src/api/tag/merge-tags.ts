import { User } from "@features/user";
import { postApiContent } from "@services/user-service";

export const mergeTags = async (targetTagId: number, sourceTagId: number, user: User | null) => {
    const retval = await postApiContent(`tags/${targetTagId}/merge/${sourceTagId}`, {}, user).then(response => response);
    return retval;
}