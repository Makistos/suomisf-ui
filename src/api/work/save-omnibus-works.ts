import { getCurrenUser } from "@services/auth-service";
import { postApiContent } from "@services/user-service";

export interface OmnibusData {
    omnibus: number;
    works: number[];
}

export const saveOmnibusWorks = async (data: OmnibusData) => {
    const user = getCurrenUser();
    const response = await postApiContent('works/omnibus', data, user);
    return response;
};