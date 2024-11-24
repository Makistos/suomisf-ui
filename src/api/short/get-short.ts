import { Short } from "@features/short";
import { User } from "@features/user";
import { getApiContent } from "@services/user-service";

export const getShort = (id: string | null, user: User | null): Promise<Short> => {
    const response = getApiContent(`shorts/${id}`, user).then((response) => response.data);
    return response;
}