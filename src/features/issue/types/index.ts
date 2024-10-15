import { Person } from "../../person/types";
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
    magazine_id: number;
}

export interface IssueFormData {
    id: number | null;
    type: number | null;
    number: number | null;
    number_extra: string | null;
    count: number | null;
    year: number | null;
    cover_number: string | null;
    publisher_id: number | null;
    pages: number | null;
    size: PublicationSize | null;
    link: string | null;
    notes: string | null;
    title: string | null;
    editors: Person[] | null;
    magazine_id: number;
}

export interface PublicationSize {
    id: number;
    name: string;
    mm_width?: number;
    mm_height: number;
}