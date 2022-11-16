import { Work } from "../../work";
import { Edition } from "../../edition/types";
import { IArticle } from '../../Article/Article';
import { IShort } from '../../Short/Short';
import { ILink } from '../../../components/Link';
import { IAwarded } from '../../Award/Awarded';
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
    articles: IArticle[];
    stories: IShort[];
    magazine_stories: IShort[];
    awarded: IAwarded[];
}

export interface PersonBrief {
    id: number;
    name: string;
    alt_name: string;
    image_src: string;
}
