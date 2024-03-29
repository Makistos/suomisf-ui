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
            const msg = data.response;
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
        <main className="all-content" id="publisher-page">
            <ConfirmDialog />
            <div className="mt-5 speeddial style={{ position: 'relative', height: '500px'}}">
                <Toast ref={toastRef} />
                {isAdmin(user) &&
                    <div>
                        <Tooltip position="left" target=".speeddial .speeddial-right .p-speeddial-action">

                        </Tooltip>
                        <SpeedDial className="speeddial-right"
                            model={dialItems}
                            direction="left"
                            type="semi-circle"
                            radius={80}
                        />
                    </div>
                }
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
                                    <PublisherForm publisher={data}
                                        onSubmitCallback={publisherFormCallback} />
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
                                        {data.editions && <EditionsStatsPanel editions={data.editions} />}
                                    </div>
                                    <div className="grid col-6 mb-5 p-3 justify-content-start">
                                        {data.links &&
                                            <LinkPanel links={data.links} />
                                        }
                                    </div>
                                </div>
                                <div className="grid col-12 mt-0 justify-content-center w-full">
                                    <TabView className="w-full" activeIndex={getActiveIndex()}>
                                        {data.editions && data.editions.length > 0 &&
                                            <TabPanel header="Painokset">
                                                <EditionList editions={data.editions} />
                                            </TabPanel>
                                        }
                                        {data.series && data.series.length > 0 &&
                                            <TabPanel key="series" header="Sarjat">
                                                <PubseriesList pubseriesList={data.series} />
                                            </TabPanel>
                                        }
                                        {data.magazines && data.magazines.length > 0 &&
                                            <TabPanel key="magazines" header="Lehdet">
                                                <MagazineList magazineList={data.magazines} />
                                            </TabPanel>
                                        }
                                    </TabView>
                                </div>
                            </div>
                        )
                }
            </div>
        </main >
    )
}

