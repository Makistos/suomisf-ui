import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { ProgressSpinner } from "primereact/progressspinner";

import { getCurrenUser } from "../../../services/auth-service";
import { getApiContent } from "../../../services/user-service";
import { User } from "../../user";
import { Edition } from "../types";
import { EditionList } from "./edition-list";

interface EditionLatestProps {
  count: string | number
}

const fetchLatestEditions = async (count: string | number, user: User | null): Promise<Edition[]> => {
  const url = "latest/editions/" + count;
  const data = await getApiContent(url, user).then(response =>
    response.data)
    .catch((error) => console.log(error));
  // React Query rejects undefined data (the catch above yields it)
  return data ?? [];
}

export const EditionsLatest = ({ count }: EditionLatestProps) => {
  const user = useMemo(() => getCurrenUser(), []);
  const { isLoading: loading, data } = useQuery({
    queryKey: ['latest', 'editions', count, user?.id],
    queryFn: () => fetchLatestEditions(count, user),
  });

  return (
    <>
      {
        loading ?
          <ProgressSpinner />
          :
          (<EditionList editions={data === undefined ? [] : data} sort="none" />)
      }
    </>
  )
}