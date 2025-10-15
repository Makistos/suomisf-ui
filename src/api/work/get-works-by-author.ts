import { getCurrenUser } from "@services/auth-service";
import { getApiContent } from "@services/user-service";
import { Work } from "@features/work/types";

export const getWorksByAuthor = async (authorId: number): Promise<Work[]> => {
    const user = getCurrenUser();
    const response = await getApiContent(`worksbyauthor/${authorId}`, user);
    return response.data;
};