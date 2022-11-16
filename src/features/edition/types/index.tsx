import { Publisher } from "../../publisher/types";
import { PersonBrief } from "../../person/types";
import { Work } from "../../work";
import { IImage } from "../../../components/Image";
import { IFormat } from "../../../components/Format";
import { IBinding } from "../../../components/Binding";
import { IPubseries } from "../../../components/Pubseries";


export interface Edition {
    binding: IBinding;
    coll_info: string;
    coverimage: number;
    dustcover: number;
    editionnum: number;
    editors: PersonBrief[];
    format: IFormat;
    id: number;
    images: IImage[];
    imported_string: string;
    isbn: string;
    misc: string;
    pages?: number;
    printedin?: string;
    publisher: Publisher;
    pubseries: IPubseries;
    pubseriesnum?: number;
    pubyear: number;
    size?: string;
    subtitle: string;
    title: string;
    translators: PersonBrief[];
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
}
