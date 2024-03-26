import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ProgressSpinner } from "primereact/progressspinner";

import { getCurrenUser } from "../../../services/auth-service";
import { getApiContent } from "../../../services/user-service";
import { selectId } from "../../../utils";
import { EditionList } from "../../edition";
import { Pubseries } from "../types";
import { User } from "../../user";
import { useDocumentTitle } from '../../../components/document-title';
import { PubseriesForm } from "../components/pubseries-form";
import { Dialog } from "primereact/dialog";
import { SpeedDial } from "primereact/speeddial";

const baseURL = 'pubseries/';

interface PubseriesPageProps {
    id: string | null;
}

let thisId = "";

export const PubseriesPage = ({ id }: PubseriesPageProps) => {
    const params = useParams();
    const user = getCurrenUser();
    const [documentTitle, setDocumentTitle] = useDocumentTitle("");
    const [editSeries, setEditSeries] = useState(true);
    const [isEditVisible, setEditVisible] = useState(false);
    const [formData, setFormData]: [Pubseries | null, (formData: Pubseries | null) => void] = useState<Pubseries | null>(null);

    try {
        thisId = selectId(params, id);
    } catch (e) {
        console.log(`${e} bookseries`);
    }

    const dialItems = [
        {
            label: 'Muokkaa',
            icon: 'pi pi-fw pi-pencil',
            command: () => {
                if (data) {
                    setEditSeries(true);
                    setFormData(data);
                    setEditVisible(true);
                }
            }
        },
        {
            label: 'Poista',
            icon: 'pi pi-fw pi-trash',
            command: () => {
            }
        }
    ]
    const fetchPubseries = async (id: string, user: User | null): Promise<Pubseries> => {
        const url = baseURL + id;
        const response = await getApiContent(url, user).then(response => {
            return response.data;
        })
            .catch((error) => console.log(error));
        return response;
    }

    const { isLoading, data } = useQuery({
        queryKey: ["pubseries", thisId],
        queryFn: () => fetchPubseries(thisId, user)
    });

    useEffect(() => {
        if (data !== undefined)
            setDocumentTitle(data.name);
    }, [data])

    const queryClient = useQueryClient();

    const onDialogShow = () => {
        setEditVisible(true);
    }
    const onDialogHide = () => {
        queryClient.invalidateQueries({ queryKey: ["pubseries", data?.id] });
        setEditVisible(false);
    }

    return (
        <main className="all-content">
            <div className="mt-5 speeddial style={{ position: 'relative', height: 500px'}}">
                {isLoading ? (
                    <div className="progressbar">
                        <ProgressSpinner />
                    </div>

                ) : (
                    <>
                        <SpeedDial className="speeddial-right"
                            model={dialItems}
                            direction="left"
                            type="semi-circle"
                            radius={80}
                        />

                        <Dialog maximizable blockScroll
                            className="w-full lg:w-6"
                            header="Kustantajan sarjan muokkaus"
                            visible={isEditVisible}
                            onShow={() => onDialogShow()}
                            onHide={() => onDialogHide()}
                        >
                            <PubseriesForm
                                pubseries={formData}
                                onSubmitCallback={onDialogHide}
                            />

                        </Dialog>
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
            </div>
        </main>
    )
}