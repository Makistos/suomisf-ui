import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { ProgressSpinner } from "primereact/progressspinner";

import { getCurrenUser } from "../../../services/auth-service"
import { getApiContent } from "../../../services/user-service";
import { User } from "../../user";
import { Work } from "../types";
import { WorkList } from "./work-list";

interface WorksLatestProps {
  count: string | number
}

const fetchLatestWorks = async (count: string | number, user: User | null): Promise<Work[]> => {
  const url = "latest/works/" + count;
  const data = await getApiContent(url, user).then(response =>
    response.data
  )
    .catch((error) => console.log(error));
  // React Query rejects undefined data (the catch above yields it)
  return data ?? [];
}

export const WorksLatest = ({ count }: WorksLatestProps) => {
  const user = useMemo(() => getCurrenUser(), []);
  const { isLoading: loading, data } = useQuery({
    queryKey: ['latest', 'works', count, user?.id],
    queryFn: () => fetchLatestWorks(count, user),
  });

  return (
    <>
      {loading ? <ProgressSpinner /> :
        (<WorkList works={data === undefined ? [] : data} sort={false} details="brief" />)}
    </>
  )
}