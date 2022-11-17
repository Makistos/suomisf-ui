import { Edition } from "../../edition";
import { Pubseries } from "../../pubseries/types";
import { LinkType } from "../../../types/link";


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
    links?: LinkType[];
    name: string;
    series: Pubseries[];
}
