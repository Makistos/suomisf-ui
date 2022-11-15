
import { IPerson } from "../pages/Person/Person";

export interface IRole {
    id: number,
    name: string
}

export interface IContribution {
    person: IPerson,
    role: IRole,
    description?: string,
    real_person?: IPerson
}
// export interface IContribution {
//     id: number;
//     value: string;
//     role: { id: number; name: string };
//     description: string;
// }
