// This can't be named Link because it would overlap with the Link component
// from react - router - dom
export interface LinkType {
    id?: number | null,
    item_id?: number | null,
    link: string,
    description: string
}
