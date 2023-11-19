import { Edition } from "../../features/edition";
import { Contribution } from "../../types/contribution";

/**
 * Returns a list of unique authors and editors from the given editions.
 * @param editions - The list of editions.
 * @returns The list of unique contributions made by authors and editors.
 */
export const workCreators = (editions: Edition[]): Contribution[] => {
  if (!editions) return ([]);

  // Get all contributions made by authors and editors
  const workContributions = editions.map((edition) =>
    edition.contributions.filter((contribution) => contribution.role.id === 1 || contribution.role.id === 2)).flat();

  // Select only unique contributions
  const uniqueContributions = workContributions.filter((contribution, index, ar) => ar.indexOf(contribution) === index);

  return uniqueContributions;
}
