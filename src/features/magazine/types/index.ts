export interface IMagazine {
    id: number;
    name: string;
    description: string;
    link: string;
    issn: string;
    type: number;
    uri: string;
    issues: number[];
}
