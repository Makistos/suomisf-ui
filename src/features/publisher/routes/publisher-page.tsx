import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom";

import { TabPanel, TabView } from "primereact/tabview";
import { ProgressSpinner } from "primereact/progressspinner";
import { useQuery } from "@tanstack/react-query";

import { getCurrenUser } from "../../../services/auth-service";
import { getApiContent } from "../../../services/user-service";
import { EditionList } from "../../edition";
import { EditionsStatsPanel } from "../../stats";
import { LinkPanel } from "../../../components/link-panel";
import { PubseriesList } from "../../pubseries";
import { Publisher } from "../types";
import { selectId } from "../../../utils";
import { User } from "../../user";
import { useDocumentTitle } from '../../../components/document-title';
import { SpeedDial } from "primereact/speeddial";
import { Dialog } from "primereact/dialog";
import { PublisherForm } from "../components/publisher-form";

const baseURL = 'publishers/';

interface PublisherPageProps {
    id: string | null;
}

let thisId: string = "";

export const PublisherPage = ({ id }: PublisherPageProps) => {
    const params = useParams();
    const user = getCurrenUser();
    const [documentTitle, setDocumentTitle] = useDocumentTitle("");
    const [isEditVisible, setEditVisible] = useState(false);
    const [queryEnabled, setQueryEnabled] = useState(true);
    try {
        thisId = selectId(params, id);
    } catch (e) {
        console.log(`${e} bookseries`);
    }

    const fetchPublisher = async (id: string, user: User | null): Promise<Publisher> => {
        const url = baseURL + id;
        const data = await getApiContent(url, user).then(response => {
            console.log(response.data);
            return response.data;
        }
        )
            .catch((error) => console.log(error));
        return data;
    }

    const { isLoading, data } = useQuery({
        queryKey: ["publisher", thisId],
        queryFn: () => fetchPublisher(thisId, user),
        enabled: queryEnabled
    });

    useEffect(() => {
        if (data !== undefined)
            setDocumentTitle(data.name);
    }, [data])

    const dialItems = [
        {
            label: 'Muokkaa',
            icon: 'fa-solid fa-pen-to-square',
            command: () => {
                setEditVisible(true);
                //ConfirmEdit();
            }
        }
    ]

    const onDialogShow = () => {
        setQueryEnabled(false);
        // if (enableQueries) {
        //     enableQueries(false);
        // }
    }

    const onDialogHide = () => {
        setQueryEnabled(true);
        setEditVisible(false);
    }

    return (
        <main className="all-content" id="publisher-page">
            <div className="mt-5 speeddial style={{ position: 'relative', height: '500px'}}">
                <div>
                    <SpeedDial className="speeddial-right"
                        model={dialItems}
                        direction="left"
                        type="semi-circle"
                        radius={80}
                    />
                </div>
                {
                    isLoading ? (
                        <div className="progressbar">
                            <ProgressSpinner />
                        </div>
                    )
                        : (data &&
                            <div className="grid col-12">
                                <Dialog maximizable blockScroll
                                    header="Kustantajan muokkaus" visible={isEditVisible}
                                    onShow={() => onDialogShow()}
                                    onHide={() => onDialogHide()}
                                >
                                    <PublisherForm publisher={data} onSubmitCallback={setEditVisible} />
                                </Dialog>

                                <div className="grid mb-5 col-12 justify-content-center">
                                    <div className="grid justify-content-center">
                                        <h1 className="maintitle">{data.fullname}</h1>
                                    </div>
                                    {data.name && data.name !== data.fullname &&
                                        <div className="grid col-12 p-0 mt-0 justify-content-center">
                                            <h2 data-testid="short-name">({data.name})</h2>
                                        </div>
                                    }
                                </div>
                                <div className="grid col-12 mb-5 justify-content-center">
                                    <div className="grid col-6 mb-5 p-3 justify-content-end">
                                        <EditionsStatsPanel editions={data.editions} />
                                    </div>
                                    <div className="grid col-6 mb-5 p-3 justify-content-start">
                                        {data.links &&
                                            <LinkPanel links={data.links} />
                                        }
                                    </div>
                                </div>
                                <div className="grid col-12 mt-0 justify-content-center w-full">
                                    <TabView className="w-full">
                                        <TabPanel key="editions" header="Painokset">
                                            <EditionList editions={data.editions} />
                                        </TabPanel>
                                        {data.series &&
                                            <TabPanel key="series" header="Sarjat">
                                                <PubseriesList pubseriesList={data.series} />
                                            </TabPanel>
                                        }
                                    </TabView>
                                </div>
                            </div>
                        )
                }
            </div>
        </main>
    )
}

