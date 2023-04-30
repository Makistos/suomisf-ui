
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