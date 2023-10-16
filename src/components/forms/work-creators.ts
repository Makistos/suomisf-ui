import { Edition } from "../../features/edition";
import { Contribution } from "../../types/contribution";

// Work creators are authors and editors. This returns a list with unique authors and editors.
export const workCreators = (editions: Edition[]): Contribution[] => {
  if (!editions) return ([]);
  const workContributions = editions.map((edition) =>
    edition.contributions.filter((contribution) => contribution.role.id === 1 || contribution.role.id === 2)).flat();
  // Select only unique contributions
  const uniqueContributions = workContributions.filter((contribution, index, ar) => ar.indexOf(contribution) === index);
  return uniqueContributions;
}
