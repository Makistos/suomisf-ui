import { IAwardCategory } from "./AwardCategory"
import { IAwarded } from "./Awarded"

export interface IAward {
    id: number,
    name: string,
    description: string,
    domestic: boolean,
    categories: IAwardCategory[],
    winners: IAwarded[]
}