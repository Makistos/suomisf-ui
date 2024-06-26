import { TagFormData } from "@features/tag";
import { User } from "@features/user"
import { getApiContent } from "@services/user-service"

const defaultValues: TagFormData = {
    id: null,
    name: '',
    type: null
}
export const getTagFormData = async (id: number | null, user: User | null): Promise<TagFormData> => {
    if (id === null) {
        return defaultValues;
    }
    return getApiContent('tags/' + id, user).then((response) => response.data);
}