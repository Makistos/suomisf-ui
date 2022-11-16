import { IPublisher } from "../../Publisher/Publisher";
import { IPersonBrief } from "../../Person/Person";
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
    editors: IPersonBrief[];
    format: IFormat;
    id: number;
    images: IImage[];
    imported_string: string;
    isbn: string;
    misc: string;
    pages?: number;
    printedin?: string;
    publisher: IPublisher;
    pubseries: IPubseries;
    pubseriesnum?: number;
    pubyear: number;
    size?: string;
    subtitle: string;
    title: string;
    translators: IPersonBrief[];
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
