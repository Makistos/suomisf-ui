
export interface ITag {
    id: number,
    name: string
}

export const PickTagLinks = (tags: ITag[]) => {
    return tags.map((tag) => ({ id: tag['id'], name: tag['name'] }))
}