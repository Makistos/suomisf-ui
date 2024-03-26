import { Publisher } from "../../publisher/types";
import { Edition } from "../../edition";


export interface Pubseries {
    id: number;
    name: string;
    important: number;
    image_src: string;
    image_attr: string;
    publisher: Publisher;
    editions: Edition[];
}

export interface PubseriesFormData {
    id: number | null,
    name: string,
    important: number,
    image_src: string,
    image_attr: string,
    publisher: Publisher | null
}