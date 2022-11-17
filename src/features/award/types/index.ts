import { Person } from "../../person";
import type { Work } from "../../work";
import { Short } from "../../short";

export interface Award {
    id: number;
    name: string;
    description: string;
    domestic: boolean;
    categories: AwardCategory[];
    winners: Awarded[];
}

export interface AwardCategory {
    id: number,
    name: string,
    type: number
}

export interface Awarded {
    id: number,
    year: number,
    award: Award,
    person: Person,
    work: Work,
    category: AwardCategory,
    story: Short
}
