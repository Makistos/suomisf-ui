import { Person } from "../../person/types";
import { Edition } from "../../edition/types";
import { IIssue } from "../../Issue/Issue";
import { IGenre } from '../../../components/Genre';
import { IContribution } from '../../../components/Contribution';
import { ITag } from '../../../components/Tag/SFTag';


export interface ShortType {
    id: number;
    name: string;
}
export interface Short {
    id: number;
    title: string;
    orig_title: string;
    language: string;
    pubyear: number;
    authors: Person[];
    type: ShortType;
    editions: Edition[];
    issues: IIssue[];
    genres: IGenre[];
    contributors: IContribution[];
    tags: ITag[];
}
