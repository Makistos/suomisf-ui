import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { DataView } from "primereact/dataview";
import { Panel } from "primereact/panel";
import { Ripple } from "primereact/ripple";
import { Tooltip } from "primereact/tooltip";
import { SpeedDial } from "primereact/speeddial";
import { Toast } from "primereact/toast";
import { confirmDialog, ConfirmDialog } from "primereact/confirmdialog";
import { FileUpload, FileUploadHandlerEvent } from "primereact/fileupload";
import { Dialog } from "primereact/dialog";
import { ProgressSpinner } from "primereact/progressspinner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SelectButton } from 'primereact/selectbutton';
import axios from "axios";
import { Divider } from "primereact/divider";
import { Toolbar } from "primereact/toolbar";

import { Edition, EditionDetails } from "@features/edition";
import { getCurrenUser } from "@services/auth-service";
import { getApiContent, deleteApiContent } from "@services/user-service";
import { ShortsList } from "@features/short";
import { Work } from "../types";
import { WorkDetails } from "../components/work-details";
import { EditionForm } from "@features/edition/components/edition-form";
import { isAnthology } from "../utils/is-anthology";
import { selectId } from "../../../utils";
import { useDocumentTitle } from '@components/document-title';
import { WorkForm } from "../components/work-form";
import { User, isAdmin } from "@features/user";
import authHeader from "@services/auth-header";
import { HttpStatusResponse } from "@services/user-service"
import { WorkShortsPicker } from "@features/short/components/shorts-picker";
import { WorkChanges } from "@features/changes/components/work-changes";
import { groupSimilarEditions } from "@features/edition/utils/group-similar-editions";
import { combineEditions } from "@features/edition/utils/combine-editions";
import { deleteEditionImage } from "@api/edition/delete-edition-image";
import { ImageView } from "@utils/image-view";

import { Card } from "primereact/card";
import { TabView, TabPanel } from "primereact/tabview";
import { TagGroup } from "@features/tag";
import { GenreGroup } from "@features/genre";
import { AwardList, AwardPanel } from "@features/award";
export interface WorkProps {
    work: Work,
    detailLevel?: string,
    orderField?: string
}

const baseURL = "works/";

interface WorkPageProps {
    id: string | null;
}

let workId = "";


const renderListItem = (cb: any, onUpload: any, editions: Edition[],
    work?: Work) => {
    const user = useMemo(() => { return getCurrenUser() }, []);
    const [currIdx, setCurrIdx] = useState(0);
    let imageUploadUrl = '';
    if (editions.length === 1) {
        imageUploadUrl = `editions/${editions[0].id}/images`;
    } else {
    }
    const customSave = useCallback(async (event: FileUploadHandlerEvent) => {
        const form = new FormData();
        form.append('file', event.files[0], event.files[0].name);
        const file = event.files[0];
        const request = { file: file, filename: file.name };
        const headers = authHeader();

        const response = await axios.post(import.meta.env.VITE_API_URL + imageUploadUrl,
            form, {
            headers: headers
        });
        onUpload();
    }, [onUpload, imageUploadUrl]);

    const edition = combineEditions(editions, user);

    const deleteImage = useCallback((itemId: number, imageId: number) => {
        deleteEditionImage(itemId, imageId);
        onUpload();
    }, [onUpload]);

    return (
        (work && edition &&
            <div className="col-12">
                <div className="grid">
                    <div className="col-8" >
                        <EditionDetails edition={edition} card work={work}
                            onSubmitCallback={cb} />
                    </div>
                    <div className="flex col-4 justify-content-end align-content-center">
                        {edition.images.length > 0 ?
                            <ImageView
                                itemId={edition.id}
                                images={edition.images}
                                idx={currIdx}
                                deleteFunc={deleteImage}
                                idxCb={setCurrIdx} />
                            : isAdmin(user) &&
                            <FileUpload
                                id={"editionimage_" + edition.id}
                                mode="basic"
                                accept="image/*"
                                name="image"
                                uploadLabel="Lisää kuva"
                                auto
                                customUpload
                                uploadHandler={customSave}
                                onUpload={onUpload}
                            />
                        }
                    </div>
                </div>
            </div>
        )
    )
}

