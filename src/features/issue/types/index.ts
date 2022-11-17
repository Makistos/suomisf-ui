import { Person } from "../../person/types";
import { IPublicationSize } from '../../../types/publication-size';
import { Short } from "../../short/types";
import { Article } from "../../article";
import { IMagazine } from "../../magazine/types";


export interface Issue {
    id: number;
    type: number;
    number: number;
    number_extra: string;
    count: number;
    year: number;
    cover_number: string;
    publisher_id: number;
    image_src: string;
    pages: number;
    size: IPublicationSize;
    link: string;
    notes: string;
    title: string;
    editors: Person[];
    articles: Article[];
    stories: Short[];
    magazine: IMagazine;
}
