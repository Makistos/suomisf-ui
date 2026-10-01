import { Person } from "../../person";
import { SfTag } from "../../tag";
import { Issue } from "../../issue/types";


// Legacy articles: no UI of their own any more (articles were moved to
// short stories), but tags/people/issues still return them and the delete
// checks count them.
export interface Article {
    id: number;
    title: string;
    person: string;
    excerpt: string;
    author_rel: Person[];
    issue?: Issue | null;
    tags: SfTag[];
}