export const WorkPage = ({ id }: WorkPageProps) => {
    const params = useParams();
    const user = useMemo(() => { return getCurrenUser() }, []);
    const [documentTitle, setDocumentTitle] = useDocumentTitle("");
    const [isEditVisible, setEditVisible] = useState(false);
    const [queryEnabled, setQueryEnabled] = useState(true);
    const [isShortsFormVisible, setIsShortsFormVisible] = useState(false);
    const [formData, setFormData] = useState<Work | null>(null);
    const [editWork, setEditWork] = useState(true);
    const [isEditionFormVisible, setEditionFormVisible] = useState(false);
    const toastRef = useRef<Toast>(null);
    const navigate = useNavigate();
    const [detailLevel, setDetailLevel] = useState("condensed");

    try {
        workId = selectId(params, id);
    } catch (e) {
        console.log(`${e} work`);
    }

    const detailOptions = [
        { icon: 'pi pi-minus', value: 'brief' },
        { icon: 'pi pi-bars', value: 'condensed' },
        { icon: 'pi pi-align-justify', value: 'all' }
    ];

    type detailOptionType = {
        icon: string,
        value: string
    }

    const fetchWork = async (id: string, user: User | null): Promise<Work> => {
        let url = baseURL + workId;
        const data = await getApiContent(url, user).then(response =>
            response.data
        )
            .catch((error) => console.log(error));
        return data;
    }

    const { isLoading, data } = useQuery({
        queryKey: ["work", workId],
        queryFn: () => fetchWork(workId, user),
        enabled: queryEnabled
    })

    const deleteWork = (id: number) => {
        setQueryEnabled(false);
        const retval = deleteApiContent('works/' + id);
        setQueryEnabled(true);
        return retval;
    }

    const { mutate } = useMutation({
        mutationFn: (values: number) => deleteWork(values),
        onSuccess: (data: HttpStatusResponse) => {
            const msg = data.response;
            if (data.status === 200) {
                navigate(-1);
                toastRef.current?.show({ severity: 'success', summary: 'Teos poistettu' })
            } else {
                toastRef.current?.show({ severity: 'error', summary: 'Teoksen poisto ei onnistunut', detail: msg })
            }
        },
        onError: (error: any) => {
            const errMsg = JSON.parse(error.response).data["msg"];
            console.log(errMsg);
            toastRef.current?.show({ severity: 'error', summary: 'Teoksen poistaminen ei onnistunut', detail: errMsg })
        }
    })

    useEffect(() => {
        if (data !== undefined && data !== null) {
            setDocumentTitle(data.title);
        }
    }, [data]);

    const dialItems = [
        {
            label: 'Uusi teos',
            icon: 'fa-solid fa-circle-plus',
            command: () => {
                setEditWork(false);
                setFormData(null);
                setEditVisible(true);
            }
        },
        {
            label: 'Muokkaa',
            icon: 'fa-solid fa-pen-to-square',
            command: () => {
                if (data) {
                    setEditWork(true);
                    setFormData(data);
                    setEditVisible(true);
                }
            }
        },
        {
            label: 'Uusi painos',
            icon: 'fa-solid fa-file-circle-plus',
            command: () => {
                setEditionFormVisible(true);
            }
        },
        {
            label: 'Muokkaa novelleja',
            icon: 'fa-solid fa-list-ul',
            disabled: !(data !== undefined && data !== null &&
                data.work_type.id === 2),
            command: () => {
                setIsShortsFormVisible(true);

            }
        },
        {
            label: "Poista",
            icon: 'fa-solid fa-trash',
            disabled: !(data !== undefined && data !== null &&
                data.editions !== null),
            command: () => {
                confirmDialog({
                    message: 'Haluatko varmasti poistaa teoksen?',
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
                            summary: 'Teosta ei poistettu'
                        })
                    }
                })

            }
        }
    ]

    const queryClient = useQueryClient();
    useEffect(() => {
        if (data !== undefined && data !== null)
            setDocumentTitle(data.title);
    }, [data])

    const onUpload = useCallback(() => {
        toastRef.current?.show({ severity: 'info', summary: 'Success', detail: 'Kuva tallennettu' });
        queryClient.invalidateQueries({ queryKey: ["work", workId] });
    }, [workId]);

    const itemTemplate = (editions: Edition[]) => {
        if (!editions) {
            return;
        }
        return renderListItem(editionFormCallback, onUpload, editions,
            data);
    }

    const renderHeader = () => {
        return (<> </>
            // <div className="grid grid-nogutter">
            //     <div className="col" style={{ textAlign: 'left' }}>
            //         <DataViewLayoutOptions layout={layout}
            //             onChange={(e: DataViewLayoutOptionsChangeParams) => setLayout(e.value)} />
            //     </div>
            // </div>
        )
    }

    const header = renderHeader();

    /**
     * Generates the panel template based on the given options.
     *
     * @param {any} options - The options for generating the panel template.
     * @return {JSX.Element} - The panel template as a JSX element.
     */
    const panelTemplate = (options: any) => {
        const toggleIcon = options.collapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up';
        const className = `${options.className} justify-content-start`;
        const titleClassName = `${options.titleClassName} pl-1`;

        return (
            <div className={className}>
                <span className={titleClassName}>
                    Novellit
                </span>
                <button className={options.togglerClassName} onClick={options.onTogglerClick}>
                    <span className={toggleIcon}></span>
                    <Ripple />
                </button>
            </div>
        )
    }

    const onDialogShow = () => {
        setEditVisible(true);
        setQueryEnabled(false)
    }

    const onDialogHide = () => {
        queryClient.invalidateQueries({ queryKey: ["work", workId] });
        setQueryEnabled(true);
        setEditVisible(false);
    }

    const workFormCallback = (status: boolean, message: string) => {
        onDialogHide();
        if (status) {
            toastRef.current?.show({ severity: 'success', summary: 'Tallentaminen onnistui', detail: 'Tietojen päivitys onnistui', life: 4000 });
        } else {
            toastRef.current?.show({ severity: 'error', summary: 'Tietojen tallentaminen epäonnistui', detail: message, life: 6000 });
        }
    }
    const onEditionDialogShow = () => {
        setEditionFormVisible(true);
        setQueryEnabled(false)
    }

    const onEditionDialogHide = () => {
        queryClient.invalidateQueries({ queryKey: ["work", workId] });
        setQueryEnabled(true);
        setEditionFormVisible(false);
    }

    const editionFormCallback = (status: boolean, message: string) => {
        onEditionDialogHide();
        if (status) {
            toastRef.current?.show({ severity: 'success', summary: 'Tallentaminen onnistui', detail: 'Tietojen päivitys onnistui', life: 4000 });
        } else {
            toastRef.current?.show({ severity: 'error', summary: 'Tietojen tallentaminen epäonnistui', detail: message, life: 6000 });
        }
    }

    const onShortsFormShow = () => {
        setIsShortsFormVisible(true);
    }

    const onShortsFormHide = () => {
        setIsShortsFormVisible(false);
        queryClient.invalidateQueries({ queryKey: ["work"] });
    }

    const detailTemplate = (option: detailOptionType) => {
        return <i className={option.icon}></i>
    }

    if (!data) return null;

    const anthology = isAnthology(data);

    const startContent = () => {
        // console.log(detailLevel)
        if (detailLevel === "all") {
            return (
                <h2>Painokset</h2>
            )
        }
        if (detailLevel === "condensed") {
            return (
                <h2>Painokset tiivistettynä</h2>
            )
        }
        if (detailLevel === "brief") {
            return (
                <h2>Laitokset</h2>
            )
        }
    }

    const changeDetailLevel = (level: string) => {
        setDetailLevel(level);
    }

    const endContent = (
        <SelectButton value={detailLevel} options={detailOptions}
            optionLabel="icon"
            id="details"
            onChange={(e) => changeDetailLevel(e.value)}
            itemTemplate={detailTemplate}
        />
    )

    const sortEditions = (a: Edition[], b: Edition[]): number => {
        const first = a[0];
        const second = b[0];
        if (first.pubyear !== second.pubyear) return (Number(first.pubyear) < Number(second.pubyear) ? -1 : 1);
        if (first.version !== second.version) return (first.version < second.version ? -1 : 1);
        return (Number(first.editionnum) < Number(second.editionnum) ? -1 : 1);
    }
    return (
        <main className="work-page">
            <Toast ref={toastRef} />

            {/* Add SpeedDial */}
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

                                            <div>
                                                <WorkDetails work={data} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Genres and tags on right side */}
                                    <div className="col-12 lg:col-3">
                                        <div className="flex flex-column gap-4">
                                            <div className="flex flex-column gap-2">
                                                <h3 className="text-sm uppercase text-600 m-0">Genret</h3>
                                                <GenreGroup
                                                    genres={data.genres}
                                                    showOneCount
                                                    className="flex-wrap"
                                                />
                                            </div>

                                            {data.tags && data.tags.length > 0 && (
                                                <div className="flex flex-column gap-2">
                                                    <h3 className="text-sm uppercase text-600 m-0">Asiasanat</h3>
                                                    <TagGroup
                                                        tags={data.tags}
                                                        overflow={5}
                                                        showOneCount
                                                    />
                                                </div>
                                            )}
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
                                <TabPanel header="Painokset" leftIcon="pi pi-book">
                                    <div className="card">
                                        <div className="flex justify-content-between align-items-center mb-3">
                                            <h2 className="m-0">Painokset</h2>
                                            <SelectButton
                                                value={detailLevel}
                                                options={detailOptions}
                                                optionLabel="icon"
                                                onChange={(e) => changeDetailLevel(e.value)}
                                                itemTemplate={detailTemplate}
                                            />
                                        </div>
                                        <DataView
                                            value={groupSimilarEditions(data.editions, detailLevel).sort(sortEditions)}
                                            itemTemplate={itemTemplate}
                                        />
                                    </div>
                                </TabPanel>

                                {/* Add new Awards tab */}
                                {data.awards && data.awards.length > 0 && (
                                    <TabPanel header="Palkinnot" leftIcon="pi pi-trophy">
                                        <div className="card">
                                            <AwardList awards={data.awards} />
                                        </div>
                                    </TabPanel>
                                )}

                                {data.stories.length > 0 && (
                                    <TabPanel header="Novellit" leftIcon="pi pi-list">
                                        <ShortsList
                                            shorts={data.stories}
                                            person={data.authors[0]}
                                            anthology={anthology}
                                        />
                                    </TabPanel>
                                )}

                                <TabPanel header="Muutoshistoria" leftIcon="pi pi-history">
                                    <WorkChanges workId={data.id} />
                                </TabPanel>
                            </TabView>
                        </div>

                        {/* Dialogs */}
                        <Dialog
                            visible={isEditVisible}
                            onHide={onDialogHide}
                            header="Teoksen muokkaus"
                            maximizable
                            blockScroll
                            className="w-full xl:w-6"
                        >
                            <WorkForm
                                workId={!formData || !editWork ? null : workId}
                                onSubmitCallback={workFormCallback}
                            />
                        </Dialog>
                    </div>
                )
            )}
        </main>
    );
}