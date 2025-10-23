import { getCurrenUser } from "@services/auth-service";
import { postApiContent } from "@services/user-service";

export interface OmnibusWorkData {
    id: number;
    description?: string;
}

export interface OmnibusData {
    omnibus: number;
    works: OmnibusWorkData[];
}

export const saveOmnibusWorks = async (data: OmnibusData) => {
    const user = getCurrenUser();
    const response = await postApiContent('works/omnibus', data, user);
    return response;
};