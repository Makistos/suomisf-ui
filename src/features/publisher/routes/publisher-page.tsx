import React, { useEffect, useState, useMemo } from "react"
import { useParams } from "react-router-dom";

import { TabPanel, TabView } from "primereact/tabview";
import { ProgressSpinner } from "primereact/progressspinner";

import { getCurrenUser } from "../../../services/auth-service";
import { getApiContent } from "../../../services/user-service";
import { EditionList } from "../../edition";
import { EditionsStatsPanel } from "../../stats";
import { LinkPanel } from "../../../components/link-panel";
import { PubseriesList } from "../../pubseries";
import { Publisher } from "../types";

const baseURL = 'publishers/';

interface PublisherPageProps {
    id: string | null;
}

let publisherId: string = "";

export const PublisherPage = ({ id }: PublisherPageProps) => {
    const params = useParams();
    const user = useMemo(() => { return getCurrenUser() }, []);

    if (params !== undefined && params.publisherId !== undefined) {
        publisherId = params.publisherId.toString();
    } else if (id !== null) {
        publisherId = id;
    } else {
        console.log("No id given for Publisher.")
    }

    const [publisher, setPublisher]: [Publisher | null, (publisher: Publisher) => void] =
        useState<Publisher | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function getPublisher() {
            const url = baseURL + publisherId.toString();
            try {
                const response = await getApiContent(url, user);
                setPublisher(response.data);
                setLoading(false);
            } catch (e) {
                console.error(e);
            }
        }
        getPublisher();
        // eslint-disable-line react-hooks/exhaustive-deps
    }, [user, publisherId])

    return (
        <main className="all-content">
            {
                loading ? (
                    <div className="progressbar">
                        <p>Haetaan tietoja..</p>
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

