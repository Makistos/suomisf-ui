import { useState, useEffect } from "react";

import { ProgressSpinner } from "primereact/progressspinner";

import { getCurrenUser } from "../../../services/auth-service";
import { getApiContent } from "../../../services/user-service";
import { User } from "../../user";
import { Edition } from "../types";
import { EditionList } from "./edition-list";

interface EditionLatestProps {
  count: string | number
}

export const EditionsLatest = ({ count }: EditionLatestProps) => {
  const user = getCurrenUser();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Edition[]>([]);

  const fetchLatestEditions = async (count: string | number, user: User | null): Promise<Edition[]> => {
    const url = "latest/editions/" + count;
    const data = await getApiContent(url, user).then(response =>
      response.data)
      .catch((error) => console.log(error));
    return data;
  }

  useEffect(() => {
    setLoading(true);
    fetchLatestEditions(count, user).then(data => {
      setData(data);
      setLoading(false);
    });
  }, [count])

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