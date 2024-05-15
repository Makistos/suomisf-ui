import { Person } from "../../person";
import { SfTag } from "../../tag";
import { Issue } from "../../issue/types";


export interface Article {
    id: number;
    title: string;
    person: string;
    excerpt: string;
    author_rel: Person[];
    issue: Issue;
    tags: SfTag[];
}
