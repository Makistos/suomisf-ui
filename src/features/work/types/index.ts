import { Bookseries } from "../../bookseries";
// import type { Country } from "../../../types/country";
import { Person } from "../../person/types";
import type { LinkType } from "../../../types/link";
import { Short } from "../../short/types";
import type { Awarded } from "../../award";
import { Pubseries } from "../../pubseries/types";
import { Edition } from "../../edition/types";
import { Language } from "../../../types/language";
// import { Contributable } from "../../../types/generic";
import { Contribution } from "../../../types/contribution";
export interface Work {
    [index: string]: any,
    author_str: string,
    authors: Person[],
    awards: Awarded[],
    bookseries: Bookseries,
    bookseriesnum: string,
    bookseriesorder: number,
    desc_attr: string,
    description: string,
    editions: Edition[],
    id: number,
    imported_string: string,
    language_name: Language,
    links: LinkType[],
    misc: string,
    orig_title: string,
    pubseries: Pubseries,
    pubyear: number,
    stories: Short[],
    subtitle: string,
    title: string,
    translators: Person[],
    contributors: Contribution[],
}

export interface WorkFormData {
    [index: string]: any,
    id: number | null,
    title: string,
    subtitle?: string,
    orig_title?: string,
    pubyear?: number,
    language?: Language | null,
    bookseries?: Bookseries | null,
    bookseriesnum?: string,
    bookseriesorder?: number,
    description?: string,
    desc_attr?: string,
    misc?: string,
    imported_strin?: string,
    contributors: Contribution[],
    links: LinkType[],
}