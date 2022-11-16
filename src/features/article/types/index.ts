import { Person } from "../../person";
import { TagType } from "../../tag";
import { IIssue } from '../../Issue/Issue';


export interface Article {
    id: number;
    title: string;
    person: string;
    excerpt: string;
    author_rel: Person[];
    issue: IIssue;
    tags: TagType[];
}
