import { useEffect, useState } from "react"
import { useParams } from "react-router-dom";

import { TabPanel, TabView } from "primereact/tabview";
import { ProgressSpinner } from "primereact/progressspinner";

import { getCurrenUser } from "../../services/auth-service";
import { getApiContent } from "../../services/user-service";
import { IEdition } from "../../components/Edition";
import { EditionList } from "../../components/EditionList";
import { IPubseries } from "../../components/Pubseries";
import { EditionsStatsPanel } from "../Stats/Stats";
import { ILink } from "../../components/Link";
import { LinkPanel } from "../../components/Links";
import { PubseriesList } from "../../components/PubseriesList";

export interface IPublisher {
    description: string,
    edition_count?: number,
    edition_oldest?: number | null,
    edition_newest?: number | null,
    editions: IEdition[],
    fullname: string,
    id: number,
    image_attr?: string,
    image_count?: number,
    image_src?: string,
    links?: ILink[],
    name: string,
    series: IPubseries[]
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
        <main className="all-content">
            {
                loading ? (
                    <div className="progressbar">
                        <ProgressSpinner />
                    </div>
                )
                    : (publisher &&
                        <div className="grid col-12">
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
                                <div className="grid col-6 mb-5 p-3 justify-content-end">
                                    <EditionsStatsPanel editions={publisher.editions} />
                                </div>
                                <div className="grid col-6 mb-5 p-3 justify-content-start">
                                    {publisher.links &&
                                        <LinkPanel links={publisher.links} />
                                    }
                                </div>
                            </div>
                            <div className="grid col-12 mt-0 justify-content-center w-full">
                                <TabView className="w-full">
                                    <TabPanel key="editions" header="Painokset">
                                        <EditionList editions={publisher.editions} />
                                    </TabPanel>
                                    {publisher.series &&
                                        <TabPanel key="series" header="Sarjat">
                                            <PubseriesList pubseriesList={publisher.series} />
                                        </TabPanel>
                                    }
                                </TabView>
                            </div>
                        </div>
                    )
            }
        </main>
    )
}

