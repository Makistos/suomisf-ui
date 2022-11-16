import type { IBookseries } from "../../../components/Bookseries";
import type { ICountry } from "../../../components/Country";
import { Person, PersonBrief } from "../../person/types";
import type { ILink } from "../../../components/Link";
import { Short } from "../../short/types";
import type { IAwarded } from "../../Award/Awarded";
import { Pubseries } from "../../pubseries/types";
import { Edition } from "../../edition/types";

export interface Work {
    [index: string]: any,
    author_str: string,
    authors: Person[],
    awards: IAwarded[],
    bookseries: IBookseries,
    bookseriesnum: string,
    bookseriesorder: number,
    desc_attr: string,
    description: string,
    editions: Edition[],
    id: number,
    imported_string: string,
    language: ICountry,
    links: ILink[],
    misc: string,
    orig_title: string,
    pubseries: Pubseries,
    pubyear: number,
    stories: Short[],
    subtitle: string,
    title: string,
    translators: PersonBrief[]
}

