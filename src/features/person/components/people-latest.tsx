import { useState, useEffect } from "react";

import { ProgressSpinner } from "primereact/progressspinner";

import { getCurrenUser } from "../../../services/auth-service";
import { getApiContent } from "../../../services/user-service";
import { User } from "../../user";
import { Person } from "..";
import { PeopleList } from "./people-list";

interface PeopleLatestProps {
  count: string | number
}

export const PeopleLatest = ({ count }: PeopleLatestProps) => {
  const user = getCurrenUser();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Person[]>([]);

  const fetchLatestPeople = async (count: string | number, user: User | null): Promise<Person[]> => {
    const url = "latest/people/" + count;
    const data = await getApiContent(url, user).then(response =>
      response.data)
      .catch((error) => console.log(error));
    return data;
  }

  useEffect(() => {
    setLoading(true);
    fetchLatestPeople(count, user).then(data => {
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
          (<PeopleList people={data === undefined ? [] : data} />)
      }
    </>
  )
}
