import { Person } from "../../person/types";
import { PublicationSize } from '../../../types/publication-size';
import { Short } from "../../short/types";
import { Article } from "../../article";
import { Magazine } from "../../magazine/types";


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
    size: PublicationSize;
    link: string;
    notes: string;
    title: string;
    editors: Person[];
    articles: Article[];
    stories: Short[];
    magazine: Magazine;
}
