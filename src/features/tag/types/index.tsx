import { Work } from "../../work";
import { Article } from "../../article";
import { Short } from "../../short";
import { Magazine } from "../../magazine/types";
import { Person } from "../../person";
import { Issue } from "../../issue/types";

export interface TagType {
    id: number;
    name: string;
    type: string;
    works?: Work[];
    shorts?: Short[];
    articles?: Article[];
    magazines?: Magazine[];
    people?: Person[];
    issues?: Issue[];
}
