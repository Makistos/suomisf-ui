import { useEffect, useState } from "react";

import { ProgressSpinner } from "primereact/progressspinner";

import { getCurrenUser } from "../../../services/auth-service"
import { getApiContent } from "../../../services/user-service";
import { User } from "../../user";
import { Work } from "../types";
import { WorkList } from "./work-list";

interface WorksLatestProps {
  count: string | number
}

export const WorksLatest = ({ count }: WorksLatestProps) => {
  const user = getCurrenUser();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Work[]>([]);

  const fetchLatestWorks = async (count: string | number, user: User | null): Promise<Work[]> => {
    const url = "latest/works/" + count;
    const data = await getApiContent(url, user).then(response =>
      response.data
    )
      .catch((error) => console.log(error));
    return data;
  }

  useEffect(() => {
    setLoading(true);
    fetchLatestWorks(count, user).then(data => {
      setData(data)
      setLoading(false);
    });
  }, [count])

  return (
    <>
      {loading ? <ProgressSpinner /> :
        (<WorkList works={data === undefined ? [] : data} sort={false} details="brief" />)}
    </>
  )
}