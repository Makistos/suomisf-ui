import { User } from "@features/user";

import { getApiContent } from "@services/user-service";
import { PublicationSize } from "@features/issue";

export const getPublicationSizes = async (user: User | null): Promise<PublicationSize[]> => {
    const response = await getApiContent('issues/sizes', user).then((response) => response.data);
    return response;
}