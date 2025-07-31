
import { FieldValues } from "react-hook-form";
import { PersonBrief } from "../features/person/types";

export interface ContributorRole {
    id: number,
    name: string
}

export interface RoleBrief {
    id: number,
    name: string
}
export interface Contribution {
    person: PersonBrief,
    role: ContributorRole,
    description?: string,
    real_person?: PersonBrief,
}

export interface ContributionSimple extends FieldValues {
    person: PersonBrief,
    role: RoleBrief,
    description?: string
}

export const ContributionType = {
    Kirjoittaja: 1, // Work contributor
    Kääntäjä: 2,
    Toimittaja: 3,  // Work contributor
    Kansikuva: 4, // Work and issue contributor
    Kuvittaja: 5,
    Esiintyy: 6, // Work contributor
    Päätoimittaja: 7, // Issue contributor
}

export type ContributionKey = keyof typeof ContributionType;