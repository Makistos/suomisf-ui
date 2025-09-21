import { Publisher } from "../../publisher/types";
import { Edition } from "../../edition";
import { LinkType } from "../../../types/link";


export interface Pubseries {
    id: number;
    name: string;
    description: string;
    important: number;
    image_src: string;
    image_attr: string;
    publisher: Publisher;
    editions: Edition[];
    links: LinkType[];
}

export interface PubseriesFormData {
    id: number | null,
    name: string,
    description: string,
    important: number,
    image_src: string,
    image_attr: string,
    publisher: Publisher | null,
    links: LinkType[]
}