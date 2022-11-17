import { Edition } from "../../edition/types";
import { Publisher } from "../../publisher/types";
import { Work } from "../../work";

export interface Bookseries {
    id: number;
    name: string;
    orig_name: string;
    important: number;
    image_src: string;
    image_attr: string;
    works: Work[];
    publisher: Publisher;
    editions: Edition[];
}
