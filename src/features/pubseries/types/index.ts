import { Publisher } from "../../publisher/types";
import { Edition } from "../../edition";


export interface Pubseries {
    id: number;
    name: string;
    orig_name: string;
    important: number;
    image_src: string;
    image_attr: string;
    publisher: Publisher;
    editions: Edition[];
}
