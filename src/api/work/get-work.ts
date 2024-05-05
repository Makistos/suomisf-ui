import { getApiContent } from "@services/user-service";
import { Work } from "../../features/work";
import { useMemo } from "react";
import { getCurrenUser } from "@services/auth-service";

export const getWork = async (id: number): Promise<Work> => {
    const user = useMemo(() => getCurrenUser(), []);
    const response = getApiContent('work/' + id, user)
    const data = (await response).request
    return data;
}