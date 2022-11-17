
import { Person } from "../features/person/types";

export interface ContributorRole {
    id: number,
    name: string
}

export interface Contribution {
    person: Person,
    role: ContributorRole,
    description?: string,
    real_person?: Person
}