import { LogItem } from "../../features/changes";
import { User } from "../../features/user";
import { getApiContent } from "../../services/user-service";

export const getPersonChanges = async (id: number, user: User | null): Promise<LogItem[]> => {
    const retval = await getApiContent('person/' + id + '/changes', user).then(response => response.data);
    return retval;
}
