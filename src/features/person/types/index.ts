import { Work } from "../../work";
import { Edition } from "../../edition/types";
import { Article } from "../../article";
import { Short } from "../../short/types";
import { LinkType } from '../../../types/link';
import { Awarded } from '../../award';
import { Nationality } from "../../../types/nationality";
import { Contribution } from "../../../types/contribution";

export type PersonBrief = Pick<Person, "id" | "name" | "alt_name" | "fullname">
export interface Person {
    [index: string]: any;
    id: number;
    name: string;
    aliases: PersonBrief[],
    alt_name: string;
    fullname: string;
    other_names: string;
    image_src: string;
    dob: number;
    dod: number;
    bio: string;
    links: LinkType[];
    roles: string[];
    nationality: Nationality;
    works: Work[];
    translations: Edition[],
    edits: Edition[];
    articles: Article[];
    stories: Short[];
    magazine_stories: Short[];
    awarded: Awarded[];
    editions: Edition[];
}

export interface PersonFormData {
    [index: string]: any;
    id: number | null;
    name: string;
    aliases: PersonBrief[];
    alt_name: string;
    fullname: string;
    other_names: string;
    dob: number | null;
    dod: number | null;
    bio: string;
    links: LinkType[];
    nationality: Nationality | null;
}
// export interface PersonBrief {
//     id: number;
//     name: string;
//     // alt_name: string;
//     // fullname: string;
//     // other_names: string;
//     // image_src: string;
// }
