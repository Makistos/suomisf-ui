import { Person } from "../../person";
import type { Work } from "../../work";
import { Short } from "../../short";

export interface Award {
    id: number;
    name: string;
    description: string;
    domestic: boolean;
    categories: IAwardCategory[];
    winners: IAwarded[];
}

export interface IAwardCategory {
    id: number,
    name: string,
    type: number
}

export interface IAwarded {
    id: number,
    year: number,
    award: Award,
    person: Person,
    work: Work,
    category: IAwardCategory,
    story: Short
}
