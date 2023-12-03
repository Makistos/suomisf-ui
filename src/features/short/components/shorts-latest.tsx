import { useState, useEffect } from 'react';

import { ProgressSpinner } from 'primereact/progressspinner';

import { getCurrenUser } from "../../../services/auth-service";
import { getApiContent } from "../../../services/user-service";
import { User } from "../../user";
import { Short } from "../../short";
import { ShortsList } from '../../short';

interface ShortsLatestProps {
  count: string | number
}

export const ShortsLatest = ({ count }: ShortsLatestProps) => {
  const user = getCurrenUser();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Short[]>([]);

  const fetchLatestShorts = async (count: string | number, user: User | null): Promise<Short[]> => {
    const url = "latest/shorts/" + count;
    const data = await getApiContent(url, user).then(response =>
      response.data)
      .catch((error) => console.log(error));
    return data;
  }

  useEffect(() => {
    setLoading(true);
    fetchLatestShorts(count, user).then(data => {
      setData(data);
      setLoading(false);
    });
  }, [count])

  return (
    <>
      {loading ?
        <ProgressSpinner />
        :
        (<ShortsList shorts={data === undefined ? [] : data} anthology={true} />)
      }
    </>
  )
}