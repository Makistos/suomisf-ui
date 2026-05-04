import { Person } from "../../person";
import type { Work } from "../../work";
import { Short } from "../../short";
import { LinkType } from "../../../types/link";

export interface Award {
    id: number;
    name: string;
    description: string;
    domestic: boolean;
    links: LinkType[];
    categories: AwardCategory[];
    winners: Omit<Awarded, "award">[];
}

export interface AwardFormData {
    id: number;
    name: string;
    description: string;
    domestic: boolean;
    links: LinkType[];
}

export interface AwardCategory {
    id: number,
    name: string,
    type: number
}

export interface Awarded {
    id: number,
    year: number,
    award: Omit<Award, 'winners'>,
    person: Pick<Person, 'id' | 'name' | 'alt_name'>,
    work: Pick<Work, 'id' | 'title' | 'orig_title' | 'author_str' | 'contributions'>,
    category: AwardCategory,
    story: Pick<Short, 'id' | 'title' | 'contributors' | 'orig_title'>
}

export interface AwardedRowData {
    [index: string]: any,
    id: number,
    year: number,
    award: Omit<Award, 'winners'>,
    person: Pick<Person, 'id' | 'name' | 'alt_name'>,
    work: Pick<Work, 'id' | 'title' | 'author_str'>,
    category: Pick<AwardCategory, 'id' | 'name' | 'type'>,
    story: Pick<Short, 'id' | 'title'>
}
export interface AwardedFormData {
    id: number,
    type: number,
    awarded: AwardedRowData[]
}