import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCurrenUser } from "../services/auth-service";
import { getApiContent } from "../services/user-service";
import { IPublisher } from "../feature/Publisher/Publisher";
import { IEdition } from "./Edition";
import { EditionList } from "./EditionList";


const baseURL = 'pubseries/';

export interface IPubseries {
    id: number,
    name: string,
    orig_name: string,
    important: number,
    image_src: string,
    image_attr: string,
    publisher: IPublisher,
    editions: IEdition[]
}


export const Pubseries = () => {
    const params = useParams();
    const user = getCurrenUser();

    const [pubseries, setPubseries]: [IPubseries | null, (pubseries: IPubseries) => void] = useState<IPubseries | null>(null);

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