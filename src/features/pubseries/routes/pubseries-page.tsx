import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";

import { ProgressSpinner } from "primereact/progressspinner";

import { getCurrenUser } from "../../../services/auth-service";
import { getApiContent } from "../../../services/user-service";
import { selectId } from "../../../utils";
import { EditionList } from "../../edition";
import { Pubseries } from "../types";

const baseURL = 'pubseries/';

interface PubseriesPageProps {
    id: string | null;
}

let thisId = "";

export const PubseriesPage = ({ id }: PubseriesPageProps) => {
    const params = useParams();
    const user = useMemo(() => { return getCurrenUser() }, []);
    const [loading, setLoading] = useState(true);
    const [pubseries, setPubseries]: [Pubseries | null, (pubseries: Pubseries) => void] = useState<Pubseries | null>(null);

    try {
        thisId = selectId(params, id);
    } catch (e) {
        console.log(`${e} pubseries.`);
    }

    useEffect(() => {
        async function getBookseries() {
            let url = baseURL + thisId;
            try {
                setLoading(true);
                const response = await getApiContent(url, user);
                setPubseries(response.data);
                setLoading(false);
            } catch (e) {
                console.error(e);
            }
        }
        getBookseries();
    }, [params.itemId, id, user])

    if (!pubseries)
        return null;

    return (
        <main className="all-content">
            {loading ? (
                <div className="progressbar">
                    <ProgressSpinner />
                </div>

            ) : (
                <>
                    <div className="mb-5">
                        <div className="grid col-12 pb-0 justify-content-center">
                            <h1 className="maintitle">{pubseries.name}</h1>
                        </div>
                        <div className="grid col-12 justify-content-center">
                            <h2>({pubseries.publisher.name})</h2>
                        </div>
                    </div>
                    <div className="grid col-12 p-0 mt-5 justify-content-center">
                        {pubseries.editions && (
                            <EditionList
                                editions={pubseries.editions.map(edition => edition)}
                                sort="author"
                            />
                        )}
                    </div>
                </>
            )}
        </main>
    )
}