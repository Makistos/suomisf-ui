import { Publisher } from "../../publisher/types";
import { Person } from "../../person/types";
import { Work } from "../../work";
import { ImageType } from "../../../types/image";
import { EditionFormat } from "../../../types/edition-format";
import { Binding } from "../../../types/binding";
import { Pubseries } from "../../pubseries/types";
import { Contribution } from "../../../types/contribution";


export interface Edition {
    binding: Binding;
    coll_info: string;
    contributions: Contribution[];
    coverimage: number;
    dustcover: number;
    editionnum: number;
    editors: Person[];
    format: EditionFormat;
    id: number;
    images: ImageType[];
    imported_string: string;
    isbn: string;
    misc: string;
    pages?: number;
    printedin?: string;
    publisher: Publisher;
    pubseries: Pubseries;
    pubseriesnum?: number;
    pubyear: number;
    size?: string;
    subtitle: string;
    title: string;
    translators: Person[];
    version: number;
    work: Work[];

}

export interface EditionProps {
    edition: Edition,
    showFirst?: boolean,
    details?: string,
    person?: string,
    showPerson?: boolean,
    work?: Work,
    card?: boolean,
    showVersion?: boolean
    contributions?: Contribution[],
}

export interface EditionFormData {
    [index: string]: any,
    id: number,
    title: string,
    subtitle: string,
    editionnum: number,
    pubyear: number,
    pages?: number,
    size?: string,
    misc: string,
    isbn: string,
    printedin?: string,
    coll_info: string,
    contributors: Contribution[],
    dustcover?: boolean | null,
    coverimage?: boolean | null,
    format: EditionFormat,
    binding: Binding,
    pubseries?: Pubseries,
    pubseriesnum?: number,
    publisher: Publisher,

}
