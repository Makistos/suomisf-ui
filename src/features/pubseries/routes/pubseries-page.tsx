import React, { useState, useEffect } from "react";

import { useParams, useNavigate } from "react-router-dom";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { ProgressSpinner } from "primereact/progressspinner";
import { Dialog } from "primereact/dialog";
import { SpeedDial } from "primereact/speeddial";

import { getCurrenUser } from "@services/auth-service";
import { getApiContent, HttpStatusResponse } from "@services/user-service";
import { selectId } from "../../../utils";
import { EditionList } from "@features/edition";
import { Pubseries } from "../types";
import { User, isAdmin } from "@features/user";
import { useDocumentTitle } from '@components/document-title';
import { PubseriesForm } from "../components/pubseries-form";
import { deletePubseries } from "@api/pubseries/delete-pubseries";

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
    const navigate = useNavigate();

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
                if (data) {
                    mutate(data.id);
                }
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

    const { mutate } = useMutation({
        mutationFn: (values: number) => deletePubseries(values),
        onSuccess: (data: HttpStatusResponse) => {
            const msg = data.response;
            if (data.status === 200) {
                navigate(-1);

            }
        },
        onError: (error: any) => {
            const errMsg = JSON.parse(error.response).data["msg"];
            console.log(errMsg);
        }
    })
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
                        {isAdmin(user) &&
                            <SpeedDial className="speeddial-right"
                                model={dialItems}
                                direction="left"
                                type="semi-circle"
                                radius={80}
                            />
                        }
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