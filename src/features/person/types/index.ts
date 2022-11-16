import { Work } from "../../work";
import { Edition } from "../../edition/types";
import { Article } from "../../article";
import { Short } from "../../short/types";
import { ILink } from '../../../components/Link';
import { IAwarded } from '../../award';
import { Nationality } from "../../../types/nationality-type";


export interface Person {
    [index: string]: any;
    id: number;
    name: string;
    aliases: Person[];
    alt_name: string;
    fullname: string;
    other_names: string;
    image_src: string;
    dob: number;
    dod: number;
    bio: string;
    links: ILink[];
    roles: string[];
    nationality: Nationality;
    works: Work[];
    translations: Edition[];
    edits: Edition[];
    articles: Article[];
    stories: Short[];
    magazine_stories: Short[];
    awarded: IAwarded[];
}

export interface PersonBrief {
    id: number;
    name: string;
    alt_name: string;
    image_src: string;
}
