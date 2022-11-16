import type { IBookseries } from "../../../components/Bookseries";
import type { ICountry } from "../../../components/Country";
import type { IPerson, IPersonBrief } from "../../Person/Person";
import type { ILink } from "../../../components/Link";
import type { IShort } from "../../Short/Short";
import type { IAwarded } from "../../Award/Awarded";
import type { IPubseries } from "../../../components/Pubseries";
import { IEdition } from "../../Edition/Edition";

export interface Work {
    [index: string]: any,
    author_str: string,
    authors: IPerson[],
    awards: IAwarded[],
    bookseries: IBookseries,
    bookseriesnum: string,
    bookseriesorder: number,
    desc_attr: string,
    description: string,
    editions: IEdition[],
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
    translators: IPersonBrief[]
}

