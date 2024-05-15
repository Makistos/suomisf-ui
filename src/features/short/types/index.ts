import { Person } from "../../person/types";
import { Edition } from "../../edition/types";
import { Issue } from "../../issue/types";
import { Genre } from "../../genre/types";
import { Contribution, ContributionSimple } from '../../../types/contribution';
import { SfTag } from "../../tag";
import { Language } from "../../../types/language";


export interface ShortType {
    id: number;
    name: string;
}
export interface Short {
    id: number;
    title: string;
    orig_title: string;
    lang: Language;
    pubyear: string;
    type: ShortType;
    editions: Edition[];
    issues: Issue[];
    genres: Genre[];
    contributors: Contribution[];
    tags: SfTag[];
}

export interface ShortForm {
    id: number | null,
    title: string,
    orig_title: string,
    lang: Language | null,
    pubyear: string,
    type: ShortType | null,
    genres: Genre[],
    contributors: Contribution[],
    tags: Pick<SfTag, "id" | "name" | "type">[]
}