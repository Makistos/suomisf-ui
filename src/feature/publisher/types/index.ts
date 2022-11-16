import { Edition } from "../../edition/types";
import { IPubseries } from "../../../components/Pubseries";
import { ILink } from "../../../components/Link";


export interface Publisher {
    description: string;
    edition_count?: number;
    edition_oldest?: number | null;
    edition_newest?: number | null;
    editions: Edition[];
    fullname: string;
    id: number;
    image_attr?: string;
    image_count?: number;
    image_src?: string;
    links?: ILink[];
    name: string;
    series: IPubseries[];
}