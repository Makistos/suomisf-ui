import { ReactNode, useEffect, useState } from "react";
import { User } from "../../user";
import { getApiContent } from "../../../services/user-service";
import { getCurrenUser } from "../../../services/auth-service";
import { ProgressSpinner } from "primereact/progressspinner";

interface LatestItemsProps {
  component: React.ComponentType<{ items: any[] }>,
  url: string,
  count: number | string
}

export const LatestItems = <T,>({ component, url, count }: LatestItemsProps) => {
  const user = getCurrenUser();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<T[]>([]);

  const fetchLatestItems = async (url: string, user: User | null): Promise<any[]> => {
    const data = await getApiContent(url, user).then(response =>
      response.data
    )
      .catch((error) => console.log(error));
    return data;
  }

  useEffect(() => {
    setLoading(true);
    fetchLatestItems(url, user).then(data => {
      setData(data);
      setLoading(false);
    });
  })

  return (
    <>
      {loading ? <ProgressSpinner /> :
        <></>
        // (<component items={data === undefined ? [] : data} />)
      }
    </>
  )
}