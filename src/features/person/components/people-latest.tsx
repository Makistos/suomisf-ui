import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { ProgressSpinner } from "primereact/progressspinner";

import { getCurrenUser } from "../../../services/auth-service";
import { getApiContent } from "../../../services/user-service";
import { User } from "../../user";
import { Person } from "..";
import { PeopleList } from "./people-list";

interface PeopleLatestProps {
  count: string | number
}

const fetchLatestPeople = async (count: string | number, user: User | null): Promise<Person[]> => {
  const url = "latest/people/" + count;
  const data = await getApiContent(url, user).then(response =>
    response.data)
    .catch((error) => console.log(error));
  // React Query rejects undefined data (the catch above yields it)
  return data ?? [];
}

export const PeopleLatest = ({ count }: PeopleLatestProps) => {
  const user = useMemo(() => getCurrenUser(), []);
  const { isLoading: loading, data } = useQuery({
    queryKey: ['latest', 'people', count, user?.id],
    queryFn: () => fetchLatestPeople(count, user),
  });

  return (
    <>
      {
        loading ?
          <ProgressSpinner />
          :
          (<PeopleList people={data === undefined ? [] : data} />)
      }
    </>
  )
}
