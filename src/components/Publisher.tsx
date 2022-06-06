import { useFormikContext } from "formik"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom";
import { getCurrenUser } from "../services/auth-service";
import { getApiContent } from "../services/user-service";
import { IEdition } from "./Edition";
import { EditionList } from "./EditionList";
import { IPubseries } from "./Pubseries";
import { ProgressSpinner } from "primereact/progressspinner";
import { Button } from "primereact/button";
import { OverlayPanel } from "primereact/overlaypanel";
import { EditionsStatsPanel } from "./Stats";
import { TabPanel, TabView } from "primereact/tabview";

export interface IPublisher {
    description: string,
    editions: IEdition[],
    fullname: string,
    id: number,
    image_attr?: string,
    image_src?: string,
    name: string,
    series: IPubseries[]
}

interface PublisherProps {
    id: number
}

const baseURL = 'publishers/';

export const Publisher = () => {
    const params = useParams();
    const user = getCurrenUser();

    const [publisher, setPublisher]: [IPublisher | null, (publisher: IPublisher) => void] =
        useState<IPublisher | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function getPublisher() {
            const url = baseURL + params.publisherId?.toString();
            try {
                const response = await getApiContent(url, user);
                setPublisher(response.data);
                setLoading(false);
            } catch (e) {
                console.error(e);
            }
        }
        getPublisher();
    }, [params.publisherId, user])

    return (
        <main className="mt-5">
            {
                loading ? (
                    <div className="progressbar">
                        <ProgressSpinner />
                    </div>
                )
                    : (publisher &&
                        <div>
                            <div className="grid mb-5 col-12 justify-content-center">
                                <div className="grid justify-content-center">
                                    <h1 className="maintitle">{publisher.fullname}</h1>
                                </div>
                                {publisher.name && publisher.name !== publisher.fullname &&
                                    <div className="grid col-12 p-0 mt-0 justify-content-center">
                                        <h2>({publisher.name})</h2>
                                    </div>
                                }
                            </div>
                            <div className="grid col-12 mb-5 justify-content-center">
                                <EditionsStatsPanel editions={publisher.editions} />
                            </div>
                            <div className="grid col-12 mt-0 justify-content-center">
                                <TabView>
                                    <TabPanel key="editions" header="Painokset">
                                        <EditionList editions={publisher.editions} />
                                    </TabPanel>
                                    <TabPanel key="series" header="Sarjat">

                                    </TabPanel>
                                </TabView>
                            </div>
                        </div>
                    )
            }
        </main>
    )
}

