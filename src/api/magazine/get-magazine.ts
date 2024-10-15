import { Magazine } from "@features/magazine";
import { User } from "@features/user";
import { getApiContent } from "@services/user-service";

export const getMagazine = async (id: string | null, user: User | null): Promise<Magazine | null> => {
    if (!id) { return null; }
    const retval = await getApiContent('magazines/' + id, user).then(response => response.data);
    return retval;
}