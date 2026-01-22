import { Contribution } from "../types/contribution";

export const appearsIn = (data: Contribution[]) => {
    const contribs = data.filter(contrib => contrib.role.id === 6);
    if (contribs.length === 0) return undefined;
    return contribs.sort((a, b) => a.person.name.localeCompare(b.person.name)).map(contrib => contrib.person.alt_name)
}

