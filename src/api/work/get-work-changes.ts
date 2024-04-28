import { LogItem } from "../../features/changes";
import { User } from "../../features/user";
import { getApiContent } from "../../services/user-service";

export const getWorkChanges = async (id: number, user: User | null): Promise<LogItem[]> => {
    const retval = await getApiContent('work/' + id + '/changes', user).then(response => response.data);
    return retval;
}