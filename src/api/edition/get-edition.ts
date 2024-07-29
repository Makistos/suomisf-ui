import { getApiContent } from "@services/user-service";
import { Edition } from "@features/edition";
import { User } from "@features/user";

export const getEdition = async (id: number | null, user: User | null): Promise<Edition | null> => {
    if (!id) { return null; }
    const response = getApiContent(`editions/${id}`, user).then(response =>
        response.data);
    return response;
}

