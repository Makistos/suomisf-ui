import React, { useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom";

import { TabPanel, TabView } from "primereact/tabview";
import { ProgressSpinner } from "primereact/progressspinner";
import { useMutation, useQuery } from "@tanstack/react-query";
import { SpeedDial } from "primereact/speeddial";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";

import { getCurrenUser } from "../../../services/auth-service";
import { HttpStatusResponse, deleteApiContent, getApiContent } from "../../../services/user-service";
import { EditionList } from "../../edition";
import { EditionsStatsPanel } from "../../stats";
import { LinkPanel } from "../../../components/link-panel";
import { PubseriesList } from "../../pubseries";
import { Publisher } from "../types";
import { selectId } from "../../../utils";
import { User, isAdmin } from "../../user";
import { useDocumentTitle } from '../../../components/document-title';
import { PublisherForm } from "../components/publisher-form";
import { isDisabled } from "../../../components/forms/forms";
import { Tooltip } from "primereact/tooltip";
import { MagazineList } from "../../magazine/components";
import { isAbsolute } from "path";
import { Card } from "primereact/card";

const baseURL = 'publishers/';

interface PublisherPageProps {
    id: string | null;
}

let thisId: string = "";

export const PublisherPage = ({ id }: PublisherPageProps) => {
    const params = useParams();
    const user = useMemo(() => { return getCurrenUser() }, []);
    const [documentTitle, setDocumentTitle] = useDocumentTitle("");
    const [isEditVisible, setEditVisible] = useState(false);
    const [queryEnabled, setQueryEnabled] = useState(true);
    const toastRef = useRef<Toast>(null);
    const navigate = useNavigate();

    try {
        thisId = selectId(params, id);
    } catch (e) {
        console.log(`${e} bookseries`);
    }

    const fetchPublisher = async (id: string, user: User | null): Promise<Publisher> => {
        const url = baseURL + id;
        const data = await getApiContent(url, user).then(response =>
            //console.log(response.data);
            response.data
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

    const deletePublisher = (id: number) => {
        setQueryEnabled(false);
        const retval = deleteApiContent('publishers/' + id);
        setQueryEnabled(true);
        return retval;
    }

    const { mutate } = useMutation({
        mutationFn: (values: number) => deletePublisher(values),
        onSuccess: (data: HttpStatusResponse) => {
            console.log(data);
            if (data.status === 200) {
                navigate(-1);
                toastRef.current?.show({ severity: 'success', summary: 'Kustantaja poistettu' })
            } else {
                toastRef.current?.show({ severity: 'error', summary: 'Kustantajan poisto ei onnistunut', detail: msg })
            }
        },
        onError: (error: any) => {
            const errMsg = JSON.parse(error.response).data["msg"];
            console.log(errMsg);
            toastRef.current?.show({ severity: 'error', summary: 'Kustantajan poisto ei onnistunut', detail: errMsg })
        }
    })

    const dialItems = [
        {
            label: 'Muokkaa',
            icon: 'fa-solid fa-pen-to-square',
            command: () => {
                setEditVisible(true);
            }
        },
        {
            label: 'Poista',
            icon: 'fa-solid fa-trash',
            disabled: isDisabled(user, isLoading) &&
                !(data !== undefined && data !== null &&
                    data.editions !== null && data.editions.length === 0 &&
                    data.magazines !== null && data.magazines.length === 0),
            command: () => {
                confirmDialog({
                    message: 'Haluatko varmasti poistaa kustantajan?',
                    header: 'Varmistus',
                    icon: 'pi pi-exclamation-triangle',
                    acceptClassName: 'p-button-danger',
                    accept: () => {
                        if (data) {
                            mutate(data.id);
                        }
                    },
                    reject: () => {
                        toastRef.current?.show({
                            severity: 'info',
                            summary: 'Kustantajaa ei poistettu'
                        })
                    }
                })
            }
        }
    ]

    const publisherFormCallback = (status: boolean, message: string) => {
        onDialogHide();
        if (status) {
            toastRef.current?.show({ severity: 'success', summary: 'Tallentaminen onnistui', detail: 'Tietojen päivitys onnistui', life: 4000 });
        } else {
            toastRef.current?.show({ severity: 'error', summary: 'Tietojen tallentaminen epäonnistui', detail: message, life: 4000 });
        }
    }

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
    const getActiveIndex = () => {
        if (data && data.editions && data.editions.length > 0) {
            return 0;
        }
        if (data && data.series && data.series.length > 0) {
            return 1;
        }
        return 2;
    }

    return (
        <main className="publisher-page">
            <Toast ref={toastRef} />
            <ConfirmDialog />
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
                                <div className="grid">
                                    <div className="col-12 lg:col-9">
                                        <div className="flex-column">
                                            <h1 className="text-4xl font-bold m-0">{data.name}</h1>
                                            {data.fullname && (
                                                <div className="text-xl text-600 mt-2">{data.fullname}</div>
                                            )}
                                            {data.description && (
                                                <div className="mt-3 line-height-3"
                                                    dangerouslySetInnerHTML={{ __html: data.description }}>
                                                </div>
                                            )}
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
                                                                <span>{link.description}</span>
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stats on right side */}
                                    <div className="col-12 lg:col-3">
                                        <div className="flex flex-column gap-4">
                                            <div className="flex flex-column gap-2">
                                                <h3 className="text-sm uppercase text-600 m-0">Julkaisuja</h3>
                                                <span className="text-xl">{data.editions.length}</span>
                                            </div>
                                            {data.series && data.series.length > 0 && (
                                                <div className="flex flex-column gap-2">
                                                    <h3 className="text-sm uppercase text-600 m-0">Sarjoja</h3>
                                                    <span className="text-xl">{data.series.length}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Main Content */}
                        <div className="col-12">
                            <TabView className="shadow-2">
                                <TabPanel header="Julkaisut" leftIcon="pi pi-book">
                                    <div className="card min-w-full p-2">
                                        <EditionList
                                            editions={data.editions.filter(ed => ed.publisher.id === Number(thisId))}
                                        />
                                    </div>
                                </TabPanel>

                                {data.series && data.series.length > 0 && (
                                    <TabPanel header="Sarjat" leftIcon="pi pi-list">
                                        <div className="card min-w-full">
                                            <PubseriesList
                                                pubseriesList={data.series}
                                            />
                                        </div>
                                    </TabPanel>
                                )}

                            </TabView>
                        </div>

                        {/* Dialogs */}
                        <Dialog
                            visible={isEditVisible}
                            onHide={onDialogHide}
                            header="Kustantajan muokkaus"
                            maximizable
                            blockScroll
                            className="w-full xl:w-6"
                        >
                            <PublisherForm publisher={data} onSubmitCallback={onDialogHide} />
                        </Dialog>
                    </div>
                )
            )}
        </main>
    );
};

