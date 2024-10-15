import { Person } from "@features/person";
import { User } from "@features/user";
import { getApiContent } from "@services/user-service";

export const filterPeople = async (query: string, user: User | null): Promise<Person[]> => {
    const response = await getApiContent(`filter/people/${query}`, user).then((response) => response.data);
    return response;
}