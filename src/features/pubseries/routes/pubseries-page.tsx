import React, { useState, useEffect, useRef } from "react";

import { useParams, useNavigate } from "react-router-dom";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { ProgressSpinner } from "primereact/progressspinner";
import { Dialog } from "primereact/dialog";
import { SpeedDial } from "primereact/speeddial";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { TabView, TabPanel } from "primereact/tabview";
import { DataView } from "primereact/dataview";

import { getCurrenUser } from "@services/auth-service";
import { getApiContent, HttpStatusResponse } from "@services/user-service";
import { selectId } from "../../../utils";
import { Edition, EditionList } from "@features/edition";
import { Pubseries } from "../types";
import { User, isAdmin } from "@features/user";
import { useDocumentTitle } from '@components/document-title';
import { PubseriesForm } from "../components/pubseries-form";
import { deletePubseries } from "@api/pubseries/delete-pubseries";
import { GenreGroup } from "@features/genre";
import { Genre } from "@features/genre/types";

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
    const toastRef = useRef<Toast>(null);

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

    const getGenres = (): Genre[] => {
        if (!data || !data.editions) return [];
        return data.editions
            .flatMap(edition => edition.work)
            .flatMap(work => work.genres || []);
    }

    const onDialogShow = () => {
        setEditVisible(true);
    }
    const onDialogHide = () => {
        queryClient.invalidateQueries({ queryKey: ["pubseries", data?.id] });
        setEditVisible(false);
    }

    return (
        <main className="pubseries-page">
            <Toast ref={toastRef} />

            {isAdmin(user) && (
                <SpeedDial
                    model={dialItems}
                    direction="up"
                    className="fixed-dial"
                    showIcon="pi pi-plus"
                    hideIcon="pi pi-times"
                    buttonClassName="p-button-primary"
                />
            )}

            {isLoading ? (
                <div className="flex justify-content-center">
                    <ProgressSpinner />
                </div>
            ) : (
                data && (
                    <div className="grid">
                        {/* Header Section */}
                        <div className="col-12">
                            <Card className="shadow-3">
                                <div className="grid pl-2 pr-2 pt-0">
                                    <div className="col-12 lg:col-9">
                                        <div className="flex-column">
                                            <h1 className="text-4xl font-bold m-0">{data.name}</h1>
                                            {data.important && (
                                                <div className="flex align-items-center gap-2 mt-3">
                                                    <i className="pi pi-star-fill text-yellow-500" />
                                                    <span>Merkittävä sarja</span>
                                                </div>
                                            )}

                                            {/* Description */}
                                            {data.description && (
                                                <div className="mt-3">
                                                    <div
                                                        className="text-base line-height-3"
                                                        dangerouslySetInnerHTML={{ __html: data.description }}
                                                    />
                                                </div>
                                            )}

                                            {/* Publisher info moved here */}
                                            <div className="grid mt-4">
                                                <div className="col-12 sm:col-6">
                                                    <div className="flex flex-column gap-2">
                                                        <h3 className="text-sm uppercase text-600 m-0">Kustantaja</h3>
                                                        <span className="text-xl">{data.publisher.name}</span>
                                                    </div>
                                                </div>
                                                <div className="col-12 sm:col-6">
                                                    <div className="flex flex-column gap-2">
                                                        <h3 className="text-sm uppercase text-600 m-0">Julkaisuja</h3>
                                                        <span className="text-xl">{data.editions?.length}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Genres on right side */}
                                    <div className="col-12 lg:col-3">
                                        <div className="flex flex-column gap-4">
                                            <h3 className="text-sm uppercase text-600 m-0">Genret</h3>
                                            <GenreGroup
                                                genres={getGenres()}
                                                showOneCount
                                                className="flex-wrap"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Links section */}
                                {data.links && data.links.length > 0 && (
                                    <div className="mt-4 pt-3 border-top-1 surface-border">
                                        <div className="flex flex-wrap gap-3">
                                            {data.links.map((link, index) => (
                                                <a
                                                    key={index}
                                                    href={link.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="no-underline text-primary hover:text-primary-700 flex align-items-center gap-2"
                                                >
                                                    <i className="pi pi-external-link text-sm" />
                                                    <span>{link.description}</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </div>

                        {/* Main Content */}
                        <div className="col-12">
                            <TabView className="shadow-2">
                                <TabPanel header="Kirjat" leftIcon="pi pi-book">
                                    <div className="card min-w-full">
                                        <EditionList editions={data.editions}
                                            sort="author" />
                                    </div>
                                </TabPanel>
                            </TabView>
                        </div>

                        {/* Dialogs */}
                        <Dialog
                            visible={isEditVisible}
                            onHide={onDialogHide}
                            header="Sarjan muokkaus"
                            maximizable
                            blockScroll
                            className="w-full xl:w-6"
                        >
                            <PubseriesForm pubseries={formData} onSubmitCallback={onDialogHide} />
                        </Dialog>
                    </div>
                )
            )}
        </main>
    );
};