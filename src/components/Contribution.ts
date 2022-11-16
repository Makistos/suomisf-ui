
import { Person } from "../features/person/types";

export interface IRole {
    id: number,
    name: string
}

export interface IContribution {
    person: Person,
    role: IRole,
    description?: string,
    real_person?: Person
}
// export interface IContribution {
//     id: number;
//     value: string;
//     role: { id: number; name: string };
//     description: string;
// }
