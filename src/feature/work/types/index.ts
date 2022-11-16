import type { IBookseries } from "../../../components/Bookseries";
import type { ICountry } from "../../../components/Country";
import { Person, PersonBrief } from "../../person/types";
import type { ILink } from "../../../components/Link";
import type { IShort } from "../../Short/Short";
import type { IAwarded } from "../../Award/Awarded";
import type { IPubseries } from "../../../components/Pubseries";
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
    pubseries: IPubseries,
    pubyear: number,
    stories: IShort[],
    subtitle: string,
    title: string,
    translators: PersonBrief[]
}
