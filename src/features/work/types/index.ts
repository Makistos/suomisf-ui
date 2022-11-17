import type { IBookseries } from "../../../components/Bookseries";
import type { Country } from "../../../types/country";
import { Person, PersonBrief } from "../../person/types";
import type { LinkType } from "../../../types/link";
import { Short } from "../../short/types";
import type { Awarded } from "../../award";
import { Pubseries } from "../../pubseries/types";
import { Edition } from "../../edition/types";

export interface Work {
    [index: string]: any,
    author_str: string,
    authors: Person[],
    awards: Awarded[],
    bookseries: IBookseries,
    bookseriesnum: string,
    bookseriesorder: number,
    desc_attr: string,
    description: string,
    editions: Edition[],
    id: number,
    imported_string: string,
    language: Country,
    links: LinkType[],
    misc: string,
    orig_title: string,
    pubseries: Pubseries,
    pubyear: number,
    stories: Short[],
    subtitle: string,
    title: string,
    translators: PersonBrief[]
}

