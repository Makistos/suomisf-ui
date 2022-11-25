import React from "react";
import { useParams } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";
import { ProgressSpinner } from "primereact/progressspinner";

import { getCurrenUser } from "../../../services/auth-service";
import { getApiContent } from "../../../services/user-service";
import { WorkList } from "../../work";
import { Bookseries } from "../types";
import { selectId } from "../../../utils";
import { User } from "../../user";

const baseURL = 'bookseries/';

interface BookseriesPageProps {
    id: string | null;
}

let thisId = "";

export const BookseriesPage = ({ id }: BookseriesPageProps) => {
    const params = useParams();
    const user = getCurrenUser();

    try {
        thisId = selectId(params, id);
    } catch (e) {
        console.log(`${e} bookseries.`);
    }

    const fetchBookseries = async (id: string, user: User | null): Promise<Bookseries> => {
        const url = baseURL + id;
        const data = await getApiContent(url, user).then(response =>
            response.data
        )
            .catch((error) => console.log(error));
        return data;
    }

    const { isLoading, data } = useQuery({
        queryKey: ["bookseries", thisId],
        queryFn: () => fetchBookseries(thisId, user)
    });

    return (
        <main className="all-content">
            {isLoading ? (
                <div className="progressbar">
                    <ProgressSpinner />
                </div>

            ) : (
                <>
                    <div className="mb-5">
                        <div className="grid col-12 mb-1 justify-content-center">
                            <h1 className="maintitle">{data?.name}</h1>
                        </div>
                        {data?.orig_name && (
                            <div className="grid col-12 mt-0 justify-content-center">
                                <h2>({data?.orig_name})</h2>
                            </div>
                        )}
                    </div>
                    {data &&
                        <div className="mt-5">
                            <WorkList works={data.works} />
                        </div>
                    }
                </>
            )}
        </main>
    )
}
