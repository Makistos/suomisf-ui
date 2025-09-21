import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { ProgressSpinner } from "primereact/progressspinner";
import { Tooltip } from "primereact/tooltip";
import { SpeedDial } from "primereact/speeddial";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getCurrenUser } from "../../../services/auth-service";
import { deleteApiContent, getApiContent } from "../../../services/user-service";
import { WorkList } from "../../work";
import { Bookseries } from "../types";
import { selectId } from "../../../utils";
import { User, isAdmin } from "../../user";
import { useDocumentTitle } from '../../../components/document-title';
import { BookseriesForm } from "../components/bookseries-form";
import { Card } from "primereact/card";
import { TabPanel, TabView } from "primereact/tabview";
import { DataView, DataViewLayoutOptions } from "primereact/dataview";
import { GenreGroup } from "../../genre";
import { Genre } from "../../genre/types";

const baseURL = 'bookseries/';

interface BookseriesPageProps {
    id: string | null;
}

let thisId = "";

export const BookseriesPage = ({ id }: BookseriesPageProps) => {
    const params = useParams();
    const user = getCurrenUser();
    const [documentTitle, setDocumentTitle] = useDocumentTitle("");
    const [formData, setFormData] = useState<Bookseries | null>(null);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [queryEnabled, setQueryEnabled] = useState(true)
    const [formHeader, setFormHeader] = useState("")

    const toast = useRef<Toast>(null);
    const navigate = useNavigate();

    try {
        thisId = selectId(params, id);
    } catch (e) {
        console.log(`${e} bookseries.`);
    }

    const fetchBookseries = async (id: string, user: User | null): Promise<Bookseries> => {
        const url = baseURL + id;
        const data = await getApiContent(url, user).then(response =>
            response.data
        )
            .catch((error) => console.log(error));
        return data;
    }

    const { isLoading, isError, data } = useQuery({
        queryKey: ["bookseries", thisId],
        queryFn: () => fetchBookseries(thisId, user),
        enabled: queryEnabled
    });

    useEffect(() => {
        if (data !== undefined && data !== null)
            setDocumentTitle(data.name);
    }, [data])

    const dialItems = [
        {
            label: 'Uusi kirjasarja',
            icon: 'fa-solid fa-circle-plus',
            command: () => {

                setFormData(null)
                setFormHeader("Uusi kirjasarja")
                setIsFormVisible(true)
            }
        },
        {
            label: 'Muokkaa',
            icon: 'fa-solid fa-pen-to-square',
            command: () => {
                if (data) {
                    setFormData(data);
                    setFormHeader("Muokkaa kirjasarjaa");
                    setIsFormVisible(true);
                }
            }
        },
        {
            label: 'Poista',
            icon: 'pi pi-trash',
            command: () => {
                if (data) {
                    deleteApiContent('bookseries/' + data.id);
                    queryClient.invalidateQueries({ queryKey: ['bookseries'] });
                    navigate(-1);
                }
            }
        }
    ]

    const queryClient = useQueryClient()

    const getGenres = (): Genre[] => {
        if (!data || !data.works) return [];
        return data.works.flatMap(work => work.genres || []);
    }

    const onDialogHide = () => {
        toast.current?.show({
            severity: 'success', summary: 'Tallentaminen onnistui',
            detail: 'Tietojen päivitys onnistui', life: 4000
        });
        setQueryEnabled(true);
        setIsFormVisible(false);
        queryClient.invalidateQueries({ queryKey: ['bookseries'] });
    }

    const onDialogShow = () => {
        setIsFormVisible(true);
        setQueryEnabled(false);
    }

    if (isError) {

    }

    return (
        <main className="bookseries-page">
            <Toast ref={toast} />

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
                                            {data.orig_name && data.orig_name !== ''} <h2>{data.orig_name}</h2>
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
                                        <WorkList works={data.works} />
                                    </div>
                                </TabPanel>
                            </TabView>
                        </div>

                        {/* Dialogs */}
                        <Dialog
                            visible={isFormVisible}
                            onHide={onDialogHide}
                            header="Sarjan muokkaus"
                            maximizable
                            blockScroll
                            className="w-full xl:w-6"
                        >
                            <BookseriesForm data={data} onSubmitCallback={onDialogHide} />
                        </Dialog>
                    </div>
                )
            )}
        </main >
    );
};
