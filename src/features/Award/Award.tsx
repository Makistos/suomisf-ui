import type { IAwardCategory } from "./AwardCategory"
import type { IAwarded } from "./Awarded"

export interface IAward {
    id: number,
    name: string,
    description: string,
    domestic: boolean,
    categories: IAwardCategory[],
    winners: IAwarded[]
}

export const Award = () => {
    return (
        <></>
    )
}