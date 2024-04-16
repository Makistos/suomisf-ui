import { Work } from "../../features/work";

export const getWork = async (id: number): Promise<Work> => {
    const response = await fetch(`https://sfbibliografia.herokuapp.com/api/work/${id}`);
    const data = await response.json();
    return data;
}