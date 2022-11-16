import { Work } from "../../work";
import { Article } from "../../article";
import { Short } from "../../short";
import { IMagazine } from '../../Magazine/Magazine';
import { Person } from "../../person";
import { IIssue } from '../../Issue/Issue';

export interface TagType {
    id: number;
    name: string;
    type: string;
    works?: Work[];
    shorts?: Short[];
    articles?: Article[];
    magazines?: IMagazine[];
    people?: Person[];
    issues?: IIssue[];
}
