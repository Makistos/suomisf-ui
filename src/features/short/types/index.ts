import { Person } from "../../person/types";
import { Edition } from "../../edition/types";
import { Issue } from "../../issue/types";
import { IGenre } from "../../genre/types";
import { Contribution } from '../../../types/contribution';
import { TagType } from "../../tag";


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
    issues: Issue[];
    genres: IGenre[];
    contributors: Contribution[];
    tags: TagType[];
}
