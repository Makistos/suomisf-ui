import { useState } from "react";

import { getApiContent } from "../services/user-service";
import { getCurrenUser } from "../services/auth-service";
import { Person } from "../features/person";

/**
 * Generates a custom hook that filters people based on a given event query.
 *
 * @param event - The event object containing the query to filter people.
 * @return {[Person[], (event: any) => Promise<void>]}- An array containing the
 *                                                       filtered people and the
 *                                                       function to filter
 *                                                       people.
 */
export const useFilterPeople = () => {
  const user = getCurrenUser();
  const [filteredPeople, setFilteredPeople] = useState<Person[]>([]);
  const filterPeople = async (event: any) => {
    const url = "filter/people/" + event.query;
    const response = await getApiContent(url, user);
    const p = response.data;
    setFilteredPeople(p);
  };
  return [filteredPeople, filterPeople] as const;
}
