import _ from "lodash";
import { Contribution, ContributionSimple } from '../../types/contribution';

export const makeBriefContributor = (contributions: Contribution[]): ContributionSimple[] => {
  const simplifyContribution = (contribution: Contribution) => {
    return {
      'person': _.pick(contribution.person, ['id', 'name', 'alt_name', 'fullname']),
      'role': _.pick(contribution.role, ['id', 'name']),
      'description': contribution.description || '',
    };
  };
  return contributions.map(simplifyContribution);
};
