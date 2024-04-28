import { Bookseries } from '../../features/bookseries';
import { getApiContent } from '../../services/user-service';
import { User } from '../../features/user';

export const getBookseries = async (id: number, user: User | null): Promise<Bookseries> => {
    const retval = await getApiContent('bookseries/' + id, user).then(response => response.data);
    return retval;
}