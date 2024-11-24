import { Short } from "@features/short";
import { User } from "@features/user";
import { getApiContent } from "@services/user-service";

export const getPersonShorts = async (id: number, user: User | null): Promise<Short[]> => {
    const response = await getApiContent(`people/${id}/shorts`, user)
        .then((response) => response.data);
    return response;
}
