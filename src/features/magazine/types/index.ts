import { Publisher } from "@features/publisher";
import { SfTag } from "@features/tag";

export interface MagazineType {
    id: number;
    name: string;
}

export interface Magazine {
    id: number;
    name: string;
    publisher: Publisher;
    description: string;
    link: string;
    issn: string;
    type: MagazineType;
    uri: string;
    issues: number[];
}

export interface MagazineFormData {
    id: number | null;
    name: string;
    publisher: Publisher | null;
    description: string;
    link: string;
    issn: string;
    type: MagazineType | null;
    tags: SfTag[];
}