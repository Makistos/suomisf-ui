import { Contribution } from "../types/contribution";

/**
 * Removes duplicate contributions from the given array.
 *
 * @param {Contribution[]} contributions - An array of contributions.
 * @return {Contribution[]} The array of contributions with duplicates removed.
 */
export const removeDuplicateContributions = (contributions: Contribution[]) => {
    const uniqueIds: number[] = [];
    const uniqueContributions = contributions
        .sort((a, b) => a.role.id - b.role.id)
        .filter(contrib => {
            const isDuplicate = uniqueIds.includes(contrib.person.id);
            if (!isDuplicate) {
                uniqueIds.push(contrib.person.id);
                return true;
            }
            return false;
        })
    return uniqueContributions
}

