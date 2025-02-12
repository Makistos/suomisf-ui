import { CombinedEdition, Edition } from "../types";


/** Groups editions by authors or editors
 *
 * @param editions: Edition[] List of editions to group
 * @returns {Record<string, Edition[]>} The grouped editions
 */
export const groupEditionsByAuthor = (editions: Edition[] | CombinedEdition[]) => {
    const uniquePeople = (value: string, index: number, array: string[]) => {
        return array.indexOf(value) === index;
    }
    const authorStr = (edition: Edition) => {
        // Always use authors only if available
        const authors = edition.work[0].contributions.filter(
            contrib => contrib.role.id === 1);
        if (authors.length > 0) {
            return authors.map(author => author.person.name).filter(uniquePeople).join(' &');
        }
        // Only use editor if book has no authors
        const editors = edition.work[0].contributions.filter(
            contrib => contrib.role.id === 3);
        return editors.map(
            contrib => contrib.person.name).filter(uniquePeople).join(' & ');
    }

    let grouped: Record<string, Edition[]> = editions.reduce((acc: { [index: string]: any; }, currentValue) => {
        const groupKey = authorStr(currentValue); //.work[0]["author_str"];
        if (!acc[groupKey]) {
            acc[groupKey] = [];
        }
        acc[groupKey].push(currentValue);
        return acc;
    }, {});
    return grouped;
};
