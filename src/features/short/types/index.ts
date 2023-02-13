import { Person } from "../../person/types";
import { Edition } from "../../edition/types";
import { Issue } from "../../issue/types";
import { Genre } from "../../genre/types";
import { Contribution, ContributionSimple } from '../../../types/contribution';
import { TagType } from "../../tag";


export interface ShortType {
    id: number;
    name: string;
}
export interface Short {
    id: number;
    title: string;
    orig_title: string;
    lang: string;
    pubyear: string;
    authors: Person[];
    type: ShortType;
    editions: Edition[];
    issues: Issue[];
    genres: Genre[];
    contributors: Contribution[];
    tags: TagType[];
}

export interface ShortForm {
    id: number | null,
    title: string,
    orig_title: string,
    lang: string | null,
    pubyear: string,
    type: ShortType | null,
    genres: Genre[],
    contributors: Contribution[],
    tags: Pick<TagType, "id" | "name" | "type">[]
}