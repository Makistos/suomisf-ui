import { Work } from "../../work";
import { Article } from "../../article";
import { Short } from "../../short";
import { Magazine } from "../../magazine/types";
import { Person } from "../../person";
import { Issue } from "../../issue/types";

export interface TagType {
    id: number;
    name: string;
}

export interface SfTag {
    id: number;
    name: string;
    type_id: number;
    type?: TagType;
    works?: Work[];
    stories?: Short[];
    articles?: Article[];
    workcount?: number;
    storycount?: number;
    articlecount?: number;
    //magazines?: Magazine[];
    //people?: Person[];
    //issues?: Issue[];
}

export interface SfTagProps {
    id: number | null,
    tag?: SfTag,
    count?: number | null
}

export interface TagFormData {
    id: number | null,
    name: string,
    type: TagType | null
}
