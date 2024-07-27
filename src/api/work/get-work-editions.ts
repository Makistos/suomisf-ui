import { Edition } from "@features/edition";
import { User } from "@features/user";
import { getApiContent } from "@services/user-service";

export const getWorkEditions = async (id: number, user: User | null): Promise<Edition[]> => {
    const retval = await getApiContent('work/' + id + '/editions', user).then(response => response.data);
    return retval;
}