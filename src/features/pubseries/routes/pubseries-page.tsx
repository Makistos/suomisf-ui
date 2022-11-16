import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getCurrenUser } from "../../../services/auth-service";
import { getApiContent } from "../../../services/user-service";
import { EditionList } from "../../edition";
import { Pubseries } from "../types";


const baseURL = 'pubseries/';

export const PubseriesPage = () => {
    const params = useParams();
    const user = getCurrenUser();

    const [pubseries, setPubseries]: [Pubseries | null, (pubseries: Pubseries) => void] = useState<Pubseries | null>(null);

    useEffect(() => {
        async function getBookseries() {
            let url = baseURL + params.bookseriesId?.toString();
            try {
                const response = await getApiContent(url, user);
                setPubseries(response.data);
            } catch (e) {
                console.error(e);
            }
        }
        getBookseries();
    }, [params.bookseriesId, user])

    if (!pubseries)
        return null;

    return (
        <main className="all-content">
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
        </main>
    )
}