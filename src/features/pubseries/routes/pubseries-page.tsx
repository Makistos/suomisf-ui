import React, { useState } from "react";
import { useParams } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";
import { ProgressSpinner } from "primereact/progressspinner";

import { getCurrenUser } from "../../../services/auth-service";
import { getApiContent } from "../../../services/user-service";
import { selectId } from "../../../utils";
import { EditionList } from "../../edition";
import { Pubseries } from "../types";
import { User } from "../../user";

const baseURL = 'pubseries/';

interface PubseriesPageProps {
    id: string | null;
}

let thisId = "";

export const PubseriesPage = ({ id }: PubseriesPageProps) => {
    const params = useParams();
    const user = getCurrenUser();
    const [loading, setLoading] = useState(true);
    try {
        thisId = selectId(params, id);
    } catch (e) {
        console.log(`${e} bookseries`);
    }

    const fetchPubseries = async (id: string, user: User | null): Promise<Pubseries> => {
        const url = baseURL + id;
        const response = await getApiContent(url, user).then(response => {
            setLoading(false);
            return response.data;
        })
            .catch((error) => console.log(error));
        return response;
    }

    const { isLoading, data } = useQuery({
        queryKey: ["pubseries", thisId],
        queryFn: () => fetchPubseries(thisId, user)
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
                        <div className="grid col-12 pb-0 justify-content-center">
                            <h1 className="maintitle">{data?.name}</h1>
                        </div>
                        <div className="grid col-12 justify-content-center">
                            <h2>({data?.publisher.name})</h2>
                        </div>
                    </div>
                    <div className="grid col-12 p-0 mt-5 justify-content-center">
                        {data?.editions && (
                            <EditionList
                                editions={data.editions.map(edition => edition)}
                                sort="author"
                            />
                        )}
                    </div>
                </>
            )}
        </main>
    )
}