import { useState, useEffect } from "react";

import { ProgressSpinner } from "primereact/progressspinner";

import { getCurrenUser } from "../../../services/auth-service";
import { getApiContent } from "../../../services/user-service";
import { User } from "../../user";
import { EditionImage } from "../types";
import { CoversList } from "./covers-list";

interface CoversLatestProps {
  count: string | number
}

export const CoversLatest = ({ count }: CoversLatestProps) => {
  const user = getCurrenUser();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EditionImage[]>([]);

  const fetchLatestCovers = async (count: string | number, user: User | null): Promise<EditionImage[]> => {
    const url = "latest/covers/" + count;
    const data = await getApiContent(url, user).then(response =>
      response.data)
      .catch((error) => console.log(error));
    return data;
  }

  useEffect(() => {
    setLoading(true);
    fetchLatestCovers(count, user).then(data => {
      setData(data);
      setLoading(false);
    });
  }, [count])

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

