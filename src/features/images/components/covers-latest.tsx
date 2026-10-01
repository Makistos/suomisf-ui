import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { ProgressSpinner } from "primereact/progressspinner";

import { getCurrenUser } from "../../../services/auth-service";
import { getApiContent } from "../../../services/user-service";
import { User } from "../../user";
import { EditionImage } from "../types";
import { CoversList } from "./covers-list";

interface CoversLatestProps {
  count: string | number
}

const fetchLatestCovers = async (count: string | number, user: User | null): Promise<EditionImage[]> => {
  const url = "latest/covers/" + count;
  const data = await getApiContent(url, user).then(response =>
    response.data)
    .catch((error) => console.log(error));
  // React Query rejects undefined data (the catch above yields it)
  return data ?? [];
}

export const CoversLatest = ({ count }: CoversLatestProps) => {
  const user = useMemo(() => getCurrenUser(), []);
  const { isLoading: loading, data } = useQuery({
    queryKey: ['latest', 'covers', count, user?.id],
    queryFn: () => fetchLatestCovers(count, user),
  });

  return (
    <div className="grid">
      {
        loading ?
          <ProgressSpinner />
          :
          <div className="grid col">
            <CoversList covers={data === undefined ? [] : data} />
          </div>
      }
    </div>
  )
}

